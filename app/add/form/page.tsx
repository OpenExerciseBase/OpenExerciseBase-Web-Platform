"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

import type { ExerciseFormState } from "@/components/add-form/types";
import {
  generateId,
  regenerateId,
  validate,
  assembleJSON,
  defaultFormState,
} from "@/components/add-form/helpers";
import { fileToBase64, normalizeFilename } from "@/components/add-form/imageUtils";
import { submitExercise } from "@/components/add-form/api";

import IdentitySection from "@/components/add-form/FormSections/IdentitySection";
import ClassificationSection from "@/components/add-form/FormSections/ClassificationSection";
import BodyEquipmentSection from "@/components/add-form/FormSections/BodyEquipmentSection";
import InstructionsSection from "@/components/add-form/FormSections/InstructionsSection";
import PerformanceMetricsSection from "@/components/add-form/FormSections/PerformanceMetricsSection";
import VariationsSection from "@/components/add-form/FormSections/VariationsSection";
import MediaSection from "@/components/add-form/FormSections/MediaSection";
import NotesSection from "@/components/add-form/FormSections/NotesSection";
import ValidationPanel from "@/components/add-form/ValidationPanel";
import ExportBar from "@/components/add-form/ExportBar";
import PreviewPanel from "@/components/add-form/PreviewPanel";
import SubmitModal from "@/components/add-form/SubmitModal";
import ErrorBanner from "@/components/add-form/ErrorBanner";

interface AiImage {
  filename: string;
  mimeType: string;
  base64: string;
}

export default function AddFormPage() {
  const [form, setForm] = useState<ExerciseFormState>(defaultFormState);
  const [hasEdited, setHasEdited] = useState(false);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [aiDraftBanner, setAiDraftBanner] = useState(false);

  /* ── AI image state ── */
  const [aiImages, setAiImages] = useState<AiImage[]>([]);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageGenError, setImageGenError] = useState<string | null>(null);

  /* ── Submit state ── */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    id: string;
    prUrl: string;
  } | null>(null);

  /* ── Hydrate from AI draft (sessionStorage) ── */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("oexdb_ai_draft");
      if (!raw) return;
      sessionStorage.removeItem("oexdb_ai_draft");

      const parsed = JSON.parse(raw);

      // Support new format { draft, images } and legacy flat format
      let draft: Record<string, unknown>;
      let storedImages: AiImage[] = [];
      if (parsed && typeof parsed === "object" && "draft" in parsed) {
        draft = parsed.draft as Record<string, unknown>;
        storedImages = Array.isArray(parsed.images) ? (parsed.images as AiImage[]) : [];
      } else {
        draft = parsed as Record<string, unknown>;
      }

      const hydrated: ExerciseFormState = {
        id: "", // will be generated from name below
        name: typeof draft.name === "string" ? draft.name : "",
        categories: Array.isArray(draft.categories) ? (draft.categories as string[]) : [],
        exerciseEffects: Array.isArray(draft.exerciseEffects) ? (draft.exerciseEffects as string[]) : [],
        bodyParts: Array.isArray(draft.bodyParts) ? (draft.bodyParts as string[]) : [],
        equipment: Array.isArray(draft.equipment) ? (draft.equipment as string[]) : [],
        location: Array.isArray(draft.location) ? (draft.location as string[]) : [],
        instructions: Array.isArray(draft.instructions)
          ? (draft.instructions as { stepNumber: number; description: string }[]).map((s, i) => ({
              stepNumber: i + 1,
              description: typeof s.description === "string" ? s.description : "",
            }))
          : [{ stepNumber: 1, description: "" }, { stepNumber: 2, description: "" }],
        performanceMetrics: Array.isArray(draft.performanceMetrics)
          ? (draft.performanceMetrics as { type: string; unit: string | null; notes: string | null }[]).map((m) => ({
              type: m.type ?? "",
              unit: m.unit ?? null,
              notes: m.notes ?? null,
            }))
          : [],
        variations: [],
        variationSuggestions: Array.isArray(draft.variations)
          ? (draft.variations as { exerciseName?: string; name?: string; variationDescription?: string; description?: string }[]).map((v) => ({
              exerciseName: (v.exerciseName ?? v.name ?? "") as string,
              variationDescription: (v.variationDescription ?? v.description ?? "") as string,
            }))
          : [],
        relationships: [],
        imageURLs: [],
        imageFiles: [],
        commentsNotes: Array.isArray(draft.commentsNotes) ? (draft.commentsNotes as string[]) : [],
      };

      // Generate ID from name
      if (hydrated.name.trim()) {
        hydrated.id = generateId(hydrated.name);
      }

      setForm(hydrated);
      setHasEdited(true);
      setAiDraftBanner(true);
      if (storedImages.length > 0) {
        setAiImages(storedImages);
      }
    } catch {
      // Ignore corrupt sessionStorage data
    }
  }, []);

  /* ── Generate ID from name ── */
  useEffect(() => {
    if (form.name.trim()) {
      setForm((prev) => {
        // Only generate if no id yet or name changed the slug
        if (!prev.id) {
          return { ...prev, id: generateId(prev.name) };
        }
        return prev;
      });
    } else {
      setForm((prev) => ({ ...prev, id: "" }));
    }
  }, [form.name]);

  /* ── Form update helper ── */
  const onChange = useCallback((patch: Partial<ExerciseFormState>) => {
    setHasEdited(true);
    setForm((prev) => {
      const next = { ...prev, ...patch };
      // If name changed and we have a name, regenerate id with new slug
      if ("name" in patch && patch.name !== undefined) {
        if (patch.name.trim()) {
          next.id = generateId(patch.name);
        } else {
          next.id = "";
        }
      }
      return next;
    });
  }, []);

  /* ── Regenerate ID (keep slug, new ULID) ── */
  const handleRefreshId = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      id: regenerateId(prev.id, prev.name),
    }));
  }, []);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setForm(defaultFormState());
    setHasEdited(false);
  }, []);

  /* ── Validation ── */
  const validation = useMemo(() => validate(form), [form]);

  /* ── Regenerate AI image ── */
  const handleRegenerateImage = useCallback(async () => {
    setGeneratingImage(true);
    setImageGenError(null);

    try {
      const exercise = assembleJSON(form);
      const res = await fetch("/api/generate-exercise-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise }),
      });

      const data = await res.json();

      if (!data.ok) {
        setImageGenError(data.error ?? "Failed to generate image.");
        return;
      }

      setAiImages(data.images ?? []);
    } catch (err) {
      setImageGenError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setGeneratingImage(false);
    }
  }, [form]);

  /* ── Submit handler ── */
  const handleSubmit = useCallback(async () => {
    if (!validation.valid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Build exercise JSON
      const exercise = assembleJSON(form);

      // Convert user-uploaded image files to base64
      const fileImages = await Promise.all(
        form.imageFiles.map(async (file) => ({
          filename: normalizeFilename(file.name),
          contentBase64: await fileToBase64(file),
          mimeType: file.type,
          sizeBytes: file.size,
        }))
      );

      // Add AI-generated images
      const aiImagePayloads = aiImages.map((img) => ({
        filename: img.filename,
        contentBase64: img.base64,
        mimeType: img.mimeType,
        sizeBytes: Math.ceil((img.base64.length * 3) / 4),
      }));

      const allImages = [...fileImages, ...aiImagePayloads];

      // Update imageURLs in exercise JSON to include AI images
      if (aiImagePayloads.length > 0) {
        const currentUrls = (exercise.mediaContent as { imageURLs: string[] }).imageURLs;
        const aiFilenames = aiImagePayloads.map((img) => img.filename);
        (exercise.mediaContent as { imageURLs: string[] }).imageURLs = [
          ...currentUrls,
          ...aiFilenames,
        ];
      }

      const result = await submitExercise({ exercise, images: allImages, source: aiDraftBanner ? "ai" : "form" });
      setSubmitResult({ id: result.id, prUrl: result.prUrl });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validation.valid, submitting, aiImages]);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <PageHeader />

      {/* Breadcrumb */}
      <div className="mx-auto w-full max-w-7xl px-6 pt-6">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/add" className="hover:text-primary transition-colors">
            Add exercise
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-900">Create with a form</span>
        </nav>
      </div>

      {/* Mobile tabs */}
      <div className="mx-auto w-full max-w-7xl px-6 pt-4 lg:hidden">
        <div className="flex rounded-xl border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setMobileTab("form")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mobileTab === "form"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Form
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mobileTab === "preview"
                ? "bg-primary text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-6 py-6">
        {/* Left: Form (hidden on mobile when preview tab active) */}
        <div
          className={`w-full space-y-6 lg:w-3/5 ${
            mobileTab === "preview" ? "hidden lg:block" : ""
          }`}
        >
          {aiDraftBanner && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-primary">AI draft loaded</p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    This form has been pre-filled with an AI generated draft. Review and edit all fields before submitting.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/add/ai"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  Regenerate
                </Link>
                <button
                  type="button"
                  onClick={() => setAiDraftBanner(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {submitError && (
            <ErrorBanner
              message={submitError}
              onDismiss={() => setSubmitError(null)}
            />
          )}
          <ValidationPanel validation={validation} />
          <IdentitySection
            form={form}
            onChange={onChange}
            onRefreshId={handleRefreshId}
          />
          <ClassificationSection form={form} onChange={onChange} />
          <BodyEquipmentSection form={form} onChange={onChange} />
          <InstructionsSection form={form} onChange={onChange} />
          <PerformanceMetricsSection form={form} onChange={onChange} />
          <VariationsSection form={form} onChange={onChange} />
          <MediaSection form={form} onChange={onChange} />

          {/* AI generated image section */}
          {aiDraftBanner && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">AI generated image</h3>
                {aiImages.length > 0 && (
                  <span className="text-xs text-emerald-600 font-medium">1 image</span>
                )}
              </div>

              {/* Image preview */}
              {aiImages.length > 0 && (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={`data:${aiImages[0].mimeType};base64,${aiImages[0].base64}`}
                    alt="AI generated exercise image"
                    className="w-full max-h-80 object-contain"
                  />
                </div>
              )}

              {/* Image generation error */}
              {imageGenError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{imageGenError}</p>
                </div>
              )}

              {/* Image action buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleRegenerateImage}
                  disabled={generatingImage}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generatingImage ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                      Generating image
                    </>
                  ) : aiImages.length > 0 ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                      </svg>
                      Regenerate image
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                      Generate image
                    </>
                  )}
                </button>
                {aiImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAiImages([])}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Remove image
                  </button>
                )}
              </div>
            </div>
          )}

          <NotesSection form={form} onChange={onChange} />
        </div>

        {/* Right: Preview (hidden on mobile when form tab active) */}
        <aside
          className={`w-full lg:w-2/5 ${
            mobileTab === "form" ? "hidden lg:block" : ""
          }`}
        >
          <div className="sticky top-20 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Live preview
              </span>
            </div>
            <PreviewPanel form={form} />
          </div>
        </aside>
      </div>

      {/* Export bar */}
      <ExportBar
        form={form}
        validation={validation}
        onReset={handleReset}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* Submit success modal */}
      {submitResult && (
        <SubmitModal
          id={submitResult.id}
          prUrl={submitResult.prUrl}
          onClose={() => setSubmitResult(null)}
        />
      )}
    </div>
  );
}
