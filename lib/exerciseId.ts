import { ulid } from "ulid";

/* ── ID format patterns ── */

const OLD_ID_RE = /^EX-\d+$/;
const NEW_ID_RE = /^EX-[a-z0-9_]+-[0-9A-HJKMNP-TV-Z]{26}$/i;

/**
 * Check if an id matches the old numeric format: EX-6, EX-27, EX-128
 */
export function isOldId(id: string): boolean {
  return OLD_ID_RE.test(id);
}

/**
 * Check if an id matches the new slug+ULID format:
 * EX-glute_bridge-01HZY3Q7Z3W8K2QFJ6V9B1T8M4
 * Accepts lowercase ULID and normalizes to uppercase for validation.
 */
export function isNewId(id: string): boolean {
  return NEW_ID_RE.test(id);
}

/**
 * Check if an id is a valid exercise id (old or new format).
 */
export function isExerciseId(id: string): boolean {
  return isOldId(id) || isNewId(id);
}

/* ── Slugify ── */

/**
 * Create a URL/filename-safe slug from an exercise name.
 * - lowercase
 * - trim
 * - remove apostrophes
 * - replace any non-alphanumeric with underscore
 * - collapse repeated underscores
 * - trim leading/trailing underscores
 * - if empty, use "exercise"
 * - limit to 40 chars
 */
export function slugify(name: string): string {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (!slug) slug = "exercise";
  if (slug.length > 40) slug = slug.slice(0, 40).replace(/_$/, "");

  return slug;
}

/* ── ID generation ── */

/**
 * Generate a new exercise id in the format EX-<slug>-<ULID>.
 * ULID is always uppercase.
 */
export function generateNewExerciseId(name: string): string {
  const slug = slugify(name);
  const id = ulid().toUpperCase();
  return `EX-${slug}-${id}`;
}

/**
 * Regenerate the ULID portion of an id while keeping the slug.
 * If the current id is not in new format, generates a fresh one from the name.
 */
export function regenerateUlid(currentId: string, name: string): string {
  if (isNewId(currentId)) {
    // Extract slug: everything between first "EX-" and last "-<ULID>"
    const lastDash = currentId.lastIndexOf("-");
    const slug = currentId.slice(3, lastDash);
    const newUlid = ulid().toUpperCase();
    return `EX-${slug}-${newUlid}`;
  }
  return generateNewExerciseId(name);
}

/**
 * Make a branch-safe version of an id by replacing invalid git ref chars.
 */
export function safeBranchName(id: string): string {
  return id.replace(/[^a-zA-Z0-9_\-]/g, "_");
}
