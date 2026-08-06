"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const RAW_BASE = "https://raw.githubusercontent.com/rania-is/samplejson";

interface Assignment {
  studyId: string;
  title: string;
  description: string;
  reviewers: {
    githubUsername?: string;
    code?: string;
    assignedExercises?: string[];
    exerciseIds?: string[];
  }[];
}

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
  code?: boolean;
}

export default function StudyEntryPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [myExercises, setMyExercises] = useState<string[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notAssigned, setNotAssigned] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);

  const fetchSession = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    return data as Session;
  }, []);

  const fetchAssignments = useCallback(async (username: string) => {
    const url = `${RAW_BASE}/main/study/assignments.json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load study assignments.");
    const data = await res.json();

    const reviewers = Array.isArray(data?.reviewers) ? data.reviewers : [];
    const assignment: Assignment = {
      studyId: data?.studyId ?? "",
      title: data?.title ?? "",
      description: data?.description ?? "",
      reviewers,
    };

    const reviewer = reviewers.find(
      (r: { githubUsername?: string; code?: string }) =>
        (r.githubUsername && r.githubUsername.toLowerCase() === username.toLowerCase()) ||
        (r.code && r.code.toLowerCase() === username.toLowerCase())
    );
    if (!reviewer) {
      setNotAssigned(true);
      return { assignment, exercises: [] as string[] };
    }

    const exerciseIds = Array.isArray(reviewer.assignedExercises)
      ? reviewer.assignedExercises
      : Array.isArray(reviewer.exerciseIds)
        ? reviewer.exerciseIds
        : [];
    return { assignment, exercises: exerciseIds as string[] };
  }, []);

  const fetchProgress = useCallback(async (username: string) => {
    const url = `${RAW_BASE}/study/results/study/responses/${username}/progress.json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Progress;
  }, []);

  const submitCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeLoading(true);
    setCodeError(null);
    try {
      const res = await fetch("/api/study/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCodeError(data.error || "Invalid code");
        return;
      }
      // Reload session and assignments
      setLoading(true);
      const sess = await fetchSession();
      setSession(sess);
      if (sess.loggedIn && sess.username) {
        const { assignment: a, exercises } = await fetchAssignments(sess.username);
        setAssignment(a);
        setMyExercises(exercises);
        if (exercises.length > 0) {
          const prog = await fetchProgress(sess.username);
          if (prog) setProgress(prog);
        }
      }
      setLoading(false);
    } catch {
      setCodeError("Could not validate code. Please try again.");
    } finally {
      setCodeLoading(false);
    }
  }, [code, fetchAssignments, fetchProgress, fetchSession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sess = await fetchSession();
        if (cancelled) return;
        setSession(sess);

        if (!sess.loggedIn) {
          setLoading(false);
          return;
        }

        const { assignment: a, exercises } = await fetchAssignments(sess.username!);
        if (cancelled) return;
        setAssignment(a);
        setMyExercises(exercises);

        if (exercises.length > 0) {
          const prog = await fetchProgress(sess.username!);
          if (cancelled) return;
          if (prog) setProgress(prog);
        }

        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fetchSession, fetchAssignments, fetchProgress]);

  const exercises = myExercises ?? [];
  const completedCount = progress?.completed ?? 0;
  const totalCount = exercises.length;
  const allDone = totalCount > 0 && completedCount >= totalCount;
  const completedSet = new Set(progress?.completedExerciseIds ?? []);
  const nextExercise = exercises.find((id) => !completedSet.has(id));

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <PageHeader />
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded bg-gray-200" />
            <div className="h-4 w-96 rounded bg-gray-200" />
            <div className="h-32 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Not logged in */}
        {!session?.loggedIn && (
          <div className="rounded-2xl border border-gray-200 bg-white px-8 py-12 text-center shadow-sm">
            <svg
              className="mx-auto h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
              Expert Exercise Review Study
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500">
              Sign in with GitHub or enter your study code to check your assignment and begin reviewing.
            </p>
            <a
              href="/api/auth/github?returnTo=/study"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Sign in with GitHub
            </a>

            <div className="mt-8 border-t border-gray-200 pt-8">
              <p className="text-sm font-medium text-gray-700">Or enter your study code</p>
              <form onSubmit={submitCode} className="mt-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. ABC123"
                    className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={codeLoading || !code.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors disabled:opacity-50"
                  >
                    {codeLoading ? "Checking..." : "Continue with code"}
                  </button>
                </div>
                {codeError && (
                  <p className="mt-3 text-sm font-medium text-red-600">{codeError}</p>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50/60 px-8 py-6 text-center">
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        )}

        {/* Not assigned */}
        {session?.loggedIn && notAssigned && (
          <div className="rounded-2xl border border-gray-200 bg-white px-8 py-12 text-center shadow-sm">
            <svg
              className="mx-auto h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
              Not Assigned
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500">
              You are not assigned to this study. If you believe this is an error, please contact the study coordinator.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Signed in as <span className="font-medium text-gray-600">{session.username}</span>
            </p>
          </div>
        )}

        {/* Assigned */}
        {session?.loggedIn && !notAssigned && assignment && exercises.length > 0 && (
          <div className="space-y-8">
            {/* Hero */}
            <div className="text-center">
              <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium tracking-wide text-gray-500 uppercase">
                Research study
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {assignment.title || "Expert Exercise Review Study"}
              </h1>
              <p className="mt-2 text-xs text-gray-400">
                Signed in as <span className="font-medium text-gray-600">{session.username}</span>
              </p>
            </div>

            {/* Introduction */}
            <div className="rounded-2xl border border-gray-200 bg-white px-8 py-6 shadow-sm space-y-4 text-sm leading-relaxed text-gray-600">
              <h2 className="text-base font-semibold text-gray-900">
                Exercise Database Quality Study: Reviewer Instructions
              </h2>
              <p>Thank you for taking part in this evaluation.</p>
              <p>
                This study includes a set of exercise database entries. Some of these exercises were written by professionals in the field. Others were generated by an AI system. They have been mixed together, and you will not be told which is which as you go through them. Your task is to evaluate the quality of each entry using the questions below, and in one part of the questionnaire, to give your own opinion on whether you think it was written by a professional or generated by AI.
              </p>
              <p>
                Please read this in full before you begin, since it explains a few things that are not obvious from the questions alone.
              </p>

              <h3 className="pt-2 text-sm font-semibold text-gray-900">What you are doing</h3>
              <p>
                For each assigned exercise, you will answer three sections: a set of quality ratings, a question about whether you think the entry was generated by AI, and a final accept or reject decision. Please rate every exercise independently and on its own, without comparing it to other entries you have seen. Please also avoid discussing specific entries with other reviewers until the study is complete, since this could bias the results.
              </p>

              <h3 className="pt-2 text-sm font-semibold text-gray-900">
                An important note before you answer the AI question on any entry
              </h3>
              <p>
                Every image in this study was generated by AI, for every single exercise, regardless of who actually wrote the instructions. This is true for all of what you will review, so the image itself is not a useful clue to whether an entry is AI generated. Please base your judgment on the instructions and description text, not on whether the image looks AI made. You will still rate the image separately in Section A, question 7, which asks something different: whether the image accurately depicts the exercise.
              </p>

              <h3 className="pt-2 text-sm font-semibold text-gray-900">Section A: Core Quality Ratings</h3>
              <p>Scale: 1 equals Strongly disagree, 7 equals Strongly agree</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>How would you rate the overall quality of this exercise entry (Very low to Very high)</li>
                <li>The instructions are clear and unambiguous</li>
                <li>The movement described is biomechanically sound</li>
                <li>The exercise can be performed safely as described</li>
                <li>The classification (target muscles, equipment, category, and performance metrics) accurately reflects the exercise</li>
                <li>I would consider using or recommending this exercise after normal professional review</li>
                <li>Does the image accurately and clearly represent the exercise being described?</li>
              </ul>

              <h3 className="pt-2 text-sm font-semibold text-gray-900">Section B: AI Detectability and Bias</h3>
              <p>
                This section asks whether you believe the entry was generated by AI. There are no right or wrong answers. We are studying whether AI generated and professionally written entries can be told apart, not testing you. Please answer based on the instructions and description, not the image, as explained above.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Do you believe this exercise entry was generated by AI? (Yes or No)</li>
                <li>How confident are you in your answer? (1 equals Not confident, 7 equals Very confident)</li>
              </ul>

              <h3 className="pt-2 text-sm font-semibold text-gray-900">Final Decision</h3>
              <p>Please choose the outcome you would apply after reviewing this entry.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Accept: accept the exercise entry as is for the purpose of this study.</li>
                <li>Edit and accept: make edits to the exercise, then accept the edited version for the purpose of this study.</li>
                <li>Reject: reject the entry for the purpose of this study.</li>
              </ul>

              <h3 className="pt-2 text-sm font-semibold text-gray-900">A few practical notes</h3>
              <p>
                Please answer every question for every entry, even if your answer is uncertain, using your best professional judgment. This should take roughly 2 to 4 minutes per exercise. If something about an entry is ambiguous or does not fit a question well, use your best judgment and move on.
              </p>
              <p>
                Questions about the study can be directed to{" "}
                <a href="mailto:rania.islambouli@lbg.ac.at" className="text-primary hover:underline">
                  rania.islambouli@lbg.ac.at
                </a>
              </p>
            </div>

            {/* Progress card */}
            <div className="rounded-2xl border border-gray-200 bg-white px-8 py-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Your Progress</h2>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Completed {completedCount} of {totalCount}
                  </span>
                  <span className="font-medium text-gray-900">
                    {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {progress?.lastUpdated && (
                <p className="mt-3 text-xs text-gray-400">
                  Last updated: {new Date(progress.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>

            {/* Exercise list */}
            <div className="rounded-2xl border border-gray-200 bg-white px-8 py-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Assigned Exercises</h2>
              <div className="mt-4 divide-y divide-gray-100">
                {exercises.map((id, idx) => {
                  const done = completedSet.has(id);
                  return (
                    <div key={id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            done
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {done ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <span className={`text-sm ${done ? "text-gray-400 line-through" : "text-gray-700"}`}>
                          Exercise {idx + 1}
                        </span>
                      </div>
                      {done ? (
                        <span className="text-xs font-medium text-green-600">Completed</span>
                      ) : (
                        <Link
                          href={`/study/review/${encodeURIComponent(id)}`}
                          className="text-xs font-medium text-primary hover:text-primary-deep transition-colors"
                        >
                          Review
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action button */}
            <div className="text-center">
              {allDone ? (
                <Link
                  href="/study/complete"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-colors"
                >
                  View Completion Summary
                </Link>
              ) : nextExercise ? (
                <Link
                  href={`/study/review/${encodeURIComponent(nextExercise)}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
                >
                  {completedCount > 0 ? "Continue Reviewing" : "Start Reviewing"}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
