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
} from "@/lib/review-helpers";
import { addToIndex, removeFromIndex, buildIndexEntry } from "@/lib/github-raw";

/**
 * POST /api/review/approve
 * Body: { exerciseId: string, reviewNotes?: string }
 *
 * Copies exercise from community to main with updated metadata.
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

  let body: { exerciseId?: string; reviewNotes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const { exerciseId, reviewNotes } = body;
  if (!exerciseId) {
    return NextResponse.json({ ok: false, error: "Exercise ID is required." }, { status: 400 });
  }

  try {
    const token = await getInstallationToken(config);

    // Fetch exercise from community branch
    const result = await fetchExerciseFromBranch(exerciseId, "community", token);
    if (!result) {
      return NextResponse.json({ ok: false, error: "Exercise not found on community branch." }, { status: 404 });
    }

    const { raw } = result;
    const today = todayISO();

    // Update metadata
    const meta = (raw.metadata ?? {}) as Record<string, unknown>;
    const existingReviewedBy: string[] = Array.isArray(meta.reviewedBy)
      ? meta.reviewedBy as string[]
      : [];
    const reviewedBy = existingReviewedBy.includes(username)
      ? existingReviewedBy
      : [...existingReviewedBy, username];

    const metadata = {
      ...(raw.metadata as Record<string, unknown> ?? {}),
      reviewStatus: "validated",
      reviewedBy,
      dateReviewed: today,
      reviewNotes: reviewNotes?.trim() || null,
      lastUpdated: today,
      lastEditedBy: username,
      dedupStatus: "unknown",
      duplicateOf: null,
    };

    const finalExercise = { ...raw, metadata };
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
      `Validate exercise ${exerciseId}`,
      existingSha
    );

    // Copy images from community to main
    await copyImages(token, exerciseId, "community", "main");

    // Remove exercise from community branch
    await deleteExerciseFromBranch(token, exerciseId, "community");

    // Update index.json on both branches
    const indexEntry = buildIndexEntry(exerciseId, finalExercise);
    await addToIndex(token, "main", indexEntry);
    await removeFromIndex(token, "community", exerciseId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("Approve error:", message);
    return NextResponse.json(
      { ok: false, error: process.env.NODE_ENV === "development" ? message : "Approval failed." },
      { status: 500 }
    );
  }
}
