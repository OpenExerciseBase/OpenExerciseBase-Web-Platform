/* ── Types for zip import flow ── */

export interface ParsedExercise {
  /** Raw parsed JSON (without trusted id) */
  json: Record<string, unknown>;
  /** Original id from the file, informational only */
  originalId: string | null;
  /** Exercise name */
  name: string;
  /** Categories array */
  categories: string[];
  /** Body parts array */
  bodyParts: string[];
  /** Location array */
  location: string[];
  /** Instructions array */
  instructions: { stepNumber: number; description: string }[];
  /** Image filenames referenced in mediaContent.imageURLs */
  referencedImages: string[];
  /** Matched image entries (filename + blob) */
  matchedImages: MatchedImage[];
  /** Filenames referenced but not found in zip */
  missingImages: string[];
  /** Validation status */
  status: "valid" | "invalid";
  /** Validation messages */
  messages: string[];
  /** Source JSON filename in the zip */
  sourceFile: string;
}

export interface MatchedImage {
  /** Normalized filename */
  filename: string;
  /** Raw file bytes as base64 */
  contentBase64: string;
  /** MIME type */
  mimeType: string;
  /** Size in bytes */
  sizeBytes: number;
  /** Object URL for thumbnail preview */
  previewUrl: string;
}

export interface SubmitResult {
  name: string;
  originalId: string | null;
  generatedId: string | null;
  prUrl: string | null;
  status: "success" | "error";
  error?: string;
}
