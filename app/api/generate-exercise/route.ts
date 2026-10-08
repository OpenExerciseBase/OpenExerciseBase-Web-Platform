import { NextRequest, NextResponse } from "next/server";

/* ── Config ── */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-3.5-turbo";
const TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE ?? "0.3");

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ── Allowed enums ── */

const ALLOWED_CATEGORIES = new Set([
  "endurance",
  "strength_and_resistance",
  "flexibility_and_mobility",
  "balance_and_coordination",
  "relaxation_and_breathing",
]);

const ALLOWED_EFFECTS = new Set([
  "improved_body_balance",
  "improved_posture",
  "improved_range_of_motion",
  "increased_bone_strength",
  "increased_breathing",
  "increased_heart_rate",
  "increased_muscle_strength",
  "relieve_muscle_tension",
  "stretch_muscle",
]);

const ALLOWED_METRIC_TYPES = new Set([
  "distance",
  "repetitions",
  "load",
  "duration",
  "heart_rate_percentage",
  "physiological_parameters",
]);

const ALLOWED_LOCATIONS = new Set(["indoor", "outdoor"]);

/* ── System prompt ── */

const SYSTEM_PROMPT = `You are an assistant that generates a single structured exercise draft for OpenExerciseBase.

Return only valid JSON. Do not include any commentary or markdown. The output must be a single JSON object.

The JSON must follow this schema exactly:

{
"id": "string",
"name": "string",
"categories": ["endurance | strength_and_resistance | flexibility_and_mobility | balance_and_coordination | relaxation_and_breathing"],
"exerciseEffects": ["improved_body_balance","improved_posture","improved_range_of_motion","increased_bone_strength","increased_breathing","increased_heart_rate","increased_muscle_strength","relieve_muscle_tension","stretch_muscle"],
"bodyParts": ["string"],
"equipment": ["string"],
"location": ["indoor","outdoor"],
"instructions": [{ "stepNumber": number, "description": "string" }],
"performanceMetrics": [{ "type": "distance | repetitions | load | duration | heart_rate_percentage | physiological_parameters", "unit": "string | null", "notes": "string | null" }],
"variations": [{ "variationDescription": "string" }],
"relationships": [],
"mediaContent": { "imageURLs": [] },
"metadata": {
"createdBy": "co-created with AI",
"reviewStatus": "unreviewed",
"reviewedBy": [],
"dateReviewed": null,
"reviewNotes": null,
"dateCreated": "YYYY-MM-DD",
"lastUpdated": "YYYY-MM-DD",
"lastEditedBy": "co-created with AI",
"dedupStatus": "unknown",
"duplicateOf": null
},
"commentsNotes": ["string"]
}

Rules:

* id must be "pending"
* Provide 4 to 7 instruction steps
* Use only allowed enum values
* Avoid medical claims
* Use neutral language
* Provide 2 to 5 commentsNotes focused on safety and technique
* If difficulty is beginner keep simple
* If advanced increase complexity but remain safe
* If user provides special considerations avoid unsafe movements
* Never invent image filenames`;

/* ── Build user message ── */

interface GenerateRequest {
  exerciseGoal?: string;
  categories?: string[];
  bodyParts?: string[];
  equipment?: string[];
  location?: string[];
  difficulty?: string;
  specialConsiderations?: string;
  noGoMovements?: string;
}

function buildUserMessage(input: GenerateRequest): string {
  const parts: string[] = ["Generate one exercise with the following constraints:"];

  if (input.exerciseGoal?.trim()) {
    parts.push(`Goal: ${input.exerciseGoal.trim()}`);
  }
  if (input.categories?.length) {
    parts.push(`Categories: ${input.categories.join(", ")}`);
  }
  if (input.bodyParts?.length) {
    parts.push(`Target body parts: ${input.bodyParts.join(", ")}`);
  }
  if (input.equipment?.length) {
    parts.push(`Equipment: ${input.equipment.join(", ")}`);
  } else {
    parts.push("Equipment: no equipment required");
  }
  if (input.location?.length) {
    parts.push(`Location: ${input.location.join(", ")}`);
  }
  if (input.difficulty?.trim()) {
    parts.push(`Difficulty: ${input.difficulty.trim()}`);
  }
  if (input.specialConsiderations?.trim()) {
    parts.push(`Special considerations: ${input.specialConsiderations.trim()}`);
  }
  if (input.noGoMovements?.trim()) {
    parts.push(`Movements to avoid: ${input.noGoMovements.trim()}`);
  }

  return parts.join("\n");
}

/* ── Call OpenAI ── */

async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  isRetry = false
): Promise<string> {
  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userMessage },
  ];

  if (isRetry) {
    messages.push({
      role: "user" as const,
      content:
        "Your previous response was not valid JSON. Please return ONLY a valid JSON object with no markdown, no commentary, and no code fences.",
    });
  }

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: TEMPERATURE,
      messages,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  return content.trim();
}

/* ── Validate and normalize ── */

function validateAndNormalize(
  raw: Record<string, unknown>
): Record<string, unknown> {
  const today = todayISO();

  // Force id to pending
  raw.id = "pending";

  // Validate categories
  if (Array.isArray(raw.categories)) {
    raw.categories = (raw.categories as string[]).filter((c) =>
      ALLOWED_CATEGORIES.has(c)
    );
  }
  if (!Array.isArray(raw.categories) || (raw.categories as string[]).length === 0) {
    raw.categories = ["strength_and_resistance"];
  }

  // Validate exerciseEffects
  if (Array.isArray(raw.exerciseEffects)) {
    raw.exerciseEffects = (raw.exerciseEffects as string[]).filter((e) =>
      ALLOWED_EFFECTS.has(e)
    );
  }
  if (!Array.isArray(raw.exerciseEffects)) {
    raw.exerciseEffects = [];
  }

  // Ensure bodyParts
  if (!Array.isArray(raw.bodyParts) || (raw.bodyParts as string[]).length === 0) {
    raw.bodyParts = ["full body"];
  }

  // Ensure equipment is array
  if (!Array.isArray(raw.equipment)) {
    raw.equipment = [];
  }

  // Validate location
  if (Array.isArray(raw.location)) {
    raw.location = (raw.location as string[]).filter((l) =>
      ALLOWED_LOCATIONS.has(l)
    );
  }
  if (!Array.isArray(raw.location) || (raw.location as string[]).length === 0) {
    raw.location = ["indoor"];
  }

  // Validate instructions (4-7 steps, sequential numbering)
  if (Array.isArray(raw.instructions)) {
    let steps = raw.instructions as { stepNumber: number; description: string }[];
    // Filter out empty descriptions
    steps = steps.filter(
      (s) => s && typeof s.description === "string" && s.description.trim()
    );
    if (steps.length < 4) {
      // Pad with generic steps if too few
      while (steps.length < 4) {
        steps.push({
          stepNumber: steps.length + 1,
          description: "Continue the movement with controlled form.",
        });
      }
    }
    if (steps.length > 7) {
      steps = steps.slice(0, 7);
    }
    // Renumber sequentially
    raw.instructions = steps.map((s, i) => ({
      stepNumber: i + 1,
      description: s.description,
    }));
  } else {
    raw.instructions = [
      { stepNumber: 1, description: "Begin in the starting position." },
      { stepNumber: 2, description: "Perform the movement with control." },
      { stepNumber: 3, description: "Return to the starting position." },
      { stepNumber: 4, description: "Repeat for the desired number of repetitions." },
    ];
  }

  // Validate performanceMetrics
  if (Array.isArray(raw.performanceMetrics)) {
    raw.performanceMetrics = (
      raw.performanceMetrics as { type: string; unit: string | null; notes: string | null }[]
    )
      .filter((m) => m && ALLOWED_METRIC_TYPES.has(m.type))
      .map((m) => ({
        type: m.type,
        unit: m.unit || null,
        notes: m.notes || null,
      }));
  } else {
    raw.performanceMetrics = [];
  }

  // Variations are free text only
  raw.variations = (
    Array.isArray(raw.variations)
      ? (raw.variations as { variationDescription?: string; description?: string }[])
      : []
  )
    .map((v) => String(v?.variationDescription ?? v?.description ?? "").trim())
    .filter(Boolean)
    .map((variationDescription) => ({ variationDescription }));
  delete raw.variationSuggestions;

  // Force empty arrays
  raw.relationships = [];

  // Force empty imageURLs
  raw.mediaContent = { imageURLs: [] };

  // Overwrite metadata
  raw.metadata = {
    createdBy: "co-created with AI",
    reviewStatus: "unreviewed",
    reviewedBy: [],
    dateReviewed: null,
    reviewNotes: null,
    dateCreated: today,
    lastUpdated: today,
    lastEditedBy: "co-created with AI",
    dedupStatus: "unknown",
    duplicateOf: null,
  };

  // Ensure commentsNotes
  if (!Array.isArray(raw.commentsNotes)) {
    raw.commentsNotes = [];
  }

  // Ensure name
  if (!raw.name || typeof raw.name !== "string" || !raw.name.trim()) {
    raw.name = "Untitled Exercise";
  }

  return raw;
}

/* ── Parse JSON from OpenAI response ── */

function parseJSON(text: string): Record<string, unknown> {
  // Strip markdown code fences if present
  let cleaned = text;
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1];
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

/* ── Main handler ── */

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "OpenAI API key is not configured. Set OPENAI_API_KEY in your environment." },
      { status: 500 }
    );
  }

  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const userMessage = buildUserMessage(body);

  try {
    // First attempt
    let responseText = await callOpenAI(apiKey, SYSTEM_PROMPT, userMessage);
    let parsed: Record<string, unknown>;

    try {
      parsed = parseJSON(responseText);
    } catch {
      // Retry once
      responseText = await callOpenAI(apiKey, SYSTEM_PROMPT, userMessage, true);
      try {
        parsed = parseJSON(responseText);
      } catch {
        return NextResponse.json(
          { ok: false, error: "AI returned invalid JSON after retry. Please try again." },
          { status: 502 }
        );
      }
    }

    const draft = validateAndNormalize(parsed);

    return NextResponse.json({ ok: true, draft });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Generate exercise error:", message);
    return NextResponse.json(
      { ok: false, error: `Failed to generate exercise: ${message}` },
      { status: 500 }
    );
  }
}
