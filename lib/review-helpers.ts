/**
 * Shared helpers for review actions that commit directly to GitHub branches.
 * Uses the GitHub App installation token (same as submit-exercise) for commits.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

const OWNER = "OpenExerciseBase";
const REPO = "OpenExerciseBase-Database";
const API = "https://api.github.com";
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}`;

/* ── Env ── */

function env(key: string): string | undefined {
  return process.env[key];
}

export function getAppConfig(): {
  appId: string;
  installationId: string;
  privateKey: string;
} | null {
  const appId = env("GITHUB_APP_ID");
  const installationId = env("GITHUB_APP_INSTALLATION_ID");
  if (!appId || !installationId) return null;

  let privateKey: string;
  try {
    const pemPath = path.join(process.cwd(), "github-app-private-key.pem");
    privateKey = fs.readFileSync(pemPath, "utf-8");
  } catch {
    const envKey = env("GITHUB_APP_PRIVATE_KEY");
    if (!envKey) return null;
    privateKey = envKey.replace(/\\n/g, "\n");
  }

  if (!privateKey) return null;
  return { appId, installationId, privateKey };
}

/* ── JWT helper (RS256) ── */

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
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

export async function getInstallationToken(
  config: { appId: string; installationId: string; privateKey: string }
): Promise<string> {
  const jwt = createJWT(config.appId, config.privateKey);
  const res = await fetch(
    `${API}/app/installations/${config.installationId}/access_tokens`,
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

export async function ghGet(token: string, ghPath: string) {
  const res = await fetch(`${API}${ghPath}`, { headers: ghHeaders(token) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GET ${ghPath} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function ghPut(token: string, ghPath: string, body: unknown) {
  const res = await fetch(`${API}${ghPath}`, {
    method: "PUT",
    headers: ghHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub PUT ${ghPath} failed (${res.status}): ${text}`);
  }
  return res.json();
}

/* ── Date helper ── */

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ── Fetch exercise JSON from a branch ── */

export async function fetchExerciseFromBranch(
  exerciseId: string,
  branch: "main" | "community",
  token?: string
): Promise<{ raw: Record<string, unknown>; sha: string } | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Try fetching by exercise ID filename
  const filePath = `/repos/${OWNER}/${REPO}/contents/exercises/${exerciseId}.json?ref=${branch}`;
  const res = await fetch(`${API}${filePath}`, { headers });

  if (res.ok) {
    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    let raw;
    try {
      raw = JSON.parse(content);
    } catch {
      // Try repair
      let repaired = content;
      repaired = repaired.replace(/(\})\s*\n(\s*")/g, "$1,\n$2");
      repaired = repaired.replace(/(\])(\s*\n\s*")/g, "$1,$2");
      repaired = repaired.replace(/,(\s*[\]}])/g, "$1");
      raw = JSON.parse(repaired);
    }
    return { raw, sha: data.sha };
  }

  return null;
}

/* ── Commit a JSON file to a branch ── */

export async function commitFile(
  token: string,
  branch: string,
  filePath: string,
  content: string,
  message: string,
  existingSha?: string
): Promise<void> {
  const base64Content = Buffer.from(content, "utf-8").toString("base64");
  const body: Record<string, unknown> = {
    message,
    content: base64Content,
    branch,
  };
  if (existingSha) body.sha = existingSha;

  await ghPut(token, `/repos/${OWNER}/${REPO}/contents/${filePath}`, body);
}

/* ── Copy images from one branch to another ── */

export async function copyImages(
  token: string,
  exerciseId: string,
  fromBranch: string,
  toBranch: string
): Promise<void> {
  const listPath = `/repos/${OWNER}/${REPO}/contents/images/${exerciseId}?ref=${fromBranch}`;
  const res = await fetch(`${API}${listPath}`, {
    headers: ghHeaders(token),
  });

  if (!res.ok) {
    // No images folder, that's fine
    return;
  }

  const items: { name: string; download_url: string; type: string }[] = await res.json();
  if (!Array.isArray(items)) return;

  for (const item of items) {
    if (item.type !== "file") continue;
    try {
      // Download image content
      const imgRes = await fetch(item.download_url);
      if (!imgRes.ok) continue;
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      const base64 = imgBuffer.toString("base64");

      // Check if file already exists on target branch
      const targetPath = `/repos/${OWNER}/${REPO}/contents/images/${exerciseId}/${item.name}?ref=${toBranch}`;
      const checkRes = await fetch(`${API}${targetPath}`, {
        headers: ghHeaders(token),
      });
      let sha: string | undefined;
      if (checkRes.ok) {
        const existing = await checkRes.json();
        sha = existing.sha;
      }

      const body: Record<string, unknown> = {
        message: `Add image ${item.name} for ${exerciseId}`,
        content: base64,
        branch: toBranch,
      };
      if (sha) body.sha = sha;

      await ghPut(
        token,
        `/repos/${OWNER}/${REPO}/contents/images/${exerciseId}/${item.name}`,
        body
      );
    } catch (err) {
      console.error(`Failed to copy image ${item.name}:`, err);
    }
  }
}

/* ── Delete a file from a branch ── */

export async function deleteFile(
  token: string,
  branch: string,
  filePath: string,
  sha: string,
  message: string
): Promise<void> {
  const res = await fetch(`${API}/repos/${OWNER}/${REPO}/contents/${filePath}`, {
    method: "DELETE",
    headers: ghHeaders(token),
    body: JSON.stringify({ message, sha, branch }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub DELETE ${filePath} failed (${res.status}): ${text}`);
  }
}

/* ── Delete exercise and its images from a branch ── */

export async function deleteExerciseFromBranch(
  token: string,
  exerciseId: string,
  branch: string
): Promise<void> {
  // Delete JSON file
  const jsonPath = `/repos/${OWNER}/${REPO}/contents/exercises/${exerciseId}.json?ref=${branch}`;
  const jsonRes = await fetch(`${API}${jsonPath}`, { headers: ghHeaders(token) });
  if (jsonRes.ok) {
    const data = await jsonRes.json();
    await deleteFile(token, branch, `exercises/${exerciseId}.json`, data.sha, `Remove ${exerciseId} from ${branch} (approved)`);
  }

  // Delete images folder
  const imgPath = `/repos/${OWNER}/${REPO}/contents/images/${exerciseId}?ref=${branch}`;
  const imgRes = await fetch(`${API}${imgPath}`, { headers: ghHeaders(token) });
  if (imgRes.ok) {
    const items: { name: string; sha: string; type: string }[] = await imgRes.json();
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.type !== "file") continue;
        try {
          await deleteFile(token, branch, `images/${exerciseId}/${item.name}`, item.sha, `Remove image ${item.name} for ${exerciseId} from ${branch}`);
        } catch (err) {
          console.error(`Failed to delete image ${item.name}:`, err);
        }
      }
    }
  }
}

/* ── fetchCommunityExercises removed ──
 * Listing is now handled by index.json via raw GitHub URLs.
 * See lib/github-raw.ts and app/api/review/exercises/route.ts.
 */
