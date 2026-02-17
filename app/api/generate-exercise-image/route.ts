import { NextRequest, NextResponse } from "next/server";

/* ── Config ── */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/* ── Prompt template ── */

function buildImagePrompt(exercise: Record<string, unknown>): string {
  const name = (exercise.name as string) ?? "Exercise";
  const bodyParts = Array.isArray(exercise.bodyParts)
    ? (exercise.bodyParts as string[]).join(", ")
    : "full body";
  const equipment = Array.isArray(exercise.equipment) && (exercise.equipment as string[]).length > 0
    ? (exercise.equipment as string[]).join(", ")
    : "none";
  const category = Array.isArray(exercise.categories) && (exercise.categories as string[]).length > 0
    ? (exercise.categories as string[])[0]
    : "general";
  const location = Array.isArray(exercise.location) && (exercise.location as string[]).length > 0
    ? (exercise.location as string[])[0]
    : "indoor";

  const instructions = Array.isArray(exercise.instructions)
    ? (exercise.instructions as { stepNumber: number; description: string }[])
        .slice(0, 7)
        .map((s) => `Step ${s.stepNumber}: ${s.description}`)
        .join("\n")
    : "";

  return `You are generating an instructional exercise image

The image will represent ONE specific physical exercise and must be clear, neutral, and scientifically appropriate. The goal is to visually explain correct body posture and movement, not to market fitness.

EXERCISE DESCRIPTION (INPUT FROM SYSTEM)
- Exercise name: ${name}
- Targeted body parts: ${bodyParts}
- Equipment: ${equipment}
- Exercise category: ${category}
- Location: ${location}

- Steps:
${instructions}

STYLE AND TONE
- Educational and instructional
- Clean, minimal, and neutral
- No exaggerated muscle definition
- No dramatic lighting or marketing aesthetics
- No gym branding, logos, or text overlays

SUBJECT AND POSE
- Show a single adult human model
- Neutral body type and average fitness level
- Gender neutral appearance if possible
- Correct and safe form only
- No extreme joint angles or unsafe posture
- If the exercise involves motion, show a clear mid movement position

COMPOSITION
- Plain, light background or minimal studio background
- Full body visible when relevant
- Camera at a natural eye level or slightly angled
- Subject centered and clearly visible
- No clutter in the scene

CLOTHING AND APPEARANCE
- Simple athletic clothing
- Solid colors
- No logos or text
- Barefoot or standard trainers depending on exercise type

OUTPUT VARIANTS
Generate:
- One main instructional image showing correct form

TECHNICAL REQUIREMENTS
- High resolution
- Square or vertical aspect ratio
- Suitable for web and mobile display
- Photorealistic or clean illustration style, but consistent across exercises

RESTRICTIONS
- Do not include medical equipment
- Do not include weights unless specified in equipment
- Do not include text, arrows, labels, or annotations
- Do not include other people

FINAL INSTRUCTION
Generate a clear, realistic, and neutral exercise image that accurately represents the described exercise and could be used in an educational or research context.`;
}

/* ── Validation ── */

function validateExercise(exercise: unknown): exercise is Record<string, unknown> {
  if (!exercise || typeof exercise !== "object") return false;
  const ex = exercise as Record<string, unknown>;
  if (!ex.name || typeof ex.name !== "string") return false;
  if (!Array.isArray(ex.categories) || (ex.categories as string[]).length === 0) return false;
  if (!Array.isArray(ex.bodyParts)) return false;
  if (!Array.isArray(ex.equipment)) return false;
  if (!Array.isArray(ex.location)) return false;
  if (!Array.isArray(ex.instructions)) return false;
  return true;
}

/* ── Main handler ── */

export async function POST(request: NextRequest) {
  const apiKey = process.env.IMAGE_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Image generation unavailable. IMAGE_KEY not configured." },
      { status: 500 }
    );
  }

  let body: { exercise?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!validateExercise(body.exercise)) {
    return NextResponse.json(
      { ok: false, error: "Exercise must include name, categories, bodyParts, equipment, location, and instructions." },
      { status: 400 }
    );
  }

  const exercise = body.exercise as Record<string, unknown>;
  const prompt = buildImagePrompt(exercise);

  try {
    const res = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-image",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenRouter Image API error:", errText);
      return NextResponse.json(
        { ok: false, error: `Image generation failed (${res.status}): ${errText}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    // OpenRouter returns images in choices[0].message.images[0].image_url.url as a data URL
    const images = data.choices?.[0]?.message?.images;
    const dataUrl: string | undefined = images?.[0]?.image_url?.url;

    if (!dataUrl) {
      console.error("OpenRouter response missing image data:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json(
        { ok: false, error: "No image data returned from OpenRouter." },
        { status: 502 }
      );
    }

    // dataUrl is "data:image/png;base64,iVBOR..." — extract the base64 part
    const commaIdx = dataUrl.indexOf(",");
    const b64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;

    if (!b64) {
      return NextResponse.json(
        { ok: false, error: "No image data returned from OpenRouter." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      images: [
        {
          filename: "main.png",
          mimeType: "image/png",
          base64: b64,
        },
      ],
      promptUsed: prompt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("OpenRouter image generation error:", message);
    return NextResponse.json(
      { ok: false, error: `Failed to generate image: ${message}` },
      { status: 500 }
    );
  }
}
