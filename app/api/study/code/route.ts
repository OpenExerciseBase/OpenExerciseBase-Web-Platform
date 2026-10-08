import { NextRequest, NextResponse } from "next/server";

const RAW_BASE = "https://raw.githubusercontent.com/OpenExerciseBase/OpenExerciseBase-Database";

/**
 * POST /api/study/code
 * Body: { code: string }
 *
 * Validates a study code against the assignments file and sets a cookie.
 */
export async function POST(request: NextRequest) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${RAW_BASE}/main/study/assignments.json`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Could not load study assignments" },
        { status: 500 }
      );
    }

    const data = await res.json();
    const reviewers = Array.isArray(data?.reviewers) ? data.reviewers : [];
    const match = reviewers.find(
      (r: { code?: string }) =>
        r.code && r.code.toLowerCase() === code.toLowerCase()
    );

    if (!match) {
      return NextResponse.json(
        { error: "Invalid study code" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("study_code", code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Could not validate code" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/study/code
 * Clears the study code cookie.
 */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("study_code", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
