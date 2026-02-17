"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import PageHeader from "@/components/PageHeader";

/* ── Types ── */

interface ReviewExercise {
  id: string;
  name: string;
  categories: string[];
  bodyParts: string[];
  equipment: string[];
  location: string[];
  imageUrl: string | null;
  reviewStatus: string;
}

interface AuthState {
  loggedIn: boolean;
  username?: string;
  verified?: boolean;
}

/* ── Filter options (same as explore) ── */

const CATEGORY_OPTIONS = [
  "strength", "cardio", "flexibility", "balance", "plyometrics",
  "rehabilitation", "functional", "isometric", "sport_specific",
];

const BODY_PART_OPTIONS = [
  "chest", "back", "shoulders", "biceps", "triceps", "forearms",
  "core", "quadriceps", "hamstrings", "glutes", "calves", "hip_flexors",
  "adductors", "abductors", "neck", "full_body",
];

const EQUIPMENT_OPTIONS = [
  "none", "barbell", "dumbbell", "kettlebell", "resistance_band",
  "cable_machine", "pull_up_bar", "bench", "stability_ball",
  "foam_roller", "medicine_ball", "trx", "bodyweight",
];

const LOCATION_OPTIONS = [
  "gym", "home", "outdoor", "pool", "studio",
];

function formatSnakeCase(str: string): string {
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ── Page ── */

export default function ReviewDashboardPage() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [exercises, setExercises] = useState<ReviewExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [bodyPartFilter, setBodyPartFilter] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  /* ── Auth check ── */

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setAuth(data);
      } catch {
        setAuth({ loggedIn: false });
      }
    }
    checkAuth();
  }, []);

  /* ── Load exercises ── */

  const loadExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/review/exercises");
      const data = await res.json();
      if (data.ok) {
        setExercises(data.exercises);
      } else {
        setError(data.error ?? "Failed to load exercises.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth?.loggedIn && auth?.verified) {
      loadExercises();
    } else {
      setLoading(false);
    }
  }, [auth, loadExercises]);

  /* ── Filtered exercises ── */

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !ex.name.toLowerCase().includes(q) &&
          !ex.id.toLowerCase().includes(q)
        )
          return false;
      }
      if (categoryFilter && !ex.categories.includes(categoryFilter)) return false;
      if (bodyPartFilter && !ex.bodyParts.includes(bodyPartFilter)) return false;
      if (equipmentFilter && !ex.equipment.includes(equipmentFilter)) return false;
      if (locationFilter && !ex.location.includes(locationFilter)) return false;
      return true;
    });
  }, [exercises, search, categoryFilter, bodyPartFilter, equipmentFilter, locationFilter]);

  /* ── Render ── */

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Review exercises
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Review community submitted exercises for accuracy, safety, and structural consistency.
        </p>

        {/* ═══ NOT LOGGED IN ═══ */}
        {auth && !auth.loggedIn && (
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 text-center space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">
              Login required
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              The review dashboard is available to verified professional reviewers.
              Please log in with your GitHub account to continue.
            </p>
            <a
              href={`/api/auth/github?returnTo=/review/dashboard`}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Login with GitHub
            </a>
          </div>
        )}

        {/* ═══ NOT VERIFIED ═══ */}
        {auth?.loggedIn && !auth.verified && (
          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center space-y-4">
            <svg
              className="mx-auto h-12 w-12 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">
              You are not a verified reviewer
            </h2>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Logged in as <strong>{auth.username}</strong>. Your GitHub username is not in the
              verified reviewers list. If you are a qualified professional, you can apply to become
              a reviewer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
              >
                Apply to become a reviewer
              </Link>
              <Link
                href="/review-guidelines"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-5 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
              >
                Read the review guidelines
              </Link>
            </div>
          </div>
        )}

        {/* ═══ VERIFIED REVIEWER ═══ */}
        {auth?.loggedIn && auth.verified && (
          <>
            {/* User info bar */}
            <div className="mt-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-emerald-800">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Verified reviewer: <strong>{auth.username}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="text-xs text-gray-500 hover:text-gray-700">
                    Logout
                  </button>
                </form>
              </div>
            </div>

            {/* Review guidelines banner */}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3">
              <svg className="h-5 w-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-sm font-bold text-gray-900">
                Before reviewing, please read the{" "}
                <Link href="/review-guidelines" className="text-primary underline underline-offset-2 hover:text-primary-deep font-extrabold">
                  Review Guidelines
                </Link>
              </p>
            </div>

            {/* Filters */}
            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or ID"
                  className="flex-1 min-w-[200px] rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">All categories</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{formatSnakeCase(c)}</option>
                  ))}
                </select>
                <select
                  value={bodyPartFilter}
                  onChange={(e) => setBodyPartFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">All body parts</option>
                  {BODY_PART_OPTIONS.map((b) => (
                    <option key={b} value={b}>{formatSnakeCase(b)}</option>
                  ))}
                </select>
                <select
                  value={equipmentFilter}
                  onChange={(e) => setEquipmentFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">All equipment</option>
                  {EQUIPMENT_OPTIONS.map((e) => (
                    <option key={e} value={e}>{formatSnakeCase(e)}</option>
                  ))}
                </select>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">All locations</option>
                  {LOCATION_OPTIONS.map((l) => (
                    <option key={l} value={l}>{formatSnakeCase(l)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="mt-10 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                <p className="mt-3 text-sm text-gray-500">Loading exercises for review</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && filtered.length === 0 && (
              <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-3 text-sm font-semibold text-gray-900">No exercises to review</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {exercises.length > 0
                    ? "No exercises match your current filters."
                    : "All community submissions have been reviewed."}
                </p>
              </div>
            )}

            {/* Exercise cards */}
            {!loading && !error && filtered.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((ex) => (
                  <Link
                    key={ex.id}
                    href={`/review/${encodeURIComponent(ex.id)}`}
                    className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-primary hover:shadow-md transition-all"
                  >
                    {/* Thumbnail */}
                    {ex.imageUrl && (
                      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
                        <img
                          src={ex.imageUrl}
                          alt={ex.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {ex.name}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500 truncate">
                      {ex.id}
                    </p>

                    {/* Tags */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ex.categories.slice(0, 3).map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {formatSnakeCase(c)}
                        </span>
                      ))}
                      {ex.bodyParts.slice(0, 2).map((b) => (
                        <span
                          key={b}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
                        >
                          {formatSnakeCase(b)}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Count */}
            {!loading && !error && filtered.length > 0 && (
              <p className="mt-4 text-xs text-gray-500 text-center">
                Showing {filtered.length} of {exercises.length} exercises pending review
              </p>
            )}
          </>
        )}

        {/* Loading auth */}
        {auth === null && (
          <div className="mt-10 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
            <p className="mt-3 text-sm text-gray-500">Checking authentication</p>
          </div>
        )}
      </main>
    </div>
  );
}
