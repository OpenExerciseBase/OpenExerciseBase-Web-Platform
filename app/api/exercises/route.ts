import { NextResponse } from "next/server";
import {
  fetchIndex,
  exerciseImageUrl,
  ExerciseIndexEntry,
} from "@/lib/github-raw";

/**
 * GET /api/exercises
 *
 * Returns exercises from both main (validated) and community branches.
 * Reads from index.json via raw GitHub URLs — no GitHub REST API calls.
 */

interface Exercise {
  track: "validated" | "community";
  id: string;
  name: string;
  categories: string[];
  bodyParts: string[];
  equipment: string[];
  location: string[];
  imageUrl: string | null;
  lastUpdated: string | null;
  reviewStatus: string;
}

function toExercise(
  entry: ExerciseIndexEntry,
  branch: "main" | "community"
): Exercise {
  const track: Exercise["track"] =
    branch === "main" ? "validated" : "community";

  return {
    track,
    id: entry.id,
    name: entry.name,
    categories: entry.categories,
    bodyParts: entry.bodyParts,
    equipment: entry.equipment,
    location: entry.location,
    imageUrl: entry.imageFile
      ? exerciseImageUrl(branch, entry.id, entry.imageFile, entry.imageFolder)
      : null,
    lastUpdated: entry.lastUpdated,
    reviewStatus: track === "validated" ? "accepted" : "unreviewed",
  };
}

export async function GET() {
  try {
    const [mainIndex, communityIndex] = await Promise.all([
      fetchIndex("main"),
      fetchIndex("community"),
    ]);

    const validated: Exercise[] = mainIndex
      ? mainIndex.exercises.map((e) => toExercise(e, "main"))
      : [];

    const community: Exercise[] = communityIndex
      ? communityIndex.exercises.map((e) => toExercise(e, "community"))
      : [];

    return NextResponse.json(
      { validated, community, communityError: !communityIndex },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (err) {
    console.error("GET /api/exercises error:", err);
    return NextResponse.json(
      { validated: [], community: [], communityError: true, error: String(err) },
      { status: 500 }
    );
  }
}
