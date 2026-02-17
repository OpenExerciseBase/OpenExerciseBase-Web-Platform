import { NextRequest, NextResponse } from "next/server";
import { isVerifiedReviewer } from "@/lib/github-auth";
import {
  getAppConfig,
  getInstallationToken,
  fetchExerciseFromBranch,
  commitFile,
  todayISO,
} from "@/lib/review-helpers";
import { removeFromIndex } from "@/lib/github-raw";

/**
 * POST /api/review/duplicate
 * Body: { exerciseId: string, canonicalId: string, reviewNotes: string }
 *
 * Marks exercise as duplicate on community branch.
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

  let body: { exerciseId?: string; canonicalId?: string; reviewNotes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const { exerciseId, canonicalId, reviewNotes } = body;
  if (!exerciseId) {
    return NextResponse.json({ ok: false, error: "Exercise ID is required." }, { status: 400 });
  }
  if (!canonicalId?.trim()) {
    return NextResponse.json({ ok: false, error: "Canonical exercise ID is required." }, { status: 400 });
  }
  if (!canonicalId.startsWith("EX")) {
    return NextResponse.json({ ok: false, error: "Canonical ID must start with EX." }, { status: 400 });
  }
  if (canonicalId === exerciseId) {
    return NextResponse.json({ ok: false, error: "Canonical ID must not equal the current exercise ID." }, { status: 400 });
  }
  if (!reviewNotes?.trim()) {
    return NextResponse.json({ ok: false, error: "Review notes are required when marking as duplicate." }, { status: 400 });
  }

  try {
    const token = await getInstallationToken(config);

    const result = await fetchExerciseFromBranch(exerciseId, "community", token);
    if (!result) {
      return NextResponse.json({ ok: false, error: "Exercise not found on community branch." }, { status: 404 });
    }

    const { raw, sha } = result;
    const today = todayISO();

    const meta = (raw.metadata ?? {}) as Record<string, unknown>;
    const existingReviewedBy: string[] = Array.isArray(meta.reviewedBy)
      ? meta.reviewedBy as string[]
      : [];
    const reviewedBy = existingReviewedBy.includes(username)
      ? existingReviewedBy
      : [...existingReviewedBy, username];

    const metadata = {
      ...meta,
      reviewStatus: "rejected",
      reviewedBy,
      dateReviewed: today,
      reviewNotes: reviewNotes.trim(),
      lastUpdated: today,
      lastEditedBy: username,
      dedupStatus: "duplicate",
      duplicateOf: canonicalId.trim(),
    };

    const finalExercise = { ...raw, metadata };
    const jsonContent = JSON.stringify(finalExercise, null, 2);

    await commitFile(
      token,
      "community",
      `exercises/${exerciseId}.json`,
      jsonContent,
      `Mark duplicate ${exerciseId}`,
      sha
    );

    // Remove from community index (duplicate exercises shouldn't appear in review)
    await removeFromIndex(token, "community", exerciseId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("Duplicate error:", message);
    return NextResponse.json(
      { ok: false, error: process.env.NODE_ENV === "development" ? message : "Action failed." },
      { status: 500 }
    );
  }
}
