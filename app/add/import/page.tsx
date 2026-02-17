"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { parseZipFile } from "@/components/zip-import/parseZip";
import type { ParsedExercise, SubmitResult } from "@/components/zip-import/types";

/* ── Step type ── */
type Step = "upload" | "review" | "submit";

/* ── Stepper ── */
function Stepper({ current }: { current: Step }) {
  const steps: { key: Step; label: string; num: number }[] = [
    { key: "upload", label: "Upload zip", num: 1 },
    { key: "review", label: "Review", num: 2 },
    { key: "submit", label: "Submit", num: 3 },
  ];
  const idx = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s.key} className="flex items-center gap-2 sm:gap-3">
            {i > 0 && (
              <div
                className={`hidden sm:block h-px w-8 ${
                  done ? "bg-primary" : "bg-gray-300"
                }`}
              />
            )}
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  active
                    ? "bg-primary text-white"
                    : done
                    ? "bg-primary/20 text-primary"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {done ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  s.num
                )}
              </span>
              <span
                className={`text-sm font-medium ${
                  active ? "text-gray-900" : done ? "text-primary" : "text-gray-500"
                }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: ParsedExercise["status"] }) {
  const map: Record<string, { bg: string; label: string }> = {
    valid: { bg: "bg-emerald-100 text-emerald-800", label: "Valid" },
    invalid: { bg: "bg-red-100 text-red-800", label: "Invalid" },
  };
  const { bg, label } = map[status] ?? map.invalid;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${bg}`}>
      {label}
    </span>
  );
}

/* ── Exercise preview card ── */
function ExercisePreviewCard({ ex }: { ex: ParsedExercise }) {
  const canSubmit = ex.status !== "invalid";

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        ex.status === "invalid"
          ? "border-red-200 bg-red-50/40"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-gray-900 truncate">{ex.name}</h3>
          {ex.originalId && (
            <p className="mt-0.5 text-xs text-gray-500">
              Original ID: <span className="font-mono">{ex.originalId}</span>
            </p>
          )}
        </div>
        <StatusBadge status={ex.status} />
      </div>

      {/* Categories & body parts */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ex.categories.slice(0, 4).map((c) => (
          <span key={c} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {c}
          </span>
        ))}
        {ex.bodyParts.slice(0, 3).map((b) => (
          <span key={b} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {b}
          </span>
        ))}
      </div>

      {/* Instructions preview */}
      {ex.instructions.length > 0 && (
        <div className="mt-3 space-y-1">
          {ex.instructions.slice(0, 2).map((inst, i) => (
            <p key={i} className="text-xs text-gray-600 line-clamp-1">
              <span className="font-semibold text-gray-700">{inst.stepNumber ?? i + 1}.</span>{" "}
              {inst.description}
            </p>
          ))}
          {ex.instructions.length > 2 && (
            <p className="text-xs text-gray-400">+{ex.instructions.length - 2} more steps</p>
          )}
        </div>
      )}

      {/* Image status */}
      <div className="mt-3 rounded-lg bg-gray-50 p-3">
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span>Referenced: <strong>{ex.referencedImages.length}</strong></span>
          <span>Matched: <strong className="text-emerald-700">{ex.matchedImages.length}</strong></span>
          {ex.missingImages.length > 0 && (
            <span>Missing: <strong className="text-red-600">{ex.missingImages.length}</strong></span>
          )}
        </div>

        {/* Thumbnails */}
        {ex.matchedImages.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {ex.matchedImages.slice(0, 5).map((img) => (
              <div
                key={img.filename}
                className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={img.filename}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            {ex.matchedImages.length > 5 && (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-xs font-medium text-gray-500">
                +{ex.matchedImages.length - 5}
              </div>
            )}
          </div>
        )}

        {/* Missing images list */}
        {ex.missingImages.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-red-600">Missing images:</p>
            <ul className="mt-0.5 space-y-0.5">
              {ex.missingImages.map((m) => (
                <li key={m} className="text-xs text-red-500 font-mono truncate">{m}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Validation messages */}
      {ex.messages.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {ex.messages.map((msg, i) => (
            <li key={i} className="text-xs text-red-600">
              {msg}
            </li>
          ))}
        </ul>
      )}

      {/* Submittable indicator */}
      {!canSubmit && (
        <p className="mt-2 text-xs font-medium text-red-600">
          This exercise cannot be submitted
        </p>
      )}
    </div>
  );
}

/* ── Results table ── */
function ResultsTable({ results }: { results: SubmitResult[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Generated ID</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Original ID</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-700">PR</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0">
              <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.generatedId ?? "\u2014"}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.originalId ?? "\u2014"}</td>
              <td className="px-4 py-3">
                {r.status === "success" ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    Success
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800" title={r.error}>
                    Failed
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {r.prUrl ? (
                  <a
                    href={r.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs font-medium"
                  >
                    View PR
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">\u2014</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════════════════════ */

export default function ZipImportPage() {
  const [step, setStep] = useState<Step>("upload");
  const [exercises, setExercises] = useState<ParsedExercise[]>([]);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [zipName, setZipName] = useState<string>("");
  const [parsing, setParsing] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<SubmitResult[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  /* ── Handle file selection ── */
  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setParseErrors(["Please select a .zip file"]);
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setParseErrors(["File exceeds the 30 MB size limit"]);
      return;
    }

    setParsing(true);
    setParseErrors([]);
    setExercises([]);
    setExtraImages([]);
    setZipName(file.name);

    try {
      const result = await parseZipFile(file);
      setExercises(result.exercises);
      setExtraImages(result.extraImages);
      setParseErrors(result.errors);

      if (result.exercises.length > 0) {
        setStep("review");
      }
    } catch {
      setParseErrors(["Failed to parse zip file"]);
    } finally {
      setParsing(false);
    }
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  /* ── Submit ── */
  const submittableExercises = exercises.filter((ex) => ex.status !== "invalid");

  const handleSubmit = useCallback(async () => {
    if (submittableExercises.length === 0) return;
    setSubmitting(true);
    setResults([]);
    setStep("submit");
    setSubmitProgress({ current: 0, total: submittableExercises.length });

    const newResults: SubmitResult[] = [];

    for (let i = 0; i < submittableExercises.length; i++) {
      const ex = submittableExercises[i];
      setSubmitProgress({ current: i + 1, total: submittableExercises.length });

      try {
        // Build payload — strip id from exercise JSON
        const exercisePayload = { ...ex.json };
        delete exercisePayload.id;

        const images = ex.matchedImages.map((img) => ({
          filename: img.filename,
          contentBase64: img.contentBase64,
          mimeType: img.mimeType,
          sizeBytes: img.sizeBytes,
        }));

        const res = await fetch("/api/submit-exercise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exercise: exercisePayload,
            images,
            mode: "zip",
            originalId: ex.originalId ?? undefined,
          }),
        });

        const data = await res.json();

        if (data.ok) {
          newResults.push({
            name: ex.name,
            originalId: ex.originalId,
            generatedId: data.id,
            prUrl: data.prUrl,
            status: "success",
          });
        } else {
          newResults.push({
            name: ex.name,
            originalId: ex.originalId,
            generatedId: null,
            prUrl: null,
            status: "error",
            error: data.error ?? "Unknown error",
          });
        }
      } catch (err) {
        newResults.push({
          name: ex.name,
          originalId: ex.originalId,
          generatedId: null,
          prUrl: null,
          status: "error",
          error: err instanceof Error ? err.message : "Network error",
        });
      }

      setResults([...newResults]);
    }

    setSubmitting(false);
  }, [submittableExercises]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setStep("upload");
    setExercises([]);
    setExtraImages([]);
    setParseErrors([]);
    setZipName("");
    setResults([]);
    setSubmitProgress({ current: 0, total: 0 });
  }, []);

  /* ── Counts ── */
  const validCount = exercises.filter((e) => e.status === "valid").length;
  const invalidCount = exercises.filter((e) => e.status === "invalid").length;

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/add"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Import from Zip
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload a .zip file containing exercise JSON files and images. The system will generate unique IDs for each exercise.
        </p>

        {/* Stepper */}
        <div className="mt-8 mb-8">
          <Stepper current={step} />
        </div>

        {/* ═══ STEP 1: Upload ═══ */}
        {step === "upload" && (
          <div className="space-y-6">
            {/* Drop zone */}
            <div
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 bg-white hover:border-primary/50 hover:bg-gray-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={onFileChange}
                className="hidden"
              />

              {parsing ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm font-medium text-gray-700">Parsing {zipName}...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      Drop your .zip file here or click to browse
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Maximum 30 MB. Must contain at least one JSON exercise file.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Zip structure guide */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900">Expected zip structure</h3>
              <div className="mt-3 rounded-lg bg-gray-50 p-4 font-mono text-xs text-gray-600 leading-relaxed">
                <p>your_exercises.zip</p>
                <p className="ml-4">/exercises/</p>
                <p className="ml-8">glute_bridge.json</p>
                <p className="ml-8">squat.json</p>
                <p className="ml-4">/images/</p>
                <p className="ml-8">glute_bridge/</p>
                <p className="ml-12">image_1.png</p>
                <p className="ml-8">squat/</p>
                <p className="ml-12">image_1.jpg</p>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                JSON files and images can also be placed anywhere in the zip. Images are matched by filename, not folder structure.
              </p>
            </div>

            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <h3 className="text-sm font-bold text-red-800">Issues found</h3>
                <ul className="mt-2 space-y-1">
                  {parseErrors.map((err, i) => (
                    <li key={i} className="text-sm text-red-700">{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2: Review ═══ */}
        {step === "review" && (
          <div className="space-y-6">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  <strong className="text-gray-900">{zipName}</strong> parsed successfully
                </p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-600">
                  <span>{exercises.length} exercise{exercises.length !== 1 ? "s" : ""} found</span>
                  {validCount > 0 && <span className="text-emerald-700">{validCount} valid</span>}
                  {invalidCount > 0 && <span className="text-red-700">{invalidCount} invalid</span>}
                  {extraImages.length > 0 && <span className="text-gray-500">{extraImages.length} unmatched image{extraImages.length !== 1 ? "s" : ""}</span>}
                </div>
              </div>
              <button
                onClick={handleReset}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Upload different file
              </button>
            </div>

            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-xs font-bold text-amber-800">Warnings during parsing</h3>
                <ul className="mt-1 space-y-0.5">
                  {parseErrors.map((err, i) => (
                    <li key={i} className="text-xs text-amber-700">{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Exercise cards */}
            <div className="space-y-4">
              {exercises.map((ex, i) => (
                <ExercisePreviewCard key={i} ex={ex} />
              ))}
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">
                {submittableExercises.length} of {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} ready to submit
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("upload")}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submittableExercises.length === 0}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit {submittableExercises.length} exercise{submittableExercises.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Submit ═══ */}
        {step === "submit" && (
          <div className="space-y-6">
            {/* Progress */}
            {submitting && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="mt-4 text-sm font-semibold text-gray-900">
                  Submitting {submitProgress.current} of {submitProgress.total}
                </p>
                <div className="mx-auto mt-3 h-2 w-64 max-w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${submitProgress.total > 0 ? (submitProgress.current / submitProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <>
                {!submitting && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                    <svg className="mx-auto h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-sm font-semibold text-emerald-800">
                      Submission complete
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      {results.filter((r) => r.status === "success").length} of {results.length} exercise{results.length !== 1 ? "s" : ""} submitted successfully
                    </p>
                  </div>
                )}

                <ResultsTable results={results} />

                {!submitting && (
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={handleReset}
                      className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Upload another zip
                    </button>
                    <Link
                      href="/explore"
                      className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
                    >
                      Explore exercises
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
