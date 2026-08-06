import { NextRequest, NextResponse } from "next/server";
import { getAppConfig, getInstallationToken, commitFile } from "@/lib/review-helpers";

const OWNER = "rania-is";
const REPO = "samplejson";
const BRANCH = "study/results";
const API = "https://api.github.com";

/**
 * POST /api/study/save
 * Saves a study response and updates progress on the study/results branch.
 *
 * Body: { response: StudyResponse, progress: ProgressData }
 */
export async function POST(request: NextRequest) {
  const ghUsername = request.cookies.get("gh_username")?.value;
  const code = request.cookies.get("study_code")?.value;
  const identifier = code ?? ghUsername;
  if (!identifier) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const config = getAppConfig();
  if (!config) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  let body: { response: Record<string, unknown>; progress: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { response, progress } = body;
  if (!response || !progress) {
    return NextResponse.json({ error: "Missing response or progress" }, { status: 400 });
  }

  const exerciseId = response.exerciseId as string;
  if (!exerciseId) {
    return NextResponse.json({ error: "Missing exerciseId" }, { status: 400 });
  }

  try {
    const installToken = await getInstallationToken(config);

    // Ensure the study/results branch exists
    await ensureBranch(installToken);

    // Write response file
    const responsePath = `study/responses/${identifier}/${exerciseId}.json`;
    const responseContent = JSON.stringify(response, null, 2);
    const existingResponseSha = await getFileSha(installToken, responsePath);
    await commitFile(
      installToken,
      BRANCH,
      responsePath,
      responseContent,
      `Study response: ${identifier} reviewed ${exerciseId}`,
      existingResponseSha ?? undefined
    );

    // Write progress file
    const progressPath = `study/responses/${identifier}/progress.json`;
    const progressContent = JSON.stringify(progress, null, 2);
    const existingProgressSha = await getFileSha(installToken, progressPath);
    await commitFile(
      installToken,
      BRANCH,
      progressPath,
      progressContent,
      `Study progress update: ${identifier}`,
      existingProgressSha ?? undefined
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Study save error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function getFileSha(token: string, filePath: string): Promise<string | null> {
  const url = `${API}/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.sha ?? null;
}

async function ensureBranch(token: string): Promise<void> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  // Check if branch exists
  const checkRes = await fetch(
    `${API}/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`,
    { headers }
  );
  if (checkRes.ok) return;

  // Get main branch SHA
  const mainRes = await fetch(
    `${API}/repos/${OWNER}/${REPO}/git/ref/heads/main`,
    { headers }
  );
  if (!mainRes.ok) throw new Error("Cannot find main branch");
  const mainData = await mainRes.json();
  const sha = mainData.object.sha;

  // Create branch
  const createRes = await fetch(
    `${API}/repos/${OWNER}/${REPO}/git/refs`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha }),
    }
  );
  if (!createRes.ok) {
    const text = await createRes.text();
    // 422 means it already exists (race condition)
    if (createRes.status !== 422) {
      throw new Error(`Failed to create branch: ${text}`);
    }
  }
}
