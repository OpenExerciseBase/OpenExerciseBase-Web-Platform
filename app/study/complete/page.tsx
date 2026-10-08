"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const RAW_BASE = "https://raw.githubusercontent.com/OpenExerciseBase/OpenExerciseBase-Database";

interface Progress {
  studyId: string;
  totalAssigned: number;
  completed: number;
  completedExerciseIds: string[];
  lastUpdated: string;
}

interface Session {
  loggedIn: boolean;
  username?: string;
}

export default function StudyCompletePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const sessRes = await fetch("/api/auth/me");
      const sess: Session = await sessRes.json();
      setSession(sess);

      if (sess.loggedIn && sess.username) {
        const progRes = await fetch(
          `${RAW_BASE}/study/results/study/responses/${sess.username}/progress.json`,
          { cache: "no-store" }
        );
        if (progRes.ok) {
          const progData: Progress = await progRes.json();
          setProgress(progData);
        }
      }
    } catch {
      // Ignore errors on completion page
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader />
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-gray-200" />
            <div className="h-8 w-64 mx-auto rounded bg-gray-200" />
            <div className="h-4 w-96 mx-auto rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-12 text-center shadow-sm">
          {/* Success icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Study Complete
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500">
            Thank you for completing the Expert Exercise Review Study. Your responses have been saved successfully.
          </p>

          {/* Summary */}
          {progress && (
            <div className="mx-auto mt-8 max-w-xs rounded-xl bg-gray-50 px-6 py-4">
              <div className="text-3xl font-bold text-primary">
                {progress.completed}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {progress.completed === 1 ? "exercise reviewed" : "exercises reviewed"}
              </p>
              {progress.lastUpdated && (
                <p className="mt-2 text-xs text-gray-400">
                  Last submission: {new Date(progress.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {session?.username && (
            <p className="mt-6 text-xs text-gray-400">
              Signed in as <span className="font-medium text-gray-600">{session.username}</span>
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/study"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:border-gray-400 transition-colors"
            >
              Back to Study Home
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
