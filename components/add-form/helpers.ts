import type { ExerciseFormState, ValidationResult } from "./types";
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
    variations: form.variations.map((v) => ({
      id: v.id,
      variationDescription: v.variationDescription,
    })),
    variationSuggestions: form.variationSuggestions.map((s) => ({
      exerciseName: s.exerciseName,
      variationDescription: s.variationDescription,
    })),
    relationships: form.relationships.map((r) => ({
      type: r.type,
      target: { track: r.target.track, id: r.target.id },
    })),
    mediaContent: {
      imageURLs: form.imageURLs.map((name, i) => {
        const dot = name.lastIndexOf(".");
        const ext = dot !== -1 ? name.slice(dot + 1).toLowerCase() : "png";
        return `image_${i + 1}.${ext}`;
      }),
    },
    metadata: {
      createdBy: "community",
      reviewStatus: "community",
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
    variationSuggestions: [],
    relationships: [],
    imageURLs: [],
    imageFiles: [],
    commentsNotes: [],
  };
}
