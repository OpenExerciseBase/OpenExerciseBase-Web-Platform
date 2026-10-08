/* ── Form state types ── */

export interface InstructionStep {
  stepNumber: number;
  description: string;
}

export interface PerformanceMetric {
  type: string;
  unit: string | null;
  notes: string | null;
}

export interface Variation {
  variationDescription: string;
}

/** Link to an existing exercise, or (when none exists yet) a named suggestion. */
export interface Relationship {
  type: string;
  target?: {
    track: string;
    id: string;
  };
  targetName?: string;
  note?: string;
}

export interface ExerciseFormState {
  id: string;
  name: string;
  categories: string[];
  exerciseEffects: string[];
  bodyParts: string[];
  equipment: string[];
  location: string[];
  instructions: InstructionStep[];
  performanceMetrics: PerformanceMetric[];
  variations: Variation[];
  relationships: Relationship[];
  imageURLs: string[];
  imageFiles: File[];
  commentsNotes: string[];
}

/* ── Constants ── */

export const CATEGORY_OPTIONS = [
  "endurance",
  "strength_and_resistance",
  "flexibility_and_mobility",
  "balance_and_coordination",
  "relaxation_and_breathing",
] as const;

export const EFFECT_OPTIONS = [
  "improved_body_balance",
  "improved_posture",
  "improved_range_of_motion",
  "increased_bone_strength",
  "increased_breathing",
  "increased_heart_rate",
  "increased_muscle_strength",
  "relieve_muscle_tension",
  "stretch_muscle",
] as const;

export const LOCATION_OPTIONS = ["indoor", "outdoor"] as const;

export const METRIC_TYPE_OPTIONS = [
  "distance",
  "repetitions",
  "load",
  "duration",
  "heart_rate_percentage",
  "physiological_parameters",
] as const;

export const RELATIONSHIP_TYPE_OPTIONS = [
  "variation_of",
  "progression_of",
  "regression_of",
  "similar_to",
  "replacement_for",
] as const;

export const TRACK_OPTIONS = ["community", "validated"] as const;

/* ── Validation ── */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/* ── Common body parts for quick select ── */

export const COMMON_BODY_PARTS = [
  "glutes",
  "hamstrings",
  "quadriceps",
  "calves",
  "core",
  "abdominals",
  "lower back",
  "upper back",
  "chest",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "neck",
  "hip flexors",
  "adductors",
  "abductors",
  "full body",
] as const;

/* ── Common equipment for quick select ── */

export const COMMON_EQUIPMENT = [
  "barbell",
  "dumbbell",
  "kettlebell",
  "resistance band",
  "pull up bar",
  "bench",
  "cable machine",
  "medicine ball",
  "stability ball",
  "foam roller",
  "yoga mat",
  "jump rope",
  "TRX",
] as const;
