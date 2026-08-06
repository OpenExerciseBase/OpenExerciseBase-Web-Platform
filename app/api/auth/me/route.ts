import { NextRequest, NextResponse } from "next/server";
import { isVerifiedReviewer } from "@/lib/github-auth";

/**
 * GET /api/auth/me
 * Returns the current session info: username, verified status.
 * Also supports study_code cookie for code-based study access.
 */
export async function GET(request: NextRequest) {
  const username = request.cookies.get("gh_username")?.value;
  const token = request.cookies.get("gh_token")?.value;
  const code = request.cookies.get("study_code")?.value;

  if (code) {
    return NextResponse.json({
      loggedIn: true,
      username: code,
      code: true,
      verified: false,
    });
  }

  if (!username || !token) {
    return NextResponse.json({ loggedIn: false });
  }

  const verified = await isVerifiedReviewer(username);

  return NextResponse.json({
    loggedIn: true,
    username,
    verified,
  });
}
