"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
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

const RELATIONSHIP_OPTIONS = [
  { value: "", label: "No specific relationship" },
  { value: "variation", label: "Variation" },
  { value: "progression", label: "Progression" },
  { value: "regression", label: "Regression" },
  { value: "similar", label: "Similar exercise" },
];

function hydrateFormFromTemplate(
  ex: Record<string, unknown>,
  newName: string
): ExerciseFormState {
  const rawVars = Array.isArray(ex.variations)
    ? (ex.variations as Record<string, unknown>[])
    : [];
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
    id: newName.trim() ? generateId(newName) : "",
    name: newName,
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
    relationships: [],
    imageURLs: [],
    imageFiles: [],
    commentsNotes: Array.isArray(ex.commentsNotes) ? (ex.commentsNotes as string[]) : [],
  };
}

export default function FromExistingFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const exerciseId = decodeURIComponent(params.exerciseId as string);
  const track = searchParams.get("track") ?? "";

  /* ── Template state ── */
  const [templateName, setTemplateName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templateTrack, setTemplateTrack] = useState("");
  const [relationship, setRelationship] = useState("");

  /* ── Loading ── */
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  /* ── Form state ── */
  const [form, setForm] = useState<ExerciseFormState>(defaultFormState);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");

  /* ── Submit state ── */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    id: string;
    prUrl: string;
  } | null>(null);

  /* ── Fetch template exercise ── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFetchError(false);
      try {
        const url = `/api/exercises/${encodeURIComponent(exerciseId)}${track ? `?track=${track}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        if (cancelled) return;

        const name = typeof data.name === "string" ? data.name : "";
        setTemplateName(name);
        setTemplateId(data.id ?? exerciseId);
        setTemplateTrack(data.track ?? track);
        setForm(hydrateFormFromTemplate(data, name));
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [exerciseId, track]);

  /* ── Form update helper ── */
  const onChange = useCallback((patch: Partial<ExerciseFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
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

  /* ── Regenerate ID ── */
  const handleRefreshId = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      id: regenerateId(prev.id, prev.name),
    }));
  }, []);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setForm(defaultFormState());
  }, []);

  /* ── Validation ── */
  const validation = useMemo(() => validate(form), [form]);

  /* ── Submit handler ── */
  const handleSubmit = useCallback(async () => {
    if (!validation.valid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const exercise = assembleJSON(form);

      // Add relationship to original exercise if selected
      if (relationship && templateId) {
        const descriptionMap: Record<string, string> = {
          variation: "Derived as a variation from the original exercise",
          progression: "Derived as a progression from the original exercise",
          regression: "Derived as a regression from the original exercise",
          similar: "Created as a similar exercise based on the original",
        };
        const variations = Array.isArray(exercise.variations)
          ? (exercise.variations as Record<string, unknown>[])
          : [];
        variations.push({
          id: templateId,
          variationDescription: descriptionMap[relationship] ?? "Related to the original exercise",
        });
        exercise.variations = variations;
      }

      // Convert uploaded image files to base64
      const fileImages = await Promise.all(
        form.imageFiles.map(async (file) => ({
          filename: normalizeFilename(file.name),
          contentBase64: await fileToBase64(file),
          mimeType: file.type,
          sizeBytes: file.size,
        }))
      );

      const result = await submitExercise({
        exercise,
        images: fileImages,
        source: "form",
      });
      setSubmitResult({ id: result.id, prUrl: result.prUrl });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }, [form, validation.valid, submitting, relationship, templateId]);

  /* ── Loading & error states ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader />
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="flex flex-col items-center gap-4 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
            <p className="text-sm">Loading template exercise...</p>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader />
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Exercise not found</h1>
          <p className="mt-2 text-gray-600">
            The exercise you selected could not be loaded.
          </p>
          <Link
            href="/add/from-existing"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
          >
            Back to exercise selection
          </Link>
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
          <Link href="/add" className="hover:text-primary transition-colors">
            Add exercise
          </Link>
          <span>/</span>
          <Link href="/add/from-existing" className="hover:text-primary transition-colors">
            From existing
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-900">Create new exercise</span>
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
        {/* Left: Form */}
        <div
          className={`w-full space-y-6 lg:w-3/5 ${
            mobileTab === "preview" ? "hidden lg:block" : ""
          }`}
        >
          {/* Template banner */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-primary">
                  Created from template
                </p>
                <p className="mt-0.5 text-xs text-gray-600">
                  This exercise was created from the template:{" "}
                  <span className="font-semibold text-gray-900">{templateName}</span>
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="relationship"
                className="block text-xs font-medium text-gray-700"
              >
                Relationship to original exercise
              </label>
              <select
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
              >
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Images notice */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Images are not copied from the original exercise
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Please upload new images or generate images using AI if needed.
                </p>
              </div>
            </div>
          </div>

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
          <NotesSection form={form} onChange={onChange} />
        </div>

        {/* Right: Preview */}
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
