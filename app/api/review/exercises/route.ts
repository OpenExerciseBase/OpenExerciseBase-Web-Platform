import { NextRequest, NextResponse } from "next/server";
import { fetchIndex, exerciseImageUrl } from "@/lib/github-raw";

/**
 * GET /api/review/exercises
 * Returns community exercises for the review dashboard.
 * Reads from index.json via raw GitHub URL — no GitHub REST API calls.
 */
export async function GET(request: NextRequest) {
  const username = request.cookies.get("gh_username")?.value;
  const token = request.cookies.get("gh_token")?.value;

  if (!username || !token) {
    return NextResponse.json(
      { ok: false, error: "Not authenticated." },
      { status: 401 }
    );
  }

  try {
    const index = await fetchIndex("community");
    if (!index) {
      return NextResponse.json({ ok: true, exercises: [] });
    }

    const exercises = index.exercises.map((e) => ({
      id: e.id,
      name: e.name,
      categories: e.categories,
      bodyParts: e.bodyParts,
      equipment: e.equipment,
      location: e.location,
      imageUrl: e.imageFile
        ? exerciseImageUrl("community", e.id, e.imageFile, e.imageFolder)
        : null,
      reviewStatus: "community",
    }));

    return NextResponse.json({ ok: true, exercises });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("Fetch review exercises error:", message);
    return NextResponse.json(
      { ok: false, error: "Failed to load exercises." },
      { status: 500 }
    );
  }
}
