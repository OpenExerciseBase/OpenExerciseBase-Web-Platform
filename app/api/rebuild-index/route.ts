import { NextRequest, NextResponse } from "next/server";
import {
  getAppConfig,
  getInstallationToken,
  commitFile,
} from "@/lib/review-helpers";
import { buildIndexEntry } from "@/lib/github-raw";
import { isExerciseId } from "@/lib/exerciseId";

const OWNER = "rania-is";
const REPO = "samplejson";
const API = "https://api.github.com";

/**
 * POST /api/rebuild-index
 * Body: { branch: "main" | "community" }
 *
 * Scans all exercise JSON files on the given branch via authenticated
 * GitHub API (write-side operation) and commits an updated index.json.
 */
export async function POST(request: NextRequest) {
  const config = getAppConfig();
  if (!config) {
    return NextResponse.json(
      { ok: false, error: "Server configuration missing." },
      { status: 500 }
    );
  }

  let body: { branch?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 }
    );
  }

  const branch = body.branch;
  if (branch !== "main" && branch !== "community") {
    return NextResponse.json(
      { ok: false, error: "Branch must be 'main' or 'community'." },
      { status: 400 }
    );
  }

  try {
    const token = await getInstallationToken(config);
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    };

    // List all files in exercises/ directory
    const listRes = await fetch(
      `${API}/repos/${OWNER}/${REPO}/contents/exercises?ref=${branch}`,
      { headers }
    );

    if (!listRes.ok) {
      return NextResponse.json(
        { ok: false, error: `Failed to list exercises on ${branch}.` },
        { status: 500 }
      );
    }

    const items: { name: string; download_url: string; type: string }[] =
      await listRes.json();
    const jsonFiles = items.filter(
      (f) =>
        f.type === "file" &&
        f.name.endsWith(".json") &&
        isExerciseId(f.name.replace(".json", ""))
    );

    // Fetch each exercise JSON
    const exercises = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const res = await fetch(file.download_url, { headers });
          if (!res.ok) return null;
          const text = await res.text();

          let raw;
          try {
            raw = JSON.parse(text);
          } catch {
            let repaired = text;
            repaired = repaired.replace(/(\})\s*\n(\s*")/g, "$1,\n$2");
            repaired = repaired.replace(/(\])(\s*\n\s*")/g, "$1,$2");
            repaired = repaired.replace(/,(\s*[\]}])/g, "$1");
            try {
              raw = JSON.parse(repaired);
            } catch {
              return null;
            }
          }

          // For community branch, exclude already-reviewed exercises
          if (branch === "community") {
            const status = raw.metadata?.reviewStatus;
            if (
              status === "validated" ||
              status === "rejected" ||
              status === "duplicate"
            )
              return null;
          }

          const exId = raw.id
            ? String(raw.id)
            : file.name.replace(".json", "");

          // Probe which image folder convention exists (EX-N vs Ex-N)
          let imageFolder = exId;
          const mc = raw.mediaContent as Record<string, unknown> | undefined;
          const imageURLs = Array.isArray(mc?.imageURLs)
            ? (mc.imageURLs as string[])
            : [];
          if (imageURLs.length > 0) {
            const directCheck = await fetch(
              `${API}/repos/${OWNER}/${REPO}/contents/images/${exId}?ref=${branch}`,
              { headers }
            );
            if (!directCheck.ok) {
              // Try Ex-N convention for old exercises
              const altFolder = exId.replace(/^EX-/i, "Ex-");
              const altCheck = await fetch(
                `${API}/repos/${OWNER}/${REPO}/contents/images/${altFolder}?ref=${branch}`,
                { headers }
              );
              if (altCheck.ok) {
                imageFolder = altFolder;
              }
            }
          }

          return buildIndexEntry(exId, raw, imageFolder);
        } catch {
          return null;
        }
      })
    );

    const filtered = exercises.filter(
      (e): e is NonNullable<typeof e> => e !== null
    );

    const index = {
      updatedAt: new Date().toISOString(),
      exercises: filtered,
    };

    const indexContent = JSON.stringify(index, null, 2);

    // Check if index.json already exists on the branch
    const checkRes = await fetch(
      `${API}/repos/${OWNER}/${REPO}/contents/index.json?ref=${branch}`,
      { headers }
    );
    let existingSha: string | undefined;
    if (checkRes.ok) {
      const existing = await checkRes.json();
      existingSha = existing.sha;
    }

    await commitFile(
      token,
      branch,
      "index.json",
      indexContent,
      `Update exercise index for ${branch}`,
      existingSha
    );

    return NextResponse.json({
      ok: true,
      branch,
      count: filtered.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("Rebuild index error:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
