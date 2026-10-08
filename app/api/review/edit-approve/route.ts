import { NextRequest, NextResponse } from "next/server";
import { isVerifiedReviewer } from "@/lib/github-auth";
import {
  getAppConfig,
  getInstallationToken,
  fetchExerciseFromBranch,
  commitFile,
  copyImages,
  deleteExerciseFromBranch,
  todayISO,
  ghPut,
} from "@/lib/review-helpers";
import { addToIndex, removeFromIndex, buildIndexEntry } from "@/lib/github-raw";

const OWNER = "OpenExerciseBase";
const REPO = "OpenExerciseBase-Database";
const API = "https://api.github.com";

/**
 * POST /api/review/edit-approve
 * Body: { exerciseId: string, exercise: Record<string, unknown>, reviewNotes?: string, images?: { filename: string, contentBase64: string }[] }
 *
 * Commits edited exercise JSON and images directly to main branch.
 */
export async function POST(request: NextRequest) {
  const username = request.cookies.get("gh_username")?.value;
  const ghToken = request.cookies.get("gh_token")?.value;
  if (!username || !ghToken) {
    return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
  }

  const verified = await isVerifiedReviewer(username);
  if (!verified) {
    return NextResponse.json({ ok: false, error: "You are not a verified reviewer." }, { status: 403 });
  }

  const config = getAppConfig();
  if (!config) {
    return NextResponse.json({ ok: false, error: "Server configuration missing." }, { status: 500 });
  }

  let body: {
    exerciseId?: string;
    exercise?: Record<string, unknown>;
    reviewNotes?: string;
    images?: { filename: string; contentBase64: string }[];
    keepImageFilenames?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const { exerciseId, exercise, reviewNotes, images, keepImageFilenames } = body;
  if (!exerciseId) {
    return NextResponse.json({ ok: false, error: "Exercise ID is required." }, { status: 400 });
  }
  if (!exercise || typeof exercise !== "object") {
    return NextResponse.json({ ok: false, error: "Exercise data is required." }, { status: 400 });
  }

  try {
    const token = await getInstallationToken(config);
    const today = todayISO();

    // Get original metadata from community branch
    const communityResult = await fetchExerciseFromBranch(exerciseId, "community", token);
    const originalMeta = communityResult
      ? ((communityResult.raw.metadata ?? {}) as Record<string, unknown>)
      : {};

    const existingReviewedBy: string[] = Array.isArray(originalMeta.reviewedBy)
      ? originalMeta.reviewedBy as string[]
      : [];
    const reviewedBy = existingReviewedBy.includes(username)
      ? existingReviewedBy
      : [...existingReviewedBy, username];

    const metadata = {
      ...originalMeta,
      reviewStatus: "accepted_with_edits",
      reviewedBy,
      dateReviewed: today,
      reviewNotes: reviewNotes?.trim() || null,
      lastUpdated: today,
      lastEditedBy: username,
      dedupStatus: "unknown",
      duplicateOf: null,
    };

    const finalExercise = { ...exercise, id: exerciseId, metadata };
    const jsonContent = JSON.stringify(finalExercise, null, 2);

    // Check if file already exists on main
    const mainResult = await fetchExerciseFromBranch(exerciseId, "main", token);
    const existingSha = mainResult?.sha;

    // Commit JSON to main
    await commitFile(
      token,
      "main",
      `exercises/${exerciseId}.json`,
      jsonContent,
      `Validate and edit exercise ${exerciseId}`,
      existingSha
    );

    // Handle images
    // 1. If new uploaded images provided, commit them to main
    if (images && images.length > 0) {
      for (const img of images) {
        const checkRes = await fetch(
          `${API}/repos/${OWNER}/${REPO}/contents/images/${exerciseId}/${img.filename}?ref=main`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
            },
          }
        );
        let sha: string | undefined;
        if (checkRes.ok) {
          const existing = await checkRes.json();
          sha = existing.sha;
        }

        const putBody: Record<string, unknown> = {
          message: `Add image ${img.filename} for ${exerciseId}`,
          content: img.contentBase64,
          branch: "main",
        };
        if (sha) putBody.sha = sha;

        await ghPut(
          token,
          `/repos/${OWNER}/${REPO}/contents/images/${exerciseId}/${img.filename}`,
          putBody
        );
      }
    }

    // 2. Copy kept existing images from community to main (selective)
    if (keepImageFilenames && keepImageFilenames.length > 0) {
      const listPath = `/repos/${OWNER}/${REPO}/contents/images/${exerciseId}?ref=community`;
      const listRes = await fetch(`${API}${listPath}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      });
      if (listRes.ok) {
        const items: { name: string; download_url: string; type: string }[] = await listRes.json();
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item.type !== "file") continue;
            if (!keepImageFilenames.includes(item.name)) continue;
            try {
              const imgRes = await fetch(item.download_url);
              if (!imgRes.ok) continue;
              const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
              const base64 = imgBuffer.toString("base64");

              const targetPath = `/repos/${OWNER}/${REPO}/contents/images/${exerciseId}/${item.name}?ref=main`;
              const checkRes = await fetch(`${API}${targetPath}`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
              });
              let sha: string | undefined;
              if (checkRes.ok) {
                const existing = await checkRes.json();
                sha = existing.sha;
              }

              const cpBody: Record<string, unknown> = {
                message: `Add image ${item.name} for ${exerciseId}`,
                content: base64,
                branch: "main",
              };
              if (sha) cpBody.sha = sha;

              await ghPut(token, `/repos/${OWNER}/${REPO}/contents/images/${exerciseId}/${item.name}`, cpBody);
            } catch (err) {
              console.error(`Failed to copy image ${item.name}:`, err);
            }
          }
        }
      }
    } else if (!images || images.length === 0) {
      // No new images and no keepImageFilenames means copy all existing
      if (keepImageFilenames === undefined) {
        await copyImages(token, exerciseId, "community", "main");
      }
      // If keepImageFilenames is an empty array, no images are copied (all removed)
    }

    // Remove exercise from community branch
    await deleteExerciseFromBranch(token, exerciseId, "community");

    // Update index.json on both branches
    const indexEntry = buildIndexEntry(exerciseId, finalExercise);
    await addToIndex(token, "main", indexEntry);
    await removeFromIndex(token, "community", exerciseId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("Edit-approve error:", message);
    return NextResponse.json(
      { ok: false, error: process.env.NODE_ENV === "development" ? message : "Action failed." },
      { status: 500 }
    );
  }
}
