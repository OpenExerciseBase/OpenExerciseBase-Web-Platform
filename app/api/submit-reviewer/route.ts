import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const endpoint = process.env.GOOGLE_REVIEWER_FORM_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json(
      { ok: false, error: "Reviewer form endpoint is not configured." },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  // Honeypot check — silently succeed
  if (body.honeypot) {
    return NextResponse.json({ ok: true });
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "follow",
    });

    // Google Apps Script may return 200 with HTML or JSON
    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();
    // If we got JSON back, parse it
    if (contentType.includes("application/json")) {
      try {
        const data = JSON.parse(text);
        if (data.ok === false) {
          return NextResponse.json({ ok: false, error: data.error ?? "Submission rejected by server." });
        }
        return NextResponse.json({ ok: data.ok ?? (data.result === "success") });
      } catch {
        // JSON parse failed, fall through
      }
    }

    // Google Apps Script often returns 200 with HTML on success (after redirect)
    if (res.ok || res.status === 302) {
      return NextResponse.json({ ok: true });
    }

    console.error("Google Apps Script error:", res.status, text.slice(0, 500));
    return NextResponse.json(
      { ok: false, error: "Submission failed. Please try again later." },
      { status: 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    console.error("Reviewer form submission error:", message);
    return NextResponse.json(
      { ok: false, error: "Submission failed. Please try again later." },
      { status: 500 }
    );
  }
}
