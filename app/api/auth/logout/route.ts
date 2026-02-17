import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Clears session cookies.
 */
export async function POST(request: NextRequest) {
  const returnTo = new URL(request.nextUrl.searchParams.get("returnTo") ?? "/review", request.url);
  const response = NextResponse.redirect(returnTo);
  response.cookies.delete("gh_token");
  response.cookies.delete("gh_username");
  return response;
}
