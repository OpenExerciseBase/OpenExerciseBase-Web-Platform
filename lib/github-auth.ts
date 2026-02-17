/**
 * GitHub OAuth helpers for reviewer authentication.
 *
 * Env vars required:
 *   GITHUB_CLIENT_ID       — OAuth App client ID
 *   GITHUB_CLIENT_SECRET   — OAuth App client secret
 *
 * The OAuth flow:
 *   1. Redirect user to GitHub authorize URL
 *   2. GitHub redirects back with ?code=...
 *   3. Exchange code for access token
 *   4. Fetch GitHub username with token
 */

const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN = "https://github.com/login/oauth/access_token";
const GITHUB_USER = "https://api.github.com/user";

export function getOAuthConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** Build the GitHub OAuth authorize URL. */
export function buildAuthorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user",
    state,
  });
  return `${GITHUB_AUTHORIZE}?${params.toString()}`;
}

/** Exchange an authorization code for an access token. */
export async function exchangeCodeForToken(
  clientId: string,
  clientSecret: string,
  code: string
): Promise<string | null> {
  const res = await fetch(GITHUB_TOKEN, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

/** Fetch the authenticated GitHub user's login (username). */
export async function fetchGitHubUsername(accessToken: string): Promise<string | null> {
  const res = await fetch(GITHUB_USER, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.login ?? null;
}

/** Check if a username is in the verified reviewers list. */
export async function isVerifiedReviewer(username: string): Promise<boolean> {
  const REPO = "rania-is/samplejson";
  const url = `https://raw.githubusercontent.com/${REPO}/main/config/verified_reviewers.json`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return false;
    const data = await res.json();
    const reviewers: string[] = Array.isArray(data)
      ? data
      : Array.isArray(data.reviewers)
        ? data.reviewers
        : [];
    return reviewers.some(
      (r) => r.toLowerCase() === username.toLowerCase()
    );
  } catch {
    return false;
  }
}
