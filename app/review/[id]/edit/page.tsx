"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";

import type { ExerciseFormState } from "@/components/add-form/types";
import {
  validate,
  assembleJSON,
  defaultFormState,
} from "@/components/add-form/helpers";
import { fileToBase64, normalizeFilename } from "@/components/add-form/imageUtils";

import IdentitySection from "@/components/add-form/FormSections/IdentitySection";
import ClassificationSection from "@/components/add-form/FormSections/ClassificationSection";
import BodyEquipmentSection from "@/components/add-form/FormSections/BodyEquipmentSection";
import InstructionsSection from "@/components/add-form/FormSections/InstructionsSection";
import PerformanceMetricsSection from "@/components/add-form/FormSections/PerformanceMetricsSection";
import VariationsSection from "@/components/add-form/FormSections/VariationsSection";
import MediaSection from "@/components/add-form/FormSections/MediaSection";
import NotesSection from "@/components/add-form/FormSections/NotesSection";
import ValidationPanel from "@/components/add-form/ValidationPanel";
import PreviewPanel from "@/components/add-form/PreviewPanel";
import ErrorBanner from "@/components/add-form/ErrorBanner";

/**
 * Edit and Approve page.
 * Uses the same form sections as the add-exercise form,
 * prepopulated with exercise data from sessionStorage.
 * Keeps the original exercise ID and submits via /api/review/edit-approve.
 */

function hydrateFormFromExercise(
  exerciseId: string,
  ex: Record<string, unknown>
): ExerciseFormState {
  const rawVars = Array.isArray(ex.variations) ? (ex.variations as Record<string, unknown>[]) : [];
  const variations = rawVars
    .filter((v) => typeof v !== "string" && v.id)
    .map((v) => ({
      id: (v.id as string) ?? "",
      variationDescription: (v.variationDescription as string) ?? (v.description as string) ?? "",
    }));
  const variationSuggestions = rawVars
    .filter((v) => typeof v === "string" || !v.id)
    .map((v) => {
      if (typeof v === "string") return { exerciseName: "", variationDescription: v };
      return {
        exerciseName: (v.exerciseName as string) ?? (v.name as string) ?? "",
        variationDescription: (v.variationDescription as string) ?? (v.description as string) ?? "",
      };
    });

  return {
    id: exerciseId,
    name: typeof ex.name === "string" ? ex.name : "",
    categories: Array.isArray(ex.categories) ? (ex.categories as string[]) : [],
    exerciseEffects: Array.isArray(ex.exerciseEffects) ? (ex.exerciseEffects as string[]) : [],
    bodyParts: Array.isArray(ex.bodyParts) ? (ex.bodyParts as string[]) : [],
    equipment: Array.isArray(ex.equipment) ? (ex.equipment as string[]) : [],
    location: Array.isArray(ex.location) ? (ex.location as string[]) : [],
    instructions: Array.isArray(ex.instructions)
      ? (ex.instructions as { stepNumber: number; description: string }[]).map((s, i) => ({
          stepNumber: i + 1,
          description: typeof s.description === "string" ? s.description : "",
        }))
      : [{ stepNumber: 1, description: "" }, { stepNumber: 2, description: "" }],
    performanceMetrics: Array.isArray(ex.performanceMetrics)
      ? (ex.performanceMetrics as { type: string; unit: string | null; notes: string | null }[]).map((m) => ({
          type: m.type ?? "",
          unit: m.unit ?? null,
          notes: m.notes ?? null,
        }))
      : [],
    variations,
    variationSuggestions,
    relationships: Array.isArray(ex.relationships)
      ? (ex.relationships as { type: string; target: { track: string; id: string } }[])
      : [],
    imageURLs: (() => {
      const mc = ex.mediaContent as Record<string, unknown> | undefined;
      return Array.isArray(mc?.imageURLs) ? (mc.imageURLs as string[]) : [];
    })(),
    imageFiles: [],
    commentsNotes: Array.isArray(ex.commentsNotes) ? (ex.commentsNotes as string[]) : [],
  };
}

export default function ReviewEditPage() {
  const params = useParams();
  const exerciseId = decodeURIComponent(params.id as string);

  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<ExerciseFormState>(defaultFormState);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [reviewNotes, setReviewNotes] = useState("");

  /* ── Existing images from community branch ── */
  const [existingImages, setExistingImages] = useState<{ filename: string; url: string }[]>([]);

  /* ── Submit state ── */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /* ── Load from sessionStorage ── */
  useEffect(() => {
    const stored = sessionStorage.getItem("oexdb_review_edit");
    if (!stored) return;
    try {
      const { exercise: ex } = JSON.parse(stored);
      if (!ex) return;
      setForm(hydrateFormFromExercise(exerciseId, ex as Record<string, unknown>));

      // Build existing image list from resolvedImageUrls + mediaContent.imageURLs
      const resolvedUrls: string[] = Array.isArray(ex.resolvedImageUrls) ? ex.resolvedImageUrls : [];
      const mc = ex.mediaContent as Record<string, unknown> | undefined;
      const filenames: string[] = Array.isArray(mc?.imageURLs) ? (mc.imageURLs as string[]) : [];

      const imgs: { filename: string; url: string }[] = [];
      for (let i = 0; i < Math.max(resolvedUrls.length, filenames.length); i++) {
        const url = resolvedUrls[i] ?? "";
        const filename = filenames[i] ?? `image_${i + 1}.png`;
        if (url) imgs.push({ filename, url });
      }
      setExistingImages(imgs);
      setLoaded(true);
    } catch {
      // Invalid data
    }
  }, [exerciseId]);

  /* ── Form update helper (never regenerates ID) ── */
  const onChange = useCallback((patch: Partial<ExerciseFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  /* ── Validation ── */
  const validation = useMemo(() => validate(form), [form]);

  /* ── Save and approve ── */
  const handleSave = useCallback(async () => {
    if (!validation.valid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const exercise = assembleJSON(form);
      // Override the ID to keep the original
      exercise.id = exerciseId;

      // Update mediaContent.imageURLs to reflect kept + new images
      const keptFilenames = existingImages.map((img) => img.filename);
      const newFileNames = form.imageFiles.map((f) => normalizeFilename(f.name));
      (exercise.mediaContent as { imageURLs: string[] }).imageURLs = [...keptFilenames, ...newFileNames];

      // Convert user-uploaded image files to base64
      const fileImages = await Promise.all(
        form.imageFiles.map(async (file) => ({
          filename: normalizeFilename(file.name),
          contentBase64: await fileToBase64(file),
        }))
      );

      const res = await fetch("/api/review/edit-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId,
          exercise,
          reviewNotes: reviewNotes.trim() || undefined,
          images: fileImages.length > 0 ? fileImages : undefined,
          keepImageFilenames: keptFilenames,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
        sessionStorage.removeItem("oexdb_review_edit");
      } else {
        setSubmitError(data.error ?? "Save failed.");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [form, exerciseId, reviewNotes, validation.valid, submitting, existingImages]);

  /* ── No data ── */
  if (!loaded && !success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">No exercise data</h2>
          <p className="text-sm text-gray-600">Please start from the review detail page.</p>
          <Link
            href={`/review/${encodeURIComponent(exerciseId)}`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
          >
            Back to review
          </Link>
        </div>
      </div>
    );
  }

  /* ── Success ── */
  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <svg className="mx-auto h-12 w-12 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-emerald-800">Exercise edited and approved</h2>
          <p className="text-sm text-gray-600">
            <strong>{exerciseId}</strong> has been committed to the main branch and removed from community.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/review/dashboard"
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
            >
              Back to review dashboard
            </Link>
            <Link
              href={`/exercises/${encodeURIComponent(exerciseId)}`}
              className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary transition-colors"
            >
              View exercise
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <PageHeader />

      {/* Breadcrumb */}
      <div className="mx-auto w-full max-w-7xl px-6 pt-6">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/review" className="hover:text-primary transition-colors">Review</Link>
          <span>/</span>
          <Link href={`/review/${encodeURIComponent(exerciseId)}`} className="hover:text-primary transition-colors">
            {form.name || exerciseId}
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-900">Edit and approve</span>
        </nav>
      </div>

      {/* Mobile tabs */}
      <div className="mx-auto w-full max-w-7xl px-6 pt-4 lg:hidden">
        <div className="flex rounded-xl border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setMobileTab("form")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mobileTab === "form" ? "bg-primary text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Form
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mobileTab === "preview" ? "bg-primary text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-6 py-6">
        {/* Left: Form */}
        <div className={`w-full space-y-6 lg:w-3/5 ${mobileTab === "preview" ? "hidden lg:block" : ""}`}>
          {/* Review edit banner */}
          <div className="rounded-xl border border-blue-300 bg-blue-50 p-4 flex items-start gap-3">
            <svg className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-800">Review edit mode</p>
              <p className="mt-0.5 text-xs text-blue-700">
                You are editing <strong>{exerciseId}</strong> for review approval. The exercise ID will not change. Make your edits and click Save and approve below.
              </p>
            </div>
          </div>

          {submitError && (
            <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />
          )}
          <ValidationPanel validation={validation} />

          {/* Identity — ID is read only, shown as fixed */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Identity</h2>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Exercise name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="e.g. Glute Bridge"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700">Exercise ID</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={exerciseId}
                  className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(exerciseId)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  title="Copy ID"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-400">
                This is the original exercise ID from the community branch. It will not change.
              </p>
            </div>
          </section>

          <ClassificationSection form={form} onChange={onChange} />
          <BodyEquipmentSection form={form} onChange={onChange} />
          <InstructionsSection form={form} onChange={onChange} />
          <PerformanceMetricsSection form={form} onChange={onChange} />
          <VariationsSection form={form} onChange={onChange} />

          {/* Existing images from community branch */}
          {existingImages.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Existing images</h2>
                <span className="text-xs font-medium text-gray-500">
                  {existingImages.length} {existingImages.length === 1 ? "image" : "images"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                These images are from the community branch. Remove any you do not want to keep.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {existingImages.map((img, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={img.url}
                      alt={img.filename}
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-end justify-between">
                      <span className="text-xs text-white font-medium truncate max-w-[70%]">{img.filename}</span>
                      <button
                        type="button"
                        onClick={() => setExistingImages((prev) => prev.filter((_, j) => j !== i))}
                        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <MediaSection form={form} onChange={onChange} />
          <NotesSection form={form} onChange={onChange} />

          {/* Review notes */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Review notes</h2>
            <p className="mt-1 text-xs text-gray-500">Optional notes about the changes you made during review.</p>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
              placeholder="Notes about the changes you made"
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </section>
        </div>

        {/* Right: Preview */}
        <aside className={`w-full lg:w-2/5 ${mobileTab === "form" ? "hidden lg:block" : ""}`}>
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

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link
            href={`/review/${encodeURIComponent(exerciseId)}`}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={!validation.valid || submitting}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Save and approve
          </button>
        </div>
      </div>
    </div>
  );
}
