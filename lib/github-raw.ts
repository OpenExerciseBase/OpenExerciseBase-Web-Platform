/**
 * Raw GitHub content helpers.
 *
 * ALL read operations go through raw.githubusercontent.com URLs.
 * NO GitHub REST API calls are made for browsing / listing.
 *
 * An index.json file on each branch lists exercise IDs so we never
 * need to call the Contents API to enumerate files.
 */

const OWNER = "OpenExerciseBase";
const REPO = "OpenExerciseBase-Database";
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}`;

export { OWNER, REPO, RAW_BASE };

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExerciseIndexEntry {
  id: string;
  name: string;
  categories: string[];
  bodyParts: string[];
  equipment: string[];
  location: string[];
  imageFile: string | null;
  imageFolder: string | null;
  lastUpdated: string | null;
}

export interface ExerciseIndex {
  updatedAt: string;
  exercises: ExerciseIndexEntry[];
}

// ─── Raw URL builders ───────────────────────────────────────────────────────

export function rawUrl(branch: string, filePath: string): string {
  return `${RAW_BASE}/${branch}/${filePath}`;
}

export function exerciseJsonUrl(branch: string, exerciseId: string): string {
  return rawUrl(branch, `exercises/${exerciseId}.json`);
}

export function exerciseImageUrl(
  branch: string,
  exerciseId: string,
  imageFile: string,
  imageFolder?: string | null
): string {
  const folder = imageFolder ?? exerciseId;
  return rawUrl(branch, `images/${folder}/${imageFile}`);
}

export function indexUrl(branch: string): string {
  return rawUrl(branch, "index.json");
}

// ─── JSON repair (handles common formatting issues in repo files) ───────────

export function repairJson(text: string): string {
  let repaired = text;
  repaired = repaired.replace(/(\})\s*\n(\s*")/g, "$1,\n$2");
  repaired = repaired.replace(/(\])(\s*\n\s*")/g, "$1,$2");
  repaired = repaired.replace(/,(\s*[\]}])/g, "$1");
  return repaired;
}

export function parseExerciseJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(repairJson(text));
    } catch {
      return null;
    }
  }
}

// ─── Fetch index.json from a branch ─────────────────────────────────────────

export async function fetchIndex(
  branch: string
): Promise<ExerciseIndex | null> {
  try {
    // Use GitHub API Contents endpoint for index.json to avoid raw CDN caching issues.
    // This is a single authenticated API call per branch — always returns latest content.
    const { getAppConfig, getInstallationToken } = await import("@/lib/review-helpers");
    const config = getAppConfig();
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (config) {
      try {
        const token = await getInstallationToken(config);
        headers.Authorization = `Bearer ${token}`;
      } catch {
        // Fall back to unauthenticated
      }
    }

    const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/index.json?ref=${branch}`;
    const res = await fetch(apiUrl, { headers, cache: "no-store" });
    if (!res.ok) {
      console.error(`fetchIndex(${branch}): HTTP ${res.status}`);
      return null;
    }
    const fileData = await res.json();
    const content = Buffer.from(fileData.content, "base64").toString("utf-8");
    const data = JSON.parse(content);
    // Defensive: ensure exercises array exists
    return {
      updatedAt: data.updatedAt ?? new Date().toISOString(),
      exercises: Array.isArray(data.exercises) ? data.exercises : [],
    };
  } catch (err) {
    console.error(`fetchIndex(${branch}) error:`, err);
    return null;
  }
}

// ─── Fetch a single exercise JSON from raw URL ─────────────────────────────

export async function fetchExerciseRaw(
  branch: string,
  exerciseId: string
): Promise<Record<string, unknown> | null> {
  try {
    const url = exerciseJsonUrl(branch, exerciseId);
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const text = await res.text();
    return parseExerciseJson(text);
  } catch {
    return null;
  }
}

// ─── Batch fetch exercises with concurrency limit ───────────────────────────

export async function fetchExercisesBatch(
  branch: string,
  exerciseIds: string[],
  concurrency = 10
): Promise<Map<string, Record<string, unknown>>> {
  const results = new Map<string, Record<string, unknown>>();
  const queue = [...exerciseIds];

  async function worker() {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) break;
      const raw = await fetchExerciseRaw(branch, id);
      if (raw) results.set(id, raw);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, queue.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

// ─── Resolve image URL for an exercise ──────────────────────────────────────

export function resolveImageUrl(
  branch: string,
  exerciseId: string,
  imageFiles: string[],
  imageFolder?: string | null
): string | null {
  if (!imageFiles || imageFiles.length === 0) return null;
  return exerciseImageUrl(branch, exerciseId, imageFiles[0], imageFolder);
}

export function resolveAllImageUrls(
  branch: string,
  exerciseId: string,
  imageFiles: string[],
  imageFolder?: string | null
): string[] {
  if (!imageFiles || imageFiles.length === 0) return [];
  return imageFiles.map((f) => exerciseImageUrl(branch, exerciseId, f, imageFolder));
}

// ─── Build an index entry from raw exercise data ────────────────────────────

// ─── Index mutation helpers (used by write operations) ──────────────────────

/**
 * Add or update an exercise in the index on a given branch.
 * Uses authenticated GitHub API (write operation).
 */
export async function addToIndex(
  token: string,
  branch: string,
  entry: ExerciseIndexEntry
): Promise<void> {
  const { commitFile: commit } = await import("@/lib/review-helpers");
  const API = `https://api.github.com`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  // Fetch current index
  const checkRes = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/index.json?ref=${branch}`,
    { headers }
  );

  let existingSha: string | undefined;
  let index: ExerciseIndex = { updatedAt: new Date().toISOString(), exercises: [] };

  if (checkRes.ok) {
    const data = await checkRes.json();
    existingSha = data.sha;
    try {
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      index = JSON.parse(content);
    } catch {
      // Corrupted index, start fresh
    }
  }

  // Remove existing entry with same id, then add new one
  index.exercises = index.exercises.filter((e) => e.id !== entry.id);
  index.exercises.push(entry);
  index.updatedAt = new Date().toISOString();

  const indexContent = JSON.stringify(index, null, 2);
  await commit(token, branch, "index.json", indexContent, `Update index: add ${entry.id}`, existingSha);
}

/**
 * Remove an exercise from the index on a given branch.
 * Uses authenticated GitHub API (write operation).
 */
export async function removeFromIndex(
  token: string,
  branch: string,
  exerciseId: string
): Promise<void> {
  const { commitFile: commit } = await import("@/lib/review-helpers");
  const API = `https://api.github.com`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  const checkRes = await fetch(
    `${API}/repos/${OWNER}/${REPO}/contents/index.json?ref=${branch}`,
    { headers }
  );

  if (!checkRes.ok) return; // No index to update

  const data = await checkRes.json();
  const existingSha = data.sha;
  let index: ExerciseIndex;
  try {
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    index = JSON.parse(content);
  } catch {
    return; // Corrupted index
  }

  const before = index.exercises.length;
  index.exercises = index.exercises.filter((e) => e.id !== exerciseId);
  if (index.exercises.length === before) return; // Not in index

  index.updatedAt = new Date().toISOString();
  const indexContent = JSON.stringify(index, null, 2);
  await commit(token, branch, "index.json", indexContent, `Update index: remove ${exerciseId}`, existingSha);
}

// ─── Build an index entry from raw exercise data ────────────────────────────

export function buildIndexEntry(
  exerciseId: string,
  raw: Record<string, unknown>,
  imageFolder?: string | null
): ExerciseIndexEntry {
  const mc = raw.mediaContent as Record<string, unknown> | undefined;
  const imageURLs = Array.isArray(mc?.imageURLs)
    ? (mc!.imageURLs as string[])
    : [];

  return {
    id: exerciseId,
    name: (raw.name as string) ?? "Untitled exercise",
    categories: Array.isArray(raw.categories) ? (raw.categories as string[]) : [],
    bodyParts: Array.isArray(raw.bodyParts) ? (raw.bodyParts as string[]) : [],
    equipment: Array.isArray(raw.equipment) ? (raw.equipment as string[]) : [],
    location: Array.isArray(raw.location) ? (raw.location as string[]) : [],
    imageFile: imageURLs[0] ?? null,
    imageFolder: imageFolder ?? exerciseId,
    lastUpdated:
      (raw.metadata as Record<string, unknown> | undefined)?.lastUpdated as string | null ?? null,
  };
}
