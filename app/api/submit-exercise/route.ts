import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { isNewId, safeBranchName, generateNewExerciseId } from "@/lib/exerciseId";
import { buildIndexEntry } from "@/lib/github-raw";

/* ── Config ── */

const OWNER = "rania-is";
const REPO = "samplejson";
const BASE_BRANCH = "community";
const API = "https://api.github.com";

function env(key: string): string | undefined {
  return process.env[key];
}

function requiredEnv(): {
  appId: string;
  installationId: string;
  privateKey: string;
} | null {
  const appId = env("GITHUB_APP_ID");
  const installationId = env("GITHUB_APP_INSTALLATION_ID");
  if (!appId || !installationId) return null;

  // Read private key from .pem file on disk (avoids env var encoding issues)
  let privateKey: string;
  try {
    const pemPath = path.join(process.cwd(), "github-app-private-key.pem");
    privateKey = fs.readFileSync(pemPath, "utf-8");
  } catch {
    // Fallback to env var if file doesn't exist
    const envKey = env("GITHUB_APP_PRIVATE_KEY");
    if (!envKey) return null;
    privateKey = envKey.replace(/\\n/g, "\n");
  }

  if (!privateKey) return null;
  return { appId, installationId, privateKey };
}

/* ── JWT helper (RS256, no external deps) ── */

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function createJWT(appId: string, privateKeyPem: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = { iss: appId, iat: now - 60, exp: now + 600 };

  const segments = [
    base64url(Buffer.from(JSON.stringify(header))),
    base64url(Buffer.from(JSON.stringify(payload))),
  ];

  const signingInput = segments.join(".");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  sign.end();
  const signature = base64url(sign.sign(privateKeyPem));

  return `${signingInput}.${signature}`;
}

/* ── GitHub API helpers ── */

async function getInstallationToken(
  jwt: string,
  installationId: string
): Promise<string> {
  const res = await fetch(
    `${API}/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get installation token (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.token;
}

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

async function ghGet(token: string, path: string) {
  const res = await fetch(`${API}${path}`, { headers: ghHeaders(token) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GET ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function ghPost(token: string, path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function ghPut(token: string, path: string, body: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: ghHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub PUT ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

/* ── ID validation (server side) ── */
// New submissions must use the new id format (EX-<slug>-<ULID>).
// The client generates the id; the server validates it.

/* ── Filename normalization ── */

const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

function normalizeFilename(raw: string): string {
  let name = raw.replace(/\.\./g, "").replace(/[/\\]/g, "");
  name = name.toLowerCase().replace(/\s+/g, "_");
  name = name.replace(/[^a-z0-9_\-.]/g, "");
  return name || "image.png";
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

/* ── Validation ── */

interface ImagePayload {
  filename: string;
  contentBase64: string;
  mimeType: string;
  sizeBytes: number;
}

function validatePayload(
  exercise: Record<string, unknown> | undefined,
  images: ImagePayload[] | undefined
): string | null {
  if (!exercise || typeof exercise !== "object") {
    return "Missing exercise data.";
  }
  if (!exercise.name || typeof exercise.name !== "string") {
    return "Exercise name is required.";
  }
  if (
    !Array.isArray(exercise.categories) ||
    exercise.categories.length === 0
  ) {
    return "At least one category is required.";
  }
  if (
    !Array.isArray(exercise.instructions) ||
    exercise.instructions.length < 2
  ) {
    return "At least two instruction steps are required.";
  }

  if (images && !Array.isArray(images)) {
    return "Images must be an array.";
  }

  if (images && images.length > 10) {
    return "Maximum 10 images allowed.";
  }

  if (images) {
    for (const img of images) {
      if (!img.filename || !img.contentBase64) {
        return "Each image must have a filename and contentBase64.";
      }
      const ext = getExtension(img.filename);
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return `Image "${img.filename}" has unsupported format. Allowed: png, jpg, jpeg, webp.`;
      }
      if (img.sizeBytes > 5 * 1024 * 1024) {
        return `Image "${img.filename}" exceeds the 5 MB size limit.`;
      }
    }
  }

  return null;
}

/* ── Today ISO ── */

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ── Shared commit logic ── */

async function commitExercise(
  config: { appId: string; installationId: string; privateKey: string },
  exerciseId: string,
  finalExercise: Record<string, unknown>,
  normalizedImages: { filename: string; contentBase64: string }[],
  extra?: { originalId?: string; source?: string }
): Promise<{ prUrl: string }> {
  const jwt = createJWT(config.appId, config.privateKey);
  const token = await getInstallationToken(jwt, config.installationId);

  const imageFolder = exerciseId;
  const timestamp = Date.now();
  const safeName = safeBranchName(exerciseId);
  const branchName = `submit/${safeName}/${timestamp}`;

  // Get community branch SHA
  const refData = await ghGet(
    token,
    `/repos/${OWNER}/${REPO}/git/ref/heads/${BASE_BRANCH}`
  );
  const baseSha: string = refData.object.sha;

  // Create new branch
  await ghPost(token, `/repos/${OWNER}/${REPO}/git/refs`, {
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });

  // Commit JSON file
  const jsonContent = Buffer.from(
    JSON.stringify(finalExercise, null, 2),
    "utf-8"
  ).toString("base64");

  await ghPut(
    token,
    `/repos/${OWNER}/${REPO}/contents/exercises/${exerciseId}.json`,
    {
      message: `Add exercise ${exerciseId}`,
      content: jsonContent,
      branch: branchName,
    }
  );

  // Commit each image
  for (const img of normalizedImages) {
    await ghPut(
      token,
      `/repos/${OWNER}/${REPO}/contents/images/${imageFolder}/${img.filename}`,
      {
        message: `Add image ${img.filename} for ${exerciseId}`,
        content: img.contentBase64,
        branch: branchName,
      }
    );
  }

  // Update index.json on the PR branch so it's included when merged
  try {
    const indexPath = `/repos/${OWNER}/${REPO}/contents/index.json?ref=${BASE_BRANCH}`;
    const indexRes = await fetch(`${API}${indexPath}`, { headers: ghHeaders(token) });
    let existingIndex = { updatedAt: new Date().toISOString(), exercises: [] as ReturnType<typeof buildIndexEntry>[] };
    if (indexRes.ok) {
      const indexData = await indexRes.json();
      const content = Buffer.from(indexData.content, "base64").toString("utf-8");
      existingIndex = JSON.parse(content);
    }
    existingIndex.exercises = existingIndex.exercises.filter((e: { id: string }) => e.id !== exerciseId);
    existingIndex.exercises.push(buildIndexEntry(exerciseId, finalExercise));
    existingIndex.updatedAt = new Date().toISOString();

    const indexContent = Buffer.from(
      JSON.stringify(existingIndex, null, 2),
      "utf-8"
    ).toString("base64");

    // Check if index.json exists on the PR branch (inherited from base)
    const branchIndexRes = await fetch(
      `${API}/repos/${OWNER}/${REPO}/contents/index.json?ref=${branchName}`,
      { headers: ghHeaders(token) }
    );
    const indexPutBody: Record<string, unknown> = {
      message: `Update index for ${exerciseId}`,
      content: indexContent,
      branch: branchName,
    };
    if (branchIndexRes.ok) {
      const branchIndexData = await branchIndexRes.json();
      indexPutBody.sha = branchIndexData.sha;
    }

    await ghPut(
      token,
      `/repos/${OWNER}/${REPO}/contents/index.json`,
      indexPutBody
    );
  } catch (err) {
    console.error("Failed to update index.json on PR branch:", err);
    // Non-fatal: exercise is still submitted even if index update fails
  }

  // Open Pull Request
  const exerciseName = (finalExercise.name as string) ?? exerciseId;
  const source = extra?.source ?? "form";
  const bodyLines = [
    `## New exercise: ${exerciseId}`,
    "",
    `**Name:** ${exerciseName}`,
    `**Track:** community`,
    `**Source:** ${source}`,
  ];
  if (extra?.originalId) {
    bodyLines.push(`**Original ID:** ${extra.originalId}`);
  }
  bodyLines.push(
    "",
    `This PR adds:`,
    `- Exercise JSON at \`exercises/${exerciseId}.json\``,
    normalizedImages.length > 0
      ? `- ${normalizedImages.length} image(s) in \`images/${imageFolder}/\``
      : "- No images"
  );

  const pr = await ghPost(token, `/repos/${OWNER}/${REPO}/pulls`, {
    title: `Add exercise ${exerciseId} ${exerciseName}`,
    head: branchName,
    base: BASE_BRANCH,
    body: bodyLines.join("\n"),
  });

  return { prUrl: pr.html_url };
}

/* ── Main handler ── */

export async function POST(request: NextRequest) {
  // Check env
  const config = requiredEnv();
  if (!config) {
    return NextResponse.json(
      { ok: false, error: "Submission is unavailable. Server configuration is missing." },
      { status: 500 }
    );
  }

  // Parse body
  let body: {
    exercise?: Record<string, unknown>;
    images?: ImagePayload[];
    mode?: string;
    originalId?: string;
    source?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const { exercise, images = [], mode, originalId, source } = body;

  // Validate
  const validationError = validatePayload(exercise, images);
  if (validationError) {
    return NextResponse.json(
      { ok: false, error: validationError },
      { status: 400 }
    );
  }

  try {
    let exerciseId: string;

    if (mode === "zip") {
      // ── Zip upload mode: server generates the id ──
      const name = exercise!.name as string;
      exerciseId = generateNewExerciseId(name);
    } else {
      // ── Form mode: client provides the id ──
      exerciseId = exercise!.id as string;
      if (!exerciseId || !isNewId(exerciseId)) {
        return NextResponse.json(
          { ok: false, error: "New submissions must use the new ID format (EX-<slug>-<ULID>)." },
          { status: 400 }
        );
      }
    }

    // Rename images to image_1.ext, image_2.ext, etc.
    const normalizedImages = images.map((img, i) => {
      const ext = getExtension(img.filename) || "png";
      return { ...img, filename: `image_${i + 1}.${ext}` };
    });

    // Build the final exercise JSON
    const today = todayISO();
    const finalExercise: Record<string, unknown> = {
      ...exercise,
      id: exerciseId,
      mediaContent: {
        imageURLs: normalizedImages.map((img) => img.filename),
      },
      metadata: {
        createdBy: source === "ai" ? "co-created with AI" : "community",
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
    };

    const { prUrl } = await commitExercise(
      config,
      exerciseId,
      finalExercise,
      normalizedImages,
      {
        originalId: originalId ?? undefined,
        source: mode === "zip" ? "zip upload" : "form",
      }
    );

    return NextResponse.json({
      ok: true,
      id: exerciseId,
      prUrl,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Submit exercise error:", message);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        ok: false,
        error: isDev
          ? `Submission failed: ${message}`
          : "Failed to create submission. Please try again later.",
      },
      { status: 500 }
    );
  }
}
