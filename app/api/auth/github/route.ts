import { NextRequest, NextResponse } from "next/server";
import { getOAuthConfig, buildAuthorizeUrl } from "@/lib/github-auth";
import crypto from "crypto";

/**
 * GET /api/auth/github?returnTo=/review/EX-123
 * Redirects the user to GitHub OAuth authorize page.
 */
export async function GET(request: NextRequest) {
  const config = getOAuthConfig();
  if (!config) {
    return NextResponse.json(
      { error: "GitHub OAuth is not configured." },
      { status: 500 }
    );
  }

  const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/review";
  const state = crypto.randomBytes(16).toString("hex");

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/github/callback`;

  const authorizeUrl = buildAuthorizeUrl(config.clientId, redirectUri, state);

  const response = NextResponse.redirect(authorizeUrl);

  // Store state + returnTo in a short-lived cookie
  response.cookies.set("gh_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  response.cookies.set("gh_oauth_return", returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
