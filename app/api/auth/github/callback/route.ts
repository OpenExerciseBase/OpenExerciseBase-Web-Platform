import { NextRequest, NextResponse } from "next/server";
import {
  getOAuthConfig,
  exchangeCodeForToken,
  fetchGitHubUsername,
} from "@/lib/github-auth";

/**
 * GET /api/auth/github/callback?code=...&state=...
 * GitHub redirects here after the user authorizes.
 * Exchanges code for token, fetches username, sets session cookie.
 */
export async function GET(request: NextRequest) {
  const config = getOAuthConfig();
  if (!config) {
    return NextResponse.redirect(new URL("/review?error=oauth_not_configured", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("gh_oauth_state")?.value;
  const returnTo = request.cookies.get("gh_oauth_return")?.value ?? "/review";

  // Validate state
  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/review?error=invalid_state", request.url));
  }

  // Exchange code for token
  const accessToken = await exchangeCodeForToken(
    config.clientId,
    config.clientSecret,
    code
  );

  if (!accessToken) {
    return NextResponse.redirect(new URL("/review?error=token_exchange_failed", request.url));
  }

  // Fetch username
  const username = await fetchGitHubUsername(accessToken);
  if (!username) {
    return NextResponse.redirect(new URL("/review?error=user_fetch_failed", request.url));
  }

  // Set session cookies
  const response = NextResponse.redirect(new URL(returnTo, request.url));

  // Store token and username in httpOnly cookies
  response.cookies.set("gh_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 86400, // 24 hours
    path: "/",
  });
  response.cookies.set("gh_username", username, {
    httpOnly: false, // readable by client JS
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 86400,
    path: "/",
  });

  // Clean up OAuth cookies
  response.cookies.delete("gh_oauth_state");
  response.cookies.delete("gh_oauth_return");

  return response;
}
