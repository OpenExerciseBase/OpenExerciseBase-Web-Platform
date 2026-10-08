export interface SubmitImage {
  filename: string;
  contentBase64: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SubmitRequest {
  exercise: Record<string, unknown>;
  images: SubmitImage[];
  source?: "form" | "ai";
  contributorName: string;
  contributorEmail: string;
}

export interface SubmitResponse {
  ok: boolean;
  id: string;
  prUrl: string;
}

export interface SubmitError {
  ok: false;
  error: string;
}

/**
 * Submit an exercise to the server API route.
 * Returns the parsed response or throws with a user-friendly message.
 */
export async function submitExercise(
  body: SubmitRequest
): Promise<SubmitResponse> {
  const res = await fetch("/api/submit-exercise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const message =
      (data as SubmitError).error ||
      `Submission failed (${res.status})`;
    throw new Error(message);
  }

  return data as SubmitResponse;
}
