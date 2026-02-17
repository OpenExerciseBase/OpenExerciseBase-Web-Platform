import JSZip from "jszip";
import type { ParsedExercise, MatchedImage } from "./types";

/* ── Constants ── */

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGES_PER_EXERCISE = 10;

/* ── Helpers ── */

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

function normalizeImageFilename(raw: string): string {
  let name = raw.replace(/\.\./g, "").replace(/[/\\]/g, "");
  name = name.toLowerCase().replace(/\s+/g, "_");
  name = name.replace(/[^a-z0-9_\-.]/g, "");
  return name || "image.png";
}

function basenameOf(filepath: string): string {
  const parts = filepath.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1];
}

function mimeForExt(ext: string): string {
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/* ── Validation ── */

function validateExerciseJson(
  raw: unknown
): { valid: boolean; messages: string[] } {
  const messages: string[] = [];

  if (!raw || typeof raw !== "object") {
    return { valid: false, messages: ["Not a valid JSON object"] };
  }

  const obj = raw as Record<string, unknown>;

  if (!obj.name || typeof obj.name !== "string" || !obj.name.trim()) {
    messages.push("Missing or empty name");
  }

  if (!Array.isArray(obj.categories) || obj.categories.length === 0) {
    messages.push("Missing or empty categories array");
  }

  if (!Array.isArray(obj.bodyParts) || obj.bodyParts.length === 0) {
    messages.push("Missing or empty bodyParts array");
  }

  if (!Array.isArray(obj.location) || obj.location.length === 0) {
    messages.push("Missing or empty location array");
  }

  if (!Array.isArray(obj.instructions) || obj.instructions.length < 2) {
    messages.push("Instructions must have at least 2 steps");
  }

  return { valid: messages.length === 0, messages };
}

/* ── Main parser ── */

export async function parseZipFile(file: File): Promise<{
  exercises: ParsedExercise[];
  extraImages: string[];
  errors: string[];
}> {
  const errors: string[] = [];

  let zip: JSZip;
  try {
    const buffer = await file.arrayBuffer();
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return { exercises: [], extraImages: [], errors: ["Failed to read zip file. Make sure it is a valid .zip archive."] };
  }

  // Collect all files from the zip
  const jsonFiles: { path: string; content: string }[] = [];
  // Store images indexed by full path info so we can disambiguate by folder
  interface ZipImage {
    fullPath: string;
    parentFolder: string; // immediate parent folder name, lowercased
    normalizedBasename: string;
    data: ArrayBuffer;
    size: number;
  }
  const allImages: ZipImage[] = [];

  const entries = Object.entries(zip.files);

  for (const [filepath, zipEntry] of entries) {
    if (zipEntry.dir) continue;

    // Skip macOS resource forks and hidden files
    const basename = basenameOf(filepath);
    if (basename.startsWith(".") || basename.startsWith("__MACOSX")) continue;
    if (filepath.includes("__MACOSX")) continue;

    const ext = getExtension(basename);

    if (ext === "json") {
      try {
        const content = await zipEntry.async("string");
        jsonFiles.push({ path: filepath, content });
      } catch {
        errors.push(`Could not read ${filepath}`);
      }
    } else if (IMAGE_EXTENSIONS.has(ext)) {
      try {
        const data = await zipEntry.async("arraybuffer");
        const normalized = normalizeImageFilename(basename);
        // Extract the immediate parent folder name
        const parts = filepath.replace(/\\/g, "/").split("/");
        const parentFolder = parts.length >= 2 ? parts[parts.length - 2].toLowerCase() : "";
        allImages.push({
          fullPath: filepath,
          parentFolder,
          normalizedBasename: normalized,
          data,
          size: data.byteLength,
        });
      } catch {
        errors.push(`Could not read image ${filepath}`);
      }
    }
  }

  if (jsonFiles.length === 0) {
    errors.push("No JSON files found in the zip");
    return { exercises: [], extraImages: allImages.map((img) => img.fullPath), errors };
  }

  // Track which images get matched (by fullPath)
  const usedImages = new Set<string>();
  const exercises: ParsedExercise[] = [];

  // Collect all exercise-owned folder names so we know which folders are "claimed"
  // We do a pre-scan: any folder that matches an exercise id or JSON stem is owned.
  const ownedFolders = new Set<string>();
  for (const jf of jsonFiles) {
    try {
      const parsed = JSON.parse(jf.content);
      if (parsed && typeof parsed === "object" && parsed.id) {
        ownedFolders.add(String(parsed.id).toLowerCase());
      }
    } catch { /* ignore */ }
    const stem = basenameOf(jf.path).replace(/\.json$/i, "");
    if (stem) ownedFolders.add(stem.toLowerCase());
  }

  // Helper: find an image by normalized basename, scoped to a specific folder.
  // Only falls back to images that are NOT inside another exercise's folder.
  function findImage(
    normalizedName: string,
    scopeFolder?: string
  ): ZipImage | undefined {
    // 1) Try the exercise's own folder first
    if (scopeFolder) {
      const folderLower = scopeFolder.toLowerCase();
      const scoped = allImages.find(
        (img) =>
          img.normalizedBasename === normalizedName &&
          img.parentFolder === folderLower
      );
      if (scoped) return scoped;
    }
    // 2) Fallback: only match images that are NOT inside another exercise's folder
    //    (i.e., loose images at root level or in a generic non-exercise folder)
    return allImages.find(
      (img) =>
        img.normalizedBasename === normalizedName &&
        !usedImages.has(img.fullPath) &&
        !ownedFolders.has(img.parentFolder)
    );
  }

  for (const jsonFile of jsonFiles) {
    let raw: unknown;
    try {
      raw = JSON.parse(jsonFile.content);
    } catch {
      // Try to repair common issues
      let repaired = jsonFile.content;
      repaired = repaired.replace(/(\})\s*\n(\s*")/g, "$1,\n$2");
      repaired = repaired.replace(/(\])(\s*\n\s*")/g, "$1,$2");
      repaired = repaired.replace(/,(\s*[\]}])/g, "$1");
      try {
        raw = JSON.parse(repaired);
      } catch {
        errors.push(`Invalid JSON in ${jsonFile.path}`);
        continue;
      }
    }

    if (!raw || typeof raw !== "object") {
      errors.push(`${jsonFile.path} is not a JSON object`);
      continue;
    }

    const obj = raw as Record<string, unknown>;
    const { valid, messages } = validateExerciseJson(obj);

    // Extract referenced images
    const referencedImages: string[] = [];
    if (
      obj.mediaContent &&
      typeof obj.mediaContent === "object" &&
      (obj.mediaContent as Record<string, unknown>).imageURLs
    ) {
      const urls = (obj.mediaContent as Record<string, unknown>).imageURLs;
      if (Array.isArray(urls)) {
        for (const u of urls) {
          if (typeof u === "string") {
            referencedImages.push(u);
          }
        }
      }
    }

    // Match images — scope to the exercise's original id folder first
    const matchedImages: MatchedImage[] = [];
    const missingImages: string[] = [];
    const exerciseOriginalId = obj.id ? String(obj.id) : null;
    // Also try the JSON filename stem as a folder hint
    const jsonStem = basenameOf(jsonFile.path).replace(/\.json$/i, "");
    const scopeFolder = exerciseOriginalId ?? jsonStem;

    for (const ref of referencedImages) {
      const normalizedRef = normalizeImageFilename(basenameOf(ref));
      const ext = getExtension(normalizedRef);

      if (normalizedRef.includes("..")) {
        missingImages.push(ref);
        continue;
      }

      if (!IMAGE_EXTENSIONS.has(ext)) {
        missingImages.push(ref);
        continue;
      }

      const found = findImage(normalizedRef, scopeFolder);
      if (found) {
        if (found.size > MAX_IMAGE_SIZE) {
          messages.push(`Image ${ref} exceeds 5 MB limit`);
          missingImages.push(ref);
          continue;
        }

        const base64 = arrayBufferToBase64(found.data);
        const blob = new Blob([found.data], { type: mimeForExt(ext) });
        const previewUrl = URL.createObjectURL(blob);

        matchedImages.push({
          filename: normalizedRef,
          contentBase64: base64,
          mimeType: mimeForExt(ext),
          sizeBytes: found.size,
          previewUrl,
        });
        usedImages.add(found.fullPath);
      } else {
        missingImages.push(ref);
      }
    }

    if (matchedImages.length > MAX_IMAGES_PER_EXERCISE) {
      messages.push(`More than ${MAX_IMAGES_PER_EXERCISE} images matched, only first ${MAX_IMAGES_PER_EXERCISE} will be used`);
      matchedImages.splice(MAX_IMAGES_PER_EXERCISE);
    }

    // Determine status — missing images are fine, just submit without them
    let status: ParsedExercise["status"];
    if (!valid) {
      status = "invalid";
    } else {
      status = "valid";
    }
    if (missingImages.length > 0) {
      messages.push(`${missingImages.length} referenced image(s) not found in zip, will submit without them`);
    }

    exercises.push({
      json: obj,
      originalId: obj.id ? String(obj.id) : null,
      name: typeof obj.name === "string" ? obj.name : "Untitled",
      categories: Array.isArray(obj.categories) ? (obj.categories as string[]) : [],
      bodyParts: Array.isArray(obj.bodyParts) ? (obj.bodyParts as string[]) : [],
      location: Array.isArray(obj.location) ? (obj.location as string[]) : [],
      instructions: Array.isArray(obj.instructions)
        ? (obj.instructions as { stepNumber: number; description: string }[])
        : [],
      referencedImages,
      matchedImages,
      missingImages,
      status,
      messages,
      sourceFile: jsonFile.path,
    });
  }

  // Extra images (in zip but not matched to any exercise)
  const extraImages = allImages
    .filter((img) => !usedImages.has(img.fullPath))
    .map((img) => img.fullPath);

  return { exercises, extraImages, errors };
}
