import { NextResponse } from "next/server";
import { fetchIndex, fetchExercisesBatch } from "@/lib/github-raw";

/**
 * GET /api/insights
 *
 * Live, dataset-only characterization of the exercise collection (not the review study).
 * Computed from the published repository: branch `main` (validated) and branch `community`.
 * Individual exercise fetches are cached for 5 minutes (see fetchExercisesBatch); the index
 * itself is always read fresh, so composition counts update immediately after a review action.
 */

type Doc = Record<string, unknown>;

interface Bucket {
  label: string;
  count: number;
  pct: number;
}

interface TrackStats {
  total: number;
  byStatus: Bucket[];
  categories: Bucket[];
  bodyParts: Bucket[];
  regions: Bucket[];
  bodyPartsPerExercise: number;
  equipmentNeed: Bucket[];
  topEquipment: Bucket[];
  location: Bucket[];
  effects: Bucket[];
  effectsPerExercise: number;
  instructions: { avgSteps: number; medianSteps: number; avgWords: number; medianWords: number };
  metricsCoverage: number;
  topMetricTypes: Bucket[];
  relationshipsCoverage: number;
  variationsCoverage: number;
  notesCoverage: number;
  imageCoverage: number;
  schema: { rule: string; passPct: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  unreviewed: "Unreviewed",
  accepted: "Accepted",
  accepted_with_edits: "Accepted with edits",
  rejected: "Rejected",
};

const HOUSEHOLD = new Set([
  "chair", "wall", "desk", "table", "stairs", "step", "doorway", "towel",
  "railing", "soft_ball", "cones", "helmet", "walking_poles", "bicycle",
]);

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function pretty(s: string): string {
  return s.replace(/_/g, " ");
}

function canonEquipment(e: string): string {
  const n = norm(e);
  return n === "dumbbells" ? "dumbbell" : n === "resistance_bands" ? "resistance_band" : n;
}

function regionOf(bp: string): string {
  const b = norm(bp);
  if (b.includes("full")) return "Full body";
  if (/(neck|head|eye|jaw|face|scalp)/.test(b)) return "Neck and head";
  if (/(shoulder|chest|bicep|tricep|forearm|upper_back|lat|trap|arm|wrist|hand|finger|thumb|elbow)/.test(b)) return "Upper body";
  if (/(glute|hamstring|quad|calf|calves|hip|adductor|abductor|thigh|ankle|foot|feet|knee|leg|toe|tibial|groin)/.test(b)) return "Lower body";
  if (/(core|abdominal|oblique|lower_back|spine|diaphragm|trunk|breathing|^back$)/.test(b)) return "Core and trunk";
  return "Other";
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mean(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function topBuckets(counts: Map<string, number>, total: number, limit: number): Bucket[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label: pretty(label), count, pct: total ? count / total : 0 }));
}

function computeStats(docs: Doc[]): TrackStats {
  const total = docs.length;
  const inc = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

  const statusCounts = new Map<string, number>();
  const catCounts = new Map<string, number>();
  const bpCounts = new Map<string, number>();
  const regionCounts = new Map<string, number>();
  const equipCounts = new Map<string, number>();
  const effectCounts = new Map<string, number>();
  const metricTypeCounts = new Map<string, number>();
  const locCounts = new Map<string, number>();
  const equipNeedCounts = new Map<string, number>();

  let bodyPartTotal = 0;
  let effectTotal = 0;
  let withMetric = 0;
  let withRelationship = 0;
  let withVariation = 0;
  let withNotes = 0;
  let withImage = 0;
  const stepCounts: number[] = [];
  const wordCounts: number[] = [];

  const schemaCounts = {
    category: 0, bodyPart: 0, location: 0, twoSteps: 0, noEmptyStep: 0,
    image: 0, metric: 0, relTargetsResolve: 0, relTargetsTotal: 0,
  };

  const ids = new Set(docs.map((d) => String(d.id)));

  for (const d of docs) {
    const status = String((d.metadata as Doc | undefined)?.reviewStatus ?? "unreviewed");
    inc(statusCounts, status);

    const categories = Array.isArray(d.categories) ? (d.categories as string[]) : [];
    categories.forEach((c) => inc(catCounts, norm(c)));
    schemaCounts.category += categories.length > 0 ? 1 : 0;

    const bodyParts = Array.isArray(d.bodyParts) ? (d.bodyParts as string[]) : [];
    bodyParts.forEach((b) => inc(bpCounts, norm(b)));
    new Set(bodyParts.map(regionOf)).forEach((r) => inc(regionCounts, r));
    bodyPartTotal += bodyParts.length;
    schemaCounts.bodyPart += bodyParts.length > 0 ? 1 : 0;

    const equipment = Array.isArray(d.equipment) ? (d.equipment as string[]) : [];
    equipment.forEach((e) => inc(equipCounts, canonEquipment(e)));
    const need = equipment.length === 0 ? "none" : equipment.every((e) => HOUSEHOLD.has(canonEquipment(e))) ? "household" : "equipment";
    inc(equipNeedCounts, need);

    const location = Array.isArray(d.location) ? (d.location as string[]) : [];
    const locSet = new Set(location.map(norm));
    const locKey = locSet.has("indoor") && locSet.has("outdoor") ? "both" : locSet.has("indoor") ? "indoor" : locSet.has("outdoor") ? "outdoor" : "unspecified";
    inc(locCounts, locKey);
    schemaCounts.location += (location.length > 0 && [...locSet].every((l) => l === "indoor" || l === "outdoor")) ? 1 : 0;

    const effects = Array.isArray(d.exerciseEffects) ? (d.exerciseEffects as string[]) : [];
    effects.forEach((e) => inc(effectCounts, norm(e)));
    effectTotal += effects.length;

    const instructions = Array.isArray(d.instructions) ? (d.instructions as Doc[]) : [];
    stepCounts.push(instructions.length);
    schemaCounts.twoSteps += instructions.length >= 2 ? 1 : 0;
    const descriptions = instructions.map((s) => String(s.description ?? ""));
    schemaCounts.noEmptyStep += descriptions.every((s) => s.trim().length > 0) ? 1 : 0;
    const words = descriptions.join(" ").split(/\s+/).filter(Boolean).length;
    wordCounts.push(words);

    const metrics = Array.isArray(d.performanceMetrics) ? (d.performanceMetrics as Doc[]) : [];
    if (metrics.length > 0) withMetric++;
    schemaCounts.metric += metrics.length > 0 ? 1 : 0;
    metrics.forEach((m) => inc(metricTypeCounts, norm(m.type)));

    const relationships = Array.isArray(d.relationships) ? (d.relationships as Doc[]) : [];
    if (relationships.length > 0) withRelationship++;
    for (const r of relationships) {
      const target = r.target as Doc | undefined;
      if (target?.id) {
        schemaCounts.relTargetsTotal++;
        if (ids.has(String(target.id))) schemaCounts.relTargetsResolve++;
      }
    }

    const variations = Array.isArray(d.variations) ? (d.variations as unknown[]) : [];
    if (variations.length > 0) withVariation++;

    const notes = Array.isArray(d.commentsNotes) ? (d.commentsNotes as unknown[]) : [];
    if (notes.length > 0) withNotes++;

    const images = Array.isArray((d.mediaContent as Doc | undefined)?.imageURLs) ? ((d.mediaContent as Doc).imageURLs as unknown[]) : [];
    if (images.length > 0) withImage++;
    schemaCounts.image += images.length > 0 ? 1 : 0;
  }

  const byStatus = ["unreviewed", "accepted", "accepted_with_edits", "rejected"]
    .filter((s) => statusCounts.has(s))
    .map((s) => ({ label: STATUS_LABEL[s] ?? pretty(s), count: statusCounts.get(s)!, pct: total ? statusCounts.get(s)! / total : 0 }));

  const equipmentNeed = [
    { label: "No equipment", count: equipNeedCounts.get("none") ?? 0 },
    { label: "Household or environment", count: equipNeedCounts.get("household") ?? 0 },
    { label: "Exercise equipment", count: equipNeedCounts.get("equipment") ?? 0 },
  ].map((b) => ({ ...b, pct: total ? b.count / total : 0 }));

  const location = [
    { label: "Indoor and outdoor", count: locCounts.get("both") ?? 0 },
    { label: "Indoor only", count: locCounts.get("indoor") ?? 0 },
    { label: "Outdoor only", count: locCounts.get("outdoor") ?? 0 },
  ].map((b) => ({ ...b, pct: total ? b.count / total : 0 }));

  const schemaPct = (n: number) => (total ? n / total : 0);

  return {
    total,
    byStatus,
    categories: topBuckets(catCounts, total, 5).sort((a, b) => b.count - a.count),
    bodyParts: topBuckets(bpCounts, total, 12),
    regions: topBuckets(regionCounts, total, 6),
    bodyPartsPerExercise: total ? bodyPartTotal / total : 0,
    equipmentNeed,
    topEquipment: topBuckets(equipCounts, total, 10),
    location,
    effects: topBuckets(effectCounts, total, 10),
    effectsPerExercise: total ? effectTotal / total : 0,
    instructions: {
      avgSteps: mean(stepCounts), medianSteps: median(stepCounts),
      avgWords: mean(wordCounts), medianWords: median(wordCounts),
    },
    metricsCoverage: total ? withMetric / total : 0,
    topMetricTypes: topBuckets(metricTypeCounts, total, 6),
    relationshipsCoverage: total ? withRelationship / total : 0,
    variationsCoverage: total ? withVariation / total : 0,
    notesCoverage: total ? withNotes / total : 0,
    imageCoverage: total ? withImage / total : 0,
    schema: [
      { rule: "Has at least one category", passPct: schemaPct(schemaCounts.category) },
      { rule: "Has at least one body part", passPct: schemaPct(schemaCounts.bodyPart) },
      { rule: "Location set to indoor and/or outdoor", passPct: schemaPct(schemaCounts.location) },
      { rule: "Has at least two instruction steps", passPct: schemaPct(schemaCounts.twoSteps) },
      { rule: "No empty instruction step", passPct: schemaPct(schemaCounts.noEmptyStep) },
      { rule: "Has at least one image", passPct: schemaPct(schemaCounts.image) },
      { rule: "Has at least one performance metric", passPct: schemaPct(schemaCounts.metric) },
      {
        rule: "Relationship targets resolve to a real exercise",
        passPct: schemaCounts.relTargetsTotal ? schemaCounts.relTargetsResolve / schemaCounts.relTargetsTotal : 1,
      },
    ],
  };
}

export async function GET() {
  try {
    const [mainIndex, communityIndex] = await Promise.all([fetchIndex("main"), fetchIndex("community")]);

    const mainIds = (mainIndex?.exercises ?? []).map((e) => e.id);
    const communityIds = (communityIndex?.exercises ?? []).map((e) => e.id);

    const [mainDocsMap, communityDocsMap] = await Promise.all([
      fetchExercisesBatch("main", mainIds),
      fetchExercisesBatch("community", communityIds),
    ]);

    const mainDocs = [...mainDocsMap.values()];
    const communityDocs = [...communityDocsMap.values()];

    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        main: computeStats(mainDocs),
        community: computeStats(communityDocs),
        combined: computeStats([...mainDocs, ...communityDocs]),
      },
      { headers: { "Cache-Control": "no-cache, no-store, must-revalidate" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("Insights error:", message);
    return NextResponse.json({ error: "Failed to compute dataset insights." }, { status: 500 });
  }
}
