export interface Bucket {
  label: string;
  count: number;
  pct: number;
}

export interface TrackStats {
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

export interface InsightsResponse {
  updatedAt: string;
  main: TrackStats;
  community: TrackStats;
  combined: TrackStats;
}

export type Track = "combined" | "main" | "community";

export const TRACK_LABEL: Record<Track, string> = {
  combined: "Validated + Community",
  main: "Validated",
  community: "Community",
};

export const TRACK_COLOR: Record<Track, string> = {
  combined: "#0d9488", // teal (matches the site's primary)
  main: "#16a34a", // green, matches the "Validated" badge
  community: "#d97706", // amber, matches the "Community" badge
};
