import { NextRequest, NextResponse } from "next/server";
import { getAppConfig, getInstallationToken } from "@/lib/review-helpers";

const OWNER = "rania-is";
const REPO = "samplejson";
const BRANCH = "study/results";
const API = "https://api.github.com";

/**
 * DELETE /api/study/reset?username=rania-is
 * Deletes all study response files and progress for a given user.
 */
export async function DELETE(request: NextRequest) {
  const ghUsername = request.cookies.get("gh_username")?.value;
  const code = request.cookies.get("study_code")?.value;
  const ghToken = request.cookies.get("gh_token")?.value;
  const identifier = code ?? ghUsername;

  if (!identifier) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const targetUsername = request.nextUrl.searchParams.get("username") || identifier;

  // Code users can only reset their own data
  if (code && targetUsername.toLowerCase() !== code.toLowerCase()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const config = getAppConfig();
  if (!config) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const installToken = await getInstallationToken(config);
    const headers = {
      Authorization: `Bearer ${installToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    };

    // List all files in the user's study responses folder
    const dirUrl = `${API}/repos/${OWNER}/${REPO}/contents/study/responses/${targetUsername}?ref=${BRANCH}`;
    const dirRes = await fetch(dirUrl, { headers });

    if (!dirRes.ok) {
      if (dirRes.status === 404) {
        return NextResponse.json({ ok: true, message: "No study data found for this user.", deleted: [] });
      }
      throw new Error(`Failed to list files: ${dirRes.status}`);
    }

    const files: { name: string; path: string; sha: string }[] = await dirRes.json();
    const deleted: string[] = [];

    // Delete each file
    for (const file of files) {
      const deleteRes = await fetch(
        `${API}/repos/${OWNER}/${REPO}/contents/${file.path}`,
        {
          method: "DELETE",
          headers,
          body: JSON.stringify({
            message: `Reset study: delete ${file.path}`,
            sha: file.sha,
            branch: BRANCH,
          }),
        }
      );
      if (deleteRes.ok || deleteRes.status === 404) {
        deleted.push(file.path);
      } else {
        console.error(`Failed to delete ${file.path}: ${deleteRes.status}`);
      }
    }

    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    console.error("Study reset error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
