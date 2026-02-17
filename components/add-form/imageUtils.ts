const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGES = 10;

export { MAX_SIZE_BYTES, MAX_IMAGES, ALLOWED_EXTENSIONS };

/**
 * Normalize a filename to be safe for storage:
 * - remove path separators
 * - no .. sequences
 * - lowercase
 * - replace spaces with underscore
 * - keep extension
 */
export function normalizeFilename(raw: string): string {
  let name = raw.replace(/\.\./g, "").replace(/[/\\]/g, "");
  name = name.toLowerCase().replace(/\s+/g, "_");
  // Remove any characters that aren't alphanumeric, underscore, hyphen, or dot
  name = name.replace(/[^a-z0-9_\-.]/g, "");
  return name || "image.png";
}

/**
 * Get the extension from a filename (without the dot).
 */
export function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

/**
 * Check if a file extension is allowed.
 */
export function isAllowedExtension(filename: string): boolean {
  return ALLOWED_EXTENSIONS.includes(getExtension(filename));
}

/**
 * Convert a File object to a base64 string (without the data URI prefix).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:...;base64," prefix
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate an array of image files before submission.
 * Returns an error string or null if valid.
 */
export function validateImages(
  files: File[]
): string | null {
  if (files.length > MAX_IMAGES) {
    return `Maximum ${MAX_IMAGES} images allowed. You have ${files.length}.`;
  }
  for (const file of files) {
    if (!isAllowedExtension(file.name)) {
      return `"${file.name}" has an unsupported format. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `"${file.name}" exceeds the 5 MB size limit.`;
    }
  }
  return null;
}
