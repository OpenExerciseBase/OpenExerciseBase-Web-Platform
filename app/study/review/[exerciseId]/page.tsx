"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ImageGallery from "@/components/exercise-detail/ImageGallery";
import InstructionsSection from "@/components/exercise-detail/InstructionsSection";
import MetricsSection from "@/components/exercise-detail/MetricsSection";
import {
  EffectsSection,
  BodyPartsSection,
  EquipmentSection,
  VariationsSection as VariationsDisplay,
} from "@/components/exercise-detail/SidebarSections";
import RelationshipsSection from "@/components/exercise-detail/RelationshipsSection";
import NotesSection from "@/components/exercise-detail/NotesSection";
import MetadataSection from "@/components/exercise-detail/MetadataSection";

import type { ExerciseFormState } from "@/components/add-form/types";
import {
  validate,
  assembleJSON,
  defaultFormState,
} from "@/components/add-form/helpers";
import ClassificationSection from "@/components/add-form/FormSections/ClassificationSection";
import BodyEquipmentSection from "@/components/add-form/FormSections/BodyEquipmentSection";
import InstructionsSectionForm from "@/components/add-form/FormSections/InstructionsSection";
import PerformanceMetricsSection from "@/components/add-form/FormSections/PerformanceMetricsSection";
import VariationsSectionForm from "@/components/add-form/FormSections/VariationsSection";
import MediaSection from "@/components/add-form/FormSections/MediaSection";
import NotesSectionForm from "@/components/add-form/FormSections/NotesSection";
import ValidationPanel from "@/components/add-form/ValidationPanel";
import PreviewPanel from "@/components/add-form/PreviewPanel";

const RAW_BASE = "https://raw.githubusercontent.com/rania-is/samplejson";
const DRAFT_KEY_PREFIX = "study_draft_";
const COMPLETED_KEY = "study_completed_ids";

/* ── Types ── */

interface Session { loggedIn: boolean; username?: string }

interface Assignment {
  studyId: string;
  title: string;
  description: string;
  reviewers: { githubUsername: string; exerciseIds: string[] }[];
}

interface Progress {
  studyId: string;
  totalAssigned: number;
  completed: number;
  completedExerciseIds: string[];
  lastUpdated: string;
}

interface Ratings {
  q1_overallQuality: number | null;
  q2_instructionClarity: number | null;
  q3_biomechanics: number | null;
  q4_safety: number | null;
  q5_classification: number | null;
  q6_useInPractice: number | null;
  q7_imageQuality: number | null;
}

interface Safety {
  q8_issueTypes: string[];
  q8_otherText: string;
  q9_comment: string;
}

interface Detectability {
  q11_guessAi: boolean | null;
  q12_confidence: number | null;
}

type Decision = "accept" | "edit_accept" | "reject" | null;

interface FormState {
  ratings: Ratings;
  safety: Safety;
  detectability: Detectability;
  decision: Decision;
  editedExercise: Record<string, unknown> | null;
}

const defaultForm: FormState = {
  ratings: {
    q1_overallQuality: null,
    q2_instructionClarity: null,
    q3_biomechanics: null,
    q4_safety: null,
    q5_classification: null,
    q6_useInPractice: null,
    q7_imageQuality: null,
  },
  safety: {
    q8_issueTypes: [],
    q8_otherText: "",
    q9_comment: "",
  },
  detectability: {
    q11_guessAi: null,
    q12_confidence: null,
  },
  decision: null,
  editedExercise: null,
};

/* ── Helpers ── */

function formatSnakeCase(str: string): string {
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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

/* ── Main Component ── */

export default function StudyReviewPage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = decodeURIComponent(params.exerciseId as string);

  const [session, setSession] = useState<Session | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [myExercises, setMyExercises] = useState<string[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [exercise, setExercise] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [unauthorized, setUnauthorized] = useState<string | null>(null);

  /* Edit form state (for edit_accept decision) */
  const [editForm, setEditForm] = useState<ExerciseFormState>(defaultFormState);
  const [editMobileTab, setEditMobileTab] = useState<"form" | "preview">("form");
  const onEditFormChange = useCallback((patch: Partial<ExerciseFormState>) => {
    setEditForm((prev) => ({ ...prev, ...patch }));
  }, []);
  const editValidation = useMemo(() => validate(editForm), [editForm]);

  /* Draft key */
  const draftKey = `${DRAFT_KEY_PREFIX}${exerciseId}`;

  /* Load draft from localStorage */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate old drafts that used the previous safety schema
        if (parsed.safety && !Array.isArray(parsed.safety.q8_issueTypes)) {
          parsed.safety = {
            q8_issueTypes: Array.isArray(parsed.safety.q9_issueTypes) ? parsed.safety.q9_issueTypes : [],
            q8_otherText: parsed.safety.q9_otherText ?? "",
            q9_comment: parsed.safety.q10_comment ?? parsed.safety.q9_comment ?? "",
          };
        }
        // Migrate old rating field names
        if (parsed.ratings && parsed.ratings.q2_appropriateness !== undefined) {
          parsed.ratings = {
            q1_overallQuality: parsed.ratings.q1_overallQuality ?? null,
            q2_instructionClarity: parsed.ratings.q3_clarity ?? null,
            q3_biomechanics: null,
            q4_safety: null,
            q5_classification: parsed.ratings.q2_appropriateness ?? null,
            q6_useInPractice: parsed.ratings.q7_useInPractice ?? null,
            q7_imageQuality: null,
          };
        }
        setForm(parsed);
      }
    } catch { /* ignore */ }
  }, [draftKey]);

  /* Auto save draft */
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(form));
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [form, draftKey]);

  /* Fetch all data */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Session
        const sessRes = await fetch("/api/auth/me");
        const sess: Session = await sessRes.json();
        if (cancelled) return;
        setSession(sess);
        if (!sess.loggedIn) {
          setUnauthorized("Please sign in with GitHub to access this study.");
          setLoading(false);
          return;
        }

        // Assignments
        const assignRes = await fetch(`${RAW_BASE}/main/study/assignments.json`, { cache: "no-store" });
        if (!assignRes.ok) throw new Error("Could not load study assignments.");
        const assignRaw = await assignRes.json();
        if (cancelled) return;

        const reviewers = Array.isArray(assignRaw?.reviewers) ? assignRaw.reviewers : [];
        const assignData: Assignment = {
          studyId: assignRaw?.studyId ?? "",
          title: assignRaw?.title ?? "",
          description: assignRaw?.description ?? "",
          reviewers,
        };
        setAssignment(assignData);

        const reviewer = reviewers.find(
          (r: { githubUsername?: string }) =>
            r.githubUsername?.toLowerCase() === sess.username!.toLowerCase()
        );
        if (!reviewer) {
          setUnauthorized("You are not assigned to this study.");
          setLoading(false);
          return;
        }

        const exerciseIds = Array.isArray(reviewer.assignedExercises)
          ? reviewer.assignedExercises
          : Array.isArray(reviewer.exerciseIds)
            ? reviewer.exerciseIds
            : [];
        if (!exerciseIds.includes(exerciseId)) {
          setUnauthorized("This exercise is not in your assignment list.");
          setLoading(false);
          return;
        }

        setMyExercises(exerciseIds);

        // Progress — merge remote progress with local sessionStorage to avoid stale CDN reads
        let remoteCompleted: string[] = [];
        const progRes = await fetch(
          `${RAW_BASE}/study/results/study/responses/${sess.username}/progress.json`,
          { cache: "no-store" }
        );
        if (progRes.ok) {
          const progData: Progress = await progRes.json();
          remoteCompleted = progData.completedExerciseIds ?? [];
        }

        // sessionStorage holds the most up-to-date completed list within this browser session
        let localCompleted: string[] = [];
        try {
          const stored = sessionStorage.getItem(COMPLETED_KEY);
          if (stored) localCompleted = JSON.parse(stored);
        } catch { /* ignore */ }

        // Merge: union of remote + local
        const mergedCompleted = Array.from(new Set([...remoteCompleted, ...localCompleted]));
        if (!cancelled) {
          setProgress({
            studyId: assignData.studyId,
            totalAssigned: exerciseIds.length,
            completed: mergedCompleted.length,
            completedExerciseIds: mergedCompleted,
            lastUpdated: new Date().toISOString(),
          });
        }

        // Exercise — fetch from the app's own API which handles branch fallback & image resolution
        const exRes = await fetch(`/api/exercises/${encodeURIComponent(exerciseId)}`, { cache: "no-store" });
        if (!exRes.ok) throw new Error("Could not load exercise data.");
        const exData = await exRes.json();
        if (!cancelled) setExercise(exData);

        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setUnauthorized(err instanceof Error ? err.message : "An unexpected error occurred.");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [exerciseId]);

  /* Compute progress */
  const currentIndex = myExercises.indexOf(exerciseId);
  const completedSet = useMemo(() => new Set(progress?.completedExerciseIds ?? []), [progress]);
  const completedCount = completedSet.size;
  const totalCount = myExercises.length;

  /* Validation */
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const r = form.ratings;
    if (r.q1_overallQuality === null) errors.push("Q1: Overall quality is required.");
    if (r.q2_instructionClarity === null) errors.push("Q2: Instruction clarity rating is required.");
    if (r.q3_biomechanics === null) errors.push("Q3: Biomechanics rating is required.");
    if (r.q4_safety === null) errors.push("Q4: Safety rating is required.");
    if (r.q5_classification === null) errors.push("Q5: Classification rating is required.");
    if (r.q6_useInPractice === null) errors.push("Q6: Use in practice rating is required.");
    if (r.q7_imageQuality === null) errors.push("Q7: Image quality rating is required.");
    if (form.detectability.q11_guessAi === null) errors.push("Q11: Origin guess is required.");
    if (form.detectability.q12_confidence === null) errors.push("Q12: Confidence rating is required.");
    if (form.decision === null) errors.push("Decision: Please select an outcome.");
    return errors;
  }, [form]);

  const isValid = validationErrors.length === 0;

  /* Submit */
  const handleSubmit = useCallback(async () => {
    setShowValidation(true);
    if (!isValid || !session?.username || !assignment) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const newCompleted = [...(progress?.completedExerciseIds ?? [])];
      if (!newCompleted.includes(exerciseId)) newCompleted.push(exerciseId);

      const responsePayload = {
        studyId: assignment.studyId,
        reviewer: session.username,
        exerciseId,
        submittedAt: new Date().toISOString(),
        ratings: {
          q1_overallQuality: form.ratings.q1_overallQuality,
          q2_instructionClarity: form.ratings.q2_instructionClarity,
          q3_biomechanics: form.ratings.q3_biomechanics,
          q4_safety: form.ratings.q4_safety,
          q5_classification: form.ratings.q5_classification,
          q6_useInPractice: form.ratings.q6_useInPractice,
          q7_imageQuality: form.ratings.q7_imageQuality,
        },
        safety: {
          q8_issueTypes: form.safety.q8_issueTypes,
          q8_otherText: form.safety.q8_otherText || null,
          q9_comment: form.safety.q9_comment,
        },
        detectability: {
          q11_guessAi: form.detectability.q11_guessAi,
          q12_confidence: form.detectability.q12_confidence,
        },
        decision: form.decision,
        editedExercise: form.decision === "edit_accept" ? assembleJSON(editForm) : null,
      };

      const progressPayload = {
        studyId: assignment.studyId,
        totalAssigned: myExercises.length,
        completed: newCompleted.length,
        completedExerciseIds: newCompleted,
        lastUpdated: new Date().toISOString(),
      };

      const res = await fetch("/api/study/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responsePayload, progress: progressPayload }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save response.");
      }

      // Clear draft & persist completed list to sessionStorage
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      try { sessionStorage.setItem(COMPLETED_KEY, JSON.stringify(newCompleted)); } catch { /* ignore */ }

      // Navigate to next or complete
      const nextIndex = myExercises.findIndex((id) => !newCompleted.includes(id));
      if (nextIndex === -1) {
        router.push("/study/complete");
      } else {
        router.push(`/study/review/${encodeURIComponent(myExercises[nextIndex])}`);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }, [isValid, session, assignment, exerciseId, form, editForm, progress, myExercises, draftKey, router]);

  /* Save draft button */
  const handleSaveDraft = useCallback(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(form));
      alert("Draft saved locally.");
    } catch { /* ignore */ }
  }, [form, draftKey]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader />
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-3 w-full rounded bg-gray-200" />
            <div className="h-8 w-64 rounded bg-gray-200" />
            <div className="h-4 w-96 rounded bg-gray-200" />
            <div className="h-64 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Unauthorized ── */
  if (unauthorized) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader />
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl border border-gray-200 bg-white px-8 py-12 text-center shadow-sm">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <h1 className="mt-6 text-xl font-bold text-gray-900">Access Denied</h1>
            <p className="mt-3 text-sm text-gray-500">{unauthorized}</p>
            {!session?.loggedIn ? (
              <a
                href="/api/auth/github"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
              >
                Sign in with GitHub
              </a>
            ) : (
              <Link
                href="/study"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
              >
                Back to Study
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!exercise) return null;

  /* ── Extract exercise fields (same shape as explore detail page) ── */
  const exData = {
    name: (exercise.name as string) ?? "Untitled",
    categories: (exercise.categories as string[]) ?? [],
    bodyParts: (exercise.bodyParts as string[]) ?? [],
    equipment: (exercise.equipment as string[]) ?? [],
    location: (exercise.location as string[]) ?? [],
    exerciseEffects: (exercise.exerciseEffects as string[]) ?? [],
    instructions: (exercise.instructions as { stepNumber: number; description: string }[]) ?? [],
    performanceMetrics: (exercise.performanceMetrics as { type: string; unit: string; notes: string }[]) ?? [],
    variations: (exercise.variations as (string | { id?: string; variationDescription?: string; level?: string; description?: string })[]) ?? [],
    relationships: (exercise.relationships as { type: string; target: { track: string; id: string } }[]) ?? undefined,
    relationshipSuggestions: (exercise.relationshipSuggestions as { type: string; targetName: string; note: string }[]) ?? undefined,
    commentsNotes: (Array.isArray(exercise.commentsNotes) ? exercise.commentsNotes : typeof exercise.commentsNotes === "string" ? [exercise.commentsNotes] : []) as string[],
    metadata: (exercise.metadata as Record<string, unknown>) ?? {},
    resolvedImageUrls: Array.isArray(exercise.resolvedImageUrls) && (exercise.resolvedImageUrls as string[]).length > 0
      ? (exercise.resolvedImageUrls as string[])
      : (() => {
          const mc = exercise.mediaContent as Record<string, unknown> | undefined;
          const urls = Array.isArray(mc?.imageURLs) ? (mc.imageURLs as string[]) : [];
          return urls.map((f) => `${RAW_BASE}/main/images/${exerciseId}/${f}`);
        })(),
    track: (exercise.track as string) ?? "validated",
  };

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      {/* Sticky progress bar */}
      <div className="sticky top-[57px] z-40 border-b border-gray-200/60 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 py-2.5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Exercise {currentIndex + 1} of {totalCount}
            </span>
            <span className="font-medium text-gray-700">
              Completed {completedCount} of {totalCount}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* ── Left sidebar: progress nav ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-[110px] space-y-1">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Exercises
              </h3>
              {myExercises.map((id, idx) => {
                const done = completedSet.has(id);
                const current = id === exerciseId;
                return (
                  <Link
                    key={id}
                    href={`/study/review/${encodeURIComponent(id)}`}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      current
                        ? "bg-primary/10 text-primary font-semibold"
                        : done
                          ? "text-gray-400"
                          : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        done
                          ? "bg-green-100 text-green-600"
                          : current
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {done ? "✓" : idx + 1}
                    </span>
                    Exercise {idx + 1}
                  </Link>
                );
              })}
              <div className="mt-4 border-t border-gray-200 pt-4">
                <Link href="/study" className="text-xs text-gray-500 hover:text-primary transition-colors">
                  ← Back to study home
                </Link>
              </div>
            </div>
          </aside>

          {/* ── Main column ── */}
          <div className="min-w-0 space-y-8">
            {/* Title area */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Expert Exercise Review Study
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Please evaluate the exercise entry below using the questionnaire. Your responses are saved when you submit.
              </p>
            </div>

            {/* ── Exercise display (same layout as explore detail page) ── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              {/* Title & badges */}
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">{exData.name}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {exData.categories.map((c) => (
                  <span key={c} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {formatSnakeCase(c)}
                  </span>
                ))}
              </div>

              {/* Quick summary */}
              <div className="mt-4 mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                <SummaryItem label="Equipment" value={exData.equipment.length > 0 ? exData.equipment.join(", ") : "No equipment"} />
                <SummaryItem label="Location" value={exData.location.length > 0 ? exData.location.join(", ") : "Not specified"} />
                <SummaryItem label="Targets" value={exData.bodyParts.join(", ") || "None"} />
              </div>

              {/* Image gallery */}
              <div className="mb-8">
                <ImageGallery images={exData.resolvedImageUrls} exerciseName={exData.name} />
              </div>

              {/* Two column layout */}
              <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
                {/* Left column */}
                <div className="space-y-10">
                  <InstructionsSection instructions={exData.instructions} />
                  <MetricsSection metrics={exData.performanceMetrics} />
                </div>
                {/* Right column */}
                <div className="space-y-8">
                  <EffectsSection effects={exData.exerciseEffects} />
                  <BodyPartsSection bodyParts={exData.bodyParts} />
                  <EquipmentSection equipment={exData.equipment} />
                  <VariationsDisplay variations={exData.variations} currentTrack={exData.track} />
                </div>
              </div>

              {/* Relationships */}
              <div className="mt-8">
                <RelationshipsSection
                  relationships={exData.relationships}
                  relationshipSuggestions={exData.relationshipSuggestions}
                />
              </div>

              {/* Notes */}
              <div className="mt-8">
                <NotesSection notes={exData.commentsNotes} />
              </div>

              {/* Metadata */}
              <div className="mt-8">
                <MetadataSection metadata={exData.metadata as any} />
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* ── QUESTIONNAIRE ── */}
            {/* ══════════════════════════════════════════════════════════════════ */}

            {/* Section A */}
            <SectionCard
              title="Section A: Core Quality Ratings"
              intro="Scale: 1 = Strongly disagree, 7 = Strongly agree"
            >
              <LikertQuestion
                id="q1"
                label="How would you rate the overall quality of this exercise entry"
                lowLabel="Very low"
                highLabel="Very high"
                value={form.ratings.q1_overallQuality}
                onChange={(v) => setForm((f) => ({ ...f, ratings: { ...f.ratings, q1_overallQuality: v } }))}
                showError={showValidation && form.ratings.q1_overallQuality === null}
              />
              <LikertQuestion
                id="q2"
                label="The instructions are clear and unambiguous"
                lowLabel="Strongly disagree"
                highLabel="Strongly agree"
                value={form.ratings.q2_instructionClarity}
                onChange={(v) => setForm((f) => ({ ...f, ratings: { ...f.ratings, q2_instructionClarity: v } }))}
                showError={showValidation && form.ratings.q2_instructionClarity === null}
              />
              <LikertQuestion
                id="q3"
                label="The movement described is biomechanically sound"
                lowLabel="Strongly disagree"
                highLabel="Strongly agree"
                value={form.ratings.q3_biomechanics}
                onChange={(v) => setForm((f) => ({ ...f, ratings: { ...f.ratings, q3_biomechanics: v } }))}
                showError={showValidation && form.ratings.q3_biomechanics === null}
              />
              <LikertQuestion
                id="q4"
                label="The exercise can be performed safely as described"
                lowLabel="Strongly disagree"
                highLabel="Strongly agree"
                value={form.ratings.q4_safety}
                onChange={(v) => setForm((f) => ({ ...f, ratings: { ...f.ratings, q4_safety: v } }))}
                showError={showValidation && form.ratings.q4_safety === null}
              />
              <LikertQuestion
                id="q5"
                label="The classification (target muscles, equipment, category, and performance metrics) accurately reflects the exercise"
                lowLabel="Strongly disagree"
                highLabel="Strongly agree"
                value={form.ratings.q5_classification}
                onChange={(v) => setForm((f) => ({ ...f, ratings: { ...f.ratings, q5_classification: v } }))}
                showError={showValidation && form.ratings.q5_classification === null}
              />
              <LikertQuestion
                id="q6"
                label="I would consider using or recommending this exercise after normal professional review"
                lowLabel="Strongly disagree"
                highLabel="Strongly agree"
                value={form.ratings.q6_useInPractice}
                onChange={(v) => setForm((f) => ({ ...f, ratings: { ...f.ratings, q6_useInPractice: v } }))}
                showError={showValidation && form.ratings.q6_useInPractice === null}
              />
              <LikertQuestion
                id="q7"
                label="The image is accurate, clear, and consistent with the written instructions"
                lowLabel="Strongly disagree"
                highLabel="Strongly agree"
                value={form.ratings.q7_imageQuality}
                onChange={(v) => setForm((f) => ({ ...f, ratings: { ...f.ratings, q7_imageQuality: v } }))}
                showError={showValidation && form.ratings.q7_imageQuality === null}
              />
            </SectionCard>

            {/* Section B */}
            <SectionCard
              title="Section B: AI Detectability and Bias"
              intro="This section asks whether you believe the entry was generated by an AI system. There are no right or wrong answers."
            >
              {/* Q11 */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-800">
                  Do you believe this exercise entry was generated by AI
                </p>
                <div className="flex gap-4">
                  {(["Yes", "No"] as const).map((opt) => {
                    const val = opt === "Yes";
                    const selected = form.detectability.q11_guessAi === val;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, detectability: { ...f.detectability, q11_guessAi: val } }))
                        }
                        className={`rounded-lg border px-5 py-2 text-sm font-medium transition-colors ${
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {showValidation && form.detectability.q11_guessAi === null && (
                  <p className="text-xs text-red-500">This question is required.</p>
                )}
              </div>

              {/* Q12 */}
              <LikertQuestion
                id="q12"
                label="How confident are you in your answer"
                lowLabel="Not confident"
                highLabel="Very confident"
                value={form.detectability.q12_confidence}
                onChange={(v) => setForm((f) => ({ ...f, detectability: { ...f.detectability, q12_confidence: v } }))}
                showError={showValidation && form.detectability.q12_confidence === null}
              />
            </SectionCard>

            {/* Final decision */}
            <SectionCard
              title="Final Decision"
              intro="Please choose the outcome you would apply after reviewing this entry."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <DecisionButton
                  label="Accept"
                  description="Accept the exercise entry as is for the purpose of this study."
                  selected={form.decision === "accept"}
                  onClick={() => setForm((f) => ({ ...f, decision: "accept", editedExercise: null }))}
                  color="green"
                />
                <DecisionButton
                  label="Edit and accept"
                  description="Make edits to the entry, then accept the edited version for the purpose of this study."
                  selected={form.decision === "edit_accept"}
                  onClick={() => {
                    setForm((f) => ({ ...f, decision: "edit_accept", editedExercise: f.editedExercise ?? { ...exercise } }));
                    // Hydrate the edit form from the exercise data if not already done
                    if (editForm.id !== exerciseId && exercise) {
                      setEditForm(hydrateFormFromExercise(exerciseId, exercise));
                    }
                  }}
                  color="amber"
                />
                <DecisionButton
                  label="Reject"
                  description="Reject the entry for the purpose of this study."
                  selected={form.decision === "reject"}
                  onClick={() => setForm((f) => ({ ...f, decision: "reject", editedExercise: null }))}
                  color="red"
                />
              </div>
              {showValidation && form.decision === null && (
                <p className="mt-2 text-xs text-red-500">Please select a decision.</p>
              )}

              {/* Inline editor for edit_accept (same form as review edit page) */}
              {form.decision === "edit_accept" && (
                <div className="mt-6 space-y-6">
                  {/* Edit mode banner */}
                  <div className="rounded-xl border border-blue-300 bg-blue-50 p-4 flex items-start gap-3">
                    <svg className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Edit mode</p>
                      <p className="mt-0.5 text-xs text-blue-700">
                        Make your edits below. The edited exercise will be saved with your study response. The exercise ID will not change.
                      </p>
                    </div>
                  </div>

                  {/* Mobile tabs for form/preview */}
                  <div className="lg:hidden">
                    <div className="flex rounded-xl border border-gray-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setEditMobileTab("form")}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          editMobileTab === "form" ? "bg-primary text-white" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Form
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMobileTab("preview")}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          editMobileTab === "preview" ? "bg-primary text-white" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-8">
                    {/* Left: Form sections */}
                    <div className={`w-full space-y-6 lg:w-3/5 ${editMobileTab === "preview" ? "hidden lg:block" : ""}`}>
                      <ValidationPanel validation={editValidation} />

                      {/* Identity (read-only ID) */}
                      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900">Identity</h2>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Exercise name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => onEditFormChange({ name: e.target.value })}
                            placeholder="e.g. Glute Bridge"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                          />
                        </div>
                        <div className="mt-5">
                          <label className="block text-sm font-medium text-gray-700">Exercise ID</label>
                          <input
                            type="text"
                            readOnly
                            value={exerciseId}
                            className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none font-mono text-xs"
                          />
                          <p className="mt-1.5 text-xs text-gray-400">
                            This is the original exercise ID. It will not change.
                          </p>
                        </div>
                      </section>

                      <ClassificationSection form={editForm} onChange={onEditFormChange} />
                      <BodyEquipmentSection form={editForm} onChange={onEditFormChange} />
                      <InstructionsSectionForm form={editForm} onChange={onEditFormChange} />
                      <PerformanceMetricsSection form={editForm} onChange={onEditFormChange} />
                      <VariationsSectionForm form={editForm} onChange={onEditFormChange} />
                      <MediaSection form={editForm} onChange={onEditFormChange} />
                      <NotesSectionForm form={editForm} onChange={onEditFormChange} />
                    </div>

                    {/* Right: Preview */}
                    <aside className={`w-full lg:w-2/5 ${editMobileTab === "form" ? "hidden lg:block" : ""}`}>
                      <div className="sticky top-[110px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Live preview
                          </span>
                        </div>
                        <PreviewPanel form={editForm} />
                      </div>
                    </aside>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Validation summary */}
            {showValidation && !isValid && (
              <div className="rounded-xl border border-red-200 bg-red-50/60 px-6 py-4">
                <h4 className="text-sm font-semibold text-red-900">Please complete all required fields</h4>
                <ul className="mt-2 space-y-1">
                  {validationErrors.map((err, i) => (
                    <li key={i} className="text-xs text-red-700">• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit error */}
            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50/60 px-6 py-4">
                <p className="text-sm font-medium text-red-900">{submitError}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6 pb-8">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit and continue"
                )}
              </button>
              <button
                onClick={handleSaveDraft}
                className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-400 transition-colors"
              >
                Save draft locally
              </button>
            </div>

            {/* Mobile nav */}
            <div className="lg:hidden border-t border-gray-200 pt-4 pb-8">
              <Link href="/study" className="text-sm text-gray-500 hover:text-primary transition-colors">
                ← Back to study home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */
/* ── Sub components ── */
/* ══════════════════════════════════════════════════════════════════════════════ */

const ISSUE_TYPES = [
  "Biomechanically or technically incorrect",
  "Unsafe instruction or missing critical safety cue",
  "Vague, generic, or template like phrasing",
  "Incorrect classification (body part, equipment, category, or metric)",
  "Internal inconsistency (e.g., the steps contradict the listed equipment)",
  "Missing essential information",
  "Inappropriate variation listed",
  "Fabricated or implausible content",
  "Image shows incorrect form or wrong movement phase",
  "Image contains anatomical errors or visual artifacts",
  "Image does not match the written instructions",
  "Other",
];

function SectionCard({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-1.5 text-sm text-gray-500">{intro}</p>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}

function LikertQuestion({
  id,
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
  showError,
}: {
  id: string;
  label: string;
  lowLabel: string;
  highLabel: string;
  value: number | null;
  onChange: (v: number) => void;
  showError: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      <div className="flex flex-wrap items-end gap-1">
        <span className="mr-1 text-[11px] text-gray-400 w-20 text-right shrink-0 hidden sm:block">
          {lowLabel}
        </span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                value === n
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
              aria-label={`${id} rating ${n}`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="ml-1 text-[11px] text-gray-400 w-20 shrink-0 hidden sm:block">
          {highLabel}
        </span>
      </div>
      {/* Mobile labels */}
      <div className="flex justify-between text-[10px] text-gray-400 sm:hidden px-0.5">
        <span>1 = {lowLabel}</span>
        <span>7 = {highLabel}</span>
      </div>
      {showError && <p className="text-xs text-red-500">This question is required.</p>}
    </div>
  );
}

function DecisionButton({
  label,
  description,
  selected,
  onClick,
  color,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  color: "green" | "amber" | "red";
}) {
  const colorMap = {
    green: selected
      ? "border-green-500 bg-green-50 ring-1 ring-green-500"
      : "border-gray-200 hover:border-green-300",
    amber: selected
      ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
      : "border-gray-200 hover:border-amber-300",
    red: selected
      ? "border-red-500 bg-red-50 ring-1 ring-red-500"
      : "border-gray-200 hover:border-red-300",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-all ${colorMap[color]}`}
    >
      <span className="text-sm font-semibold text-gray-900">{label}</span>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </button>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-semibold text-gray-800">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
