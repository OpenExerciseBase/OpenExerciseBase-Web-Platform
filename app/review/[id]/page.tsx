"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { useParams } from "next/navigation";

/* ── Types ── */

interface ExerciseData {
  id: string;
  name: string;
  track: "validated" | "community";
  branch: string;
  fileNumber: string;
  categories: string[];
  exerciseEffects: string[];
  bodyParts: string[];
  equipment: string[];
  location: string[];
  instructions: { stepNumber: number; description: string }[];
  performanceMetrics: { type: string; unit: string; notes: string }[];
  variations: (string | { id?: string; variationDescription?: string; level?: string; description?: string })[];
  relationships?: {
    type: string;
    target?: { track: string; id: string };
    targetName?: string;
    note?: string;
  }[];
  mediaContent: { imageURLs: string[] };
  metadata: {
    createdBy?: string;
    reviewStatus?: string;
    reviewedBy?: string[];
    dateReviewed?: string | null;
    reviewNotes?: string;
    dateCreated?: string;
    lastUpdated?: string;
    lastEditedBy?: string;
    dedupStatus?: string;
    duplicateOf?: { track?: string; id?: string } | string | null;
  };
  commentsNotes: string[];
  resolvedImageUrls: string[];
  githubUrl: string;
}

interface AuthState {
  loggedIn: boolean;
  username?: string;
  verified?: boolean;
}

function formatSnakeCase(str: string): string {
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Page ── */

export default function ReviewDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);

  const [auth, setAuth] = useState<AuthState | null>(null);
  const [data, setData] = useState<ExerciseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Action state
  const [activeAction, setActiveAction] = useState<"approve" | "reject" | "duplicate" | "edit" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [canonicalId, setCanonicalId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  /* ── Auth check ── */

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const d = await res.json();
        setAuth(d);
      } catch {
        setAuth({ loggedIn: false });
      }
    }
    checkAuth();
  }, []);

  /* ── Load exercise ── */

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const url = `/api/exercises/${encodeURIComponent(id)}?track=community`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  /* ── Action handlers ── */

  const handleApprove = useCallback(async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/review/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: id, reviewNotes: reviewNotes.trim() || undefined }),
      });
      const d = await res.json();
      if (d.ok) {
        setActionSuccess("Exercise approved and committed to main branch.");
        setActiveAction(null);
      } else {
        setActionError(d.error ?? "Approval failed.");
      }
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }, [id, reviewNotes]);

  const handleReject = useCallback(async () => {
    if (!reviewNotes.trim()) {
      setActionError("Review notes are required for rejection.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/review/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: id, reviewNotes: reviewNotes.trim() }),
      });
      const d = await res.json();
      if (d.ok) {
        setActionSuccess("Exercise rejected. Metadata updated on community branch.");
        setActiveAction(null);
      } else {
        setActionError(d.error ?? "Rejection failed.");
      }
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }, [id, reviewNotes]);

  const handleDuplicate = useCallback(async () => {
    if (!canonicalId.trim()) {
      setActionError("Canonical exercise ID is required.");
      return;
    }
    if (!canonicalId.startsWith("EX")) {
      setActionError("Canonical ID must start with EX.");
      return;
    }
    if (canonicalId === id) {
      setActionError("Canonical ID must not equal the current exercise ID.");
      return;
    }
    if (!reviewNotes.trim()) {
      setActionError("Review notes are required when marking as duplicate.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/review/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: id,
          canonicalId: canonicalId.trim(),
          reviewNotes: reviewNotes.trim(),
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setActionSuccess("Exercise marked as duplicate on community branch.");
        setActiveAction(null);
      } else {
        setActionError(d.error ?? "Action failed.");
      }
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }, [id, canonicalId, reviewNotes]);

  const handleEditApprove = useCallback(() => {
    // Store exercise data in sessionStorage and navigate to edit page
    if (!data) return;
    sessionStorage.setItem(
      "oexdb_review_edit",
      JSON.stringify({ exerciseId: id, exercise: data })
    );
    window.location.href = `/review/${encodeURIComponent(id)}/edit`;
  }, [id, data]);

  /* ── Render helpers ── */

  if (loading || auth === null) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-48 rounded bg-gray-200" />
            <div className="h-10 w-96 rounded bg-gray-200" />
            <div className="h-64 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!auth.loggedIn) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Login required</h2>
          <p className="text-sm text-gray-600">You must be logged in to review exercises.</p>
          <a
            href={`/api/auth/github?returnTo=/review/${encodeURIComponent(id)}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Login with GitHub
          </a>
        </div>
      </div>
    );
  }

  if (!auth.verified) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">You are not a verified reviewer</h2>
          <p className="text-sm text-gray-600">
            Logged in as <strong>{auth.username}</strong>.
          </p>
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
          >
            Become a verified professional
          </Link>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Exercise not found</h2>
          <p className="text-sm text-gray-600">This exercise could not be loaded from the community branch.</p>
          <Link
            href="/review/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
          >
            Back to review dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/review" className="hover:text-primary transition-colors">Review</Link>
          <span>/</span>
          <span className="font-medium text-gray-900">{data.name}</span>
        </nav>

        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {data.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Community
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {data.id}
          </span>
        </div>

        {/* Quick summary */}
        <div className="mt-6 mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
          <SummaryItem label="Categories" value={data.categories.map(formatSnakeCase).join(", ") || "None"} />
          <SummaryItem label="Equipment" value={data.equipment.length > 0 ? data.equipment.map(formatSnakeCase).join(", ") : "No equipment"} />
          <SummaryItem label="Location" value={data.location.length > 0 ? data.location.map(formatSnakeCase).join(", ") : "Not specified"} />
          <SummaryItem label="Targets" value={data.bodyParts.map(formatSnakeCase).join(", ") || "None"} />
        </div>

        {/* Images */}
        {data.resolvedImageUrls.length > 0 && (
          <div className="mb-10 grid gap-3 sm:grid-cols-2">
            {data.resolvedImageUrls.map((url, i) => (
              <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 border border-gray-200">
                <img src={url} alt={`${data.name} image ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {data.instructions && data.instructions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
            <ol className="space-y-3">
              {data.instructions.map((step) => (
                <li key={step.stepNumber} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {step.stepNumber}
                  </span>
                  <p className="text-sm text-gray-700 pt-0.5">{step.description}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Performance metrics */}
        {data.performanceMetrics && data.performanceMetrics.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance metrics</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.performanceMetrics.map((m, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-sm font-medium text-gray-900">{formatSnakeCase(m.type)}</p>
                  <p className="text-xs text-gray-500">Unit: {m.unit}</p>
                  {m.notes && <p className="mt-1 text-xs text-gray-600">{m.notes}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Variations */}
        {data.variations && data.variations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Variations</h2>
            <ul className="space-y-2">
              {data.variations.map((v, i) => (
                <li key={i} className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700">
                  {typeof v === "string" ? v : v.variationDescription ?? v.description ?? JSON.stringify(v)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Effects */}
        {data.exerciseEffects && data.exerciseEffects.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Effects</h2>
            <div className="flex flex-wrap gap-2">
              {data.exerciseEffects.map((e) => (
                <span key={e} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {formatSnakeCase(e)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Relationships */}
        {data.relationships && data.relationships.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Relationships</h2>
            <ul className="space-y-2">
              {data.relationships.map((r, i) => (
                <li key={i} className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700">
                  <span className="font-medium">{formatSnakeCase(r.type)}</span>:{" "}
                  {r.target ? `${r.target.id} (${r.target.track})` : `${r.targetName ?? ""} (suggestion)`}
                  {r.note ? ` - ${r.note}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Notes */}
        {data.commentsNotes && data.commentsNotes.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Notes</h2>
            <ul className="space-y-2">
              {data.commentsNotes.map((n, i) => (
                <li key={i} className="text-sm text-gray-700">{n}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Metadata */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Metadata</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-4 grid gap-2 sm:grid-cols-2 text-sm">
            {data.metadata.createdBy && (
              <MetaRow label="Created by" value={data.metadata.createdBy} />
            )}
            {data.metadata.reviewStatus && (
              <MetaRow label="Review status" value={formatSnakeCase(data.metadata.reviewStatus)} />
            )}
            {data.metadata.dateCreated && (
              <MetaRow label="Date created" value={data.metadata.dateCreated} />
            )}
            {data.metadata.lastUpdated && (
              <MetaRow label="Last updated" value={data.metadata.lastUpdated} />
            )}
            {data.metadata.lastEditedBy && (
              <MetaRow label="Last edited by" value={data.metadata.lastEditedBy} />
            )}
            {data.metadata.dedupStatus && (
              <MetaRow label="Dedup status" value={formatSnakeCase(data.metadata.dedupStatus)} />
            )}
          </div>
        </section>

        {/* ═══ SUCCESS ═══ */}
        {actionSuccess && (
          <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
            <svg className="mx-auto h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-emerald-800">{actionSuccess}</p>
            <Link
              href="/review/dashboard"
              className="inline-block mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
            >
              Back to review dashboard
            </Link>
          </div>
        )}

        {/* ═══ REVIEW PANEL ═══ */}
        {!actionSuccess && (
          <section className="rounded-2xl border-2 border-primary/20 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Review panel</h2>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800">
                All review decisions are recorded publicly in the repository. Please follow the{" "}
                <Link href="/review-guidelines" className="underline font-medium">reviewer guidelines</Link>{" "}
                and ensure your assessment is objective and evidence based.
              </p>
            </div>

            {/* Action buttons */}
            {!activeAction && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { setActiveAction("approve"); setReviewNotes(""); setActionError(null); }}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={handleEditApprove}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  Edit and approve
                </button>
                <button
                  onClick={() => { setActiveAction("duplicate"); setReviewNotes(""); setCanonicalId(""); setActionError(null); }}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
                >
                  Mark as duplicate
                </button>
                <button
                  onClick={() => { setActiveAction("reject"); setReviewNotes(""); setActionError(null); }}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </div>
            )}

            {/* ── APPROVE FORM ── */}
            {activeAction === "approve" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Approve exercise</h3>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional review notes"
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                />
                {actionError && <p className="text-sm text-red-600">{actionError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                    Confirm approval
                  </button>
                  <button
                    onClick={() => setActiveAction(null)}
                    disabled={actionLoading}
                    className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── REJECT FORM ── */}
            {activeAction === "reject" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Reject exercise</h3>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Review notes (required)"
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                />
                {actionError && <p className="text-sm text-red-600">{actionError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !reviewNotes.trim()}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                    Confirm rejection
                  </button>
                  <button
                    onClick={() => setActiveAction(null)}
                    disabled={actionLoading}
                    className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── DUPLICATE FORM ── */}
            {activeAction === "duplicate" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Mark as duplicate</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Canonical exercise ID</label>
                  <input
                    type="text"
                    value={canonicalId}
                    onChange={(e) => setCanonicalId(e.target.value)}
                    placeholder="EX-exercise_name-01ABC..."
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Review notes (required)"
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                />
                {actionError && <p className="text-sm text-red-600">{actionError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleDuplicate}
                    disabled={actionLoading || !canonicalId.trim() || !reviewNotes.trim()}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                    Confirm duplicate
                  </button>
                  <button
                    onClick={() => setActiveAction(null)}
                    disabled={actionLoading}
                    className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Footer */}
        <div className="mt-8 flex flex-wrap gap-3 border-t border-gray-200 pt-8 pb-4">
          <Link
            href="/review/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:border-primary hover:text-primary transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to review dashboard
          </Link>
          <a
            href={data.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
          >
            View JSON on GitHub
          </a>
        </div>
      </main>
    </div>
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}
