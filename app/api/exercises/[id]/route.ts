import { NextResponse } from "next/server";
import {
  fetchExerciseRaw,
  resolveAllImageUrls,
  exerciseImageUrl,
  OWNER,
  REPO,
  RAW_BASE,
} from "@/lib/github-raw";

/**
 * GET /api/exercises/[id]?track=main|community
 *
 * Fetches a single exercise by ID using raw GitHub URLs.
 * No GitHub REST API calls — pure raw content reads.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const url = new URL(_request.url);
  const trackParam = url.searchParams.get("track");

  // Try the requested track first, then the other
  const branches: Array<"main" | "community"> =
    trackParam === "community"
      ? ["community", "main"]
      : ["main", "community"];

  let raw: Record<string, unknown> | null = null;
  let branch: "main" | "community" = "main";

  for (const b of branches) {
    raw = await fetchExerciseRaw(b, id);
    if (raw) {
      branch = b;
      break;
    }
  }

  if (!raw) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  const track = branch === "main" ? "validated" : "community";
  const exId = raw.id ? String(raw.id) : id;

  // Resolve all image URLs — probe which folder convention exists
  const mc = raw.mediaContent as Record<string, unknown> | undefined;
  const imageFileNames = Array.isArray(mc?.imageURLs)
    ? (mc!.imageURLs as string[])
    : [];

  let imageFolder: string = exId;
  if (imageFileNames.length > 0) {
    // Check if the direct folder exists via a HEAD request on the first image
    const directUrl = exerciseImageUrl(branch, exId, imageFileNames[0]);
    try {
      const check = await fetch(directUrl, { method: "HEAD" });
      if (!check.ok) {
        // Try Ex-N convention for old exercises
        const altFolder = exId.replace(/^EX-/i, "Ex-");
        const altUrl = `${RAW_BASE}/${branch}/images/${altFolder}/${imageFileNames[0]}`;
        const altCheck = await fetch(altUrl, { method: "HEAD" });
        if (altCheck.ok) {
          imageFolder = altFolder;
        }
      }
    } catch {
      // Keep default folder
    }
  }

  const imageUrls = resolveAllImageUrls(branch, exId, imageFileNames, imageFolder);

  return NextResponse.json(
    {
      ...raw,
      track,
      branch,
      fileNumber: exId,
      resolvedImageUrls: imageUrls,
      githubUrl: `https://github.com/${OWNER}/${REPO}/blob/${branch}/exercises/${exId}.json`,
    },
    {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
}
