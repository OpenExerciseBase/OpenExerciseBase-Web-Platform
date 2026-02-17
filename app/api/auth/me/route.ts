import { NextRequest, NextResponse } from "next/server";
import { isVerifiedReviewer } from "@/lib/github-auth";

/**
 * GET /api/auth/me
 * Returns the current session info: username, verified status.
 */
export async function GET(request: NextRequest) {
  const username = request.cookies.get("gh_username")?.value;
  const token = request.cookies.get("gh_token")?.value;

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
