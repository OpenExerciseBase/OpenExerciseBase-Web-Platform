import type { ExerciseFormState, ValidationResult, Variation, Relationship } from "./types";
import { RELATIONSHIP_TYPE_OPTIONS } from "./types";
import { generateNewExerciseId, regenerateUlid } from "@/lib/exerciseId";

/* ── Date helpers ── */

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ── ID generation (new format: EX-<slug>-<ULID>) ── */

/**
 * Generate a new exercise id from the exercise name.
 * Returns EX-<slug>-<ULID> format.
 */
export function generateId(name: string): string {
  return generateNewExerciseId(name);
}

/**
 * Regenerate the ULID portion of an existing id while keeping the slug.
 */
export function regenerateId(currentId: string, name: string): string {
  return regenerateUlid(currentId, name);
}

/* ── Validation ── */

export function validate(form: ExerciseFormState): ValidationResult {
  const errors: string[] = [];

  if (!form.id) errors.push("Exercise ID is not available");
  if (!form.name.trim()) errors.push("Name is required");
  if (form.categories.length === 0)
    errors.push("At least one category is required");
  if (form.bodyParts.length === 0)
    errors.push("At least one body part is required");
  if (form.location.length === 0)
    errors.push("At least one location is required");

  const filledSteps = form.instructions.filter(
    (s) => s.description.trim() !== ""
  );
  if (filledSteps.length < 2)
    errors.push("At least two instruction steps with descriptions are required");

  for (const r of form.relationships) {
    if (r.target ? !r.target.id.trim() : !r.targetName?.trim())
      errors.push("Every relationship needs a target exercise or a suggested exercise name");
  }

  return { valid: errors.length === 0, errors };
}

/* ── JSON assembly ── */

export function assembleJSON(form: ExerciseFormState): Record<string, unknown> {
  const today = todayISO();
  return {
    id: form.id,
    name: form.name,
    categories: form.categories,
    exerciseEffects: form.exerciseEffects,
    bodyParts: form.bodyParts,
    equipment: form.equipment,
    location: form.location,
    instructions: form.instructions.map((s, i) => ({
      stepNumber: i + 1,
      description: s.description,
    })),
    performanceMetrics: form.performanceMetrics.map((m) => ({
      type: m.type,
      unit: m.unit || null,
      notes: m.notes || null,
    })),
    variations: form.variations
      .filter((v) => v.variationDescription.trim() !== "")
      .map((v) => ({ variationDescription: v.variationDescription.trim() })),
    relationships: form.relationships.map((r) =>
      r.target
        ? {
            type: r.type,
            target: { track: r.target.track, id: r.target.id },
            ...(r.note?.trim() ? { note: r.note.trim() } : {}),
          }
        : { type: r.type, targetName: (r.targetName ?? "").trim(), note: (r.note ?? "").trim() }
    ),
    mediaContent: {
      imageURLs: form.imageURLs.map((name, i) => {
        const dot = name.lastIndexOf(".");
        const ext = dot !== -1 ? name.slice(dot + 1).toLowerCase() : "png";
        return `image_${i + 1}.${ext}`;
      }),
    },
    metadata: {
      createdBy: "community",
      reviewStatus: "unreviewed",
      reviewedBy: [],
      dateReviewed: null,
      reviewNotes: null,
      dateCreated: today,
      lastUpdated: today,
      lastEditedBy: "community",
      dedupStatus: "unknown",
      duplicateOf: null,
    },
    commentsNotes: form.commentsNotes,
  };
}

/* ── Export utilities ── */

export function copyJSON(form: ExerciseFormState): void {
  const json = JSON.stringify(assembleJSON(form), null, 2);
  navigator.clipboard.writeText(json);
}

export function downloadJSON(form: ExerciseFormState): void {
  const json = JSON.stringify(assembleJSON(form), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${form.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── Format helpers ── */

export function formatSnakeCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Default form state ── */

export function defaultFormState(): ExerciseFormState {
  return {
    id: "",
    name: "",
    categories: [],
    exerciseEffects: [],
    bodyParts: [],
    equipment: [],
    location: [],
    instructions: [
      { stepNumber: 1, description: "" },
      { stepNumber: 2, description: "" },
    ],
    performanceMetrics: [],
    variations: [],
    relationships: [],
    imageURLs: [],
    imageFiles: [],
    commentsNotes: [],
  };
}

/* ── Hydration: read variations/relationships from stored or AI-drafted JSON ── */

const RELATIONSHIP_TYPES = new Set<string>(RELATIONSHIP_TYPE_OPTIONS);

/**
 * Normalises the variation/relationship fields of an exercise JSON (current or legacy
 * shapes) into the current form state: free-text `variations`, and a single
 * `relationships` array holding links and named suggestions.
 */
export function hydrateVariationsAndRelationships(raw: Record<string, unknown>): {
  variations: Variation[];
  relationships: Relationship[];
} {
  const variations: Variation[] = [];
  const relationships: Relationship[] = [];
  const asType = (t: unknown) => (typeof t === "string" && RELATIONSHIP_TYPES.has(t) ? t : "similar_to");

  const rawVars = Array.isArray(raw.variations) ? (raw.variations as unknown[]) : [];
  for (const v of rawVars) {
    if (typeof v === "string") {
      if (v.trim()) variations.push({ variationDescription: v.trim() });
      continue;
    }
    const o = (v ?? {}) as Record<string, unknown>;
    const desc = String(o.variationDescription ?? o.description ?? "").trim();
    const name = String(o.exerciseName ?? o.name ?? "").trim();
    const id = typeof o.id === "string" ? o.id.trim() : "";
    if (id) {
      relationships.push({ type: "similar_to", target: { track: "validated", id }, note: desc });
    } else if (desc || name) {
      variations.push({ variationDescription: name && desc ? `${name}: ${desc}` : desc || name });
    }
  }

  for (const s of Array.isArray(raw.variationSuggestions) ? (raw.variationSuggestions as unknown[]) : []) {
    const o = (s ?? {}) as Record<string, unknown>;
    const desc = String(o.variationDescription ?? o.description ?? "").trim();
    const name = String(o.exerciseName ?? o.name ?? "").trim();
    if (desc || name) variations.push({ variationDescription: name && desc ? `${name}: ${desc}` : desc || name });
  }

  for (const r of Array.isArray(raw.relationships) ? (raw.relationships as unknown[]) : []) {
    const o = (r ?? {}) as Record<string, unknown>;
    const t = (o.target ?? null) as Record<string, unknown> | null;
    if (t && typeof t.id === "string" && t.id) {
      relationships.push({
        type: asType(o.type),
        target: { track: typeof t.track === "string" ? t.track : "validated", id: t.id },
        ...(typeof o.note === "string" && o.note ? { note: o.note } : {}),
      });
    } else if (typeof o.targetName === "string" && o.targetName) {
      relationships.push({ type: asType(o.type), targetName: o.targetName, note: typeof o.note === "string" ? o.note : "" });
    }
  }

  for (const s of Array.isArray(raw.relationshipSuggestions) ? (raw.relationshipSuggestions as unknown[]) : []) {
    const o = (s ?? {}) as Record<string, unknown>;
    if (typeof o.targetName === "string" && o.targetName) {
      relationships.push({ type: asType(o.type), targetName: o.targetName, note: typeof o.note === "string" ? o.note : "" });
    }
  }

  return { variations, relationships };
}
