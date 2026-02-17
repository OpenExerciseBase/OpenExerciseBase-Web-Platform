"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";

/* ── Constants ── */

const ROLE_OPTIONS = [
  "Physiotherapist",
  "Sports scientist",
  "Exercise physiologist",
  "Strength and conditioning coach",
  "Certified trainer",
  "Rehabilitation specialist",
  "Researcher",
  "Other",
];

const EXPERTISE_OPTIONS = [
  "Rehabilitation",
  "Strength and resistance training",
  "Endurance training",
  "Mobility and flexibility",
  "Balance and fall prevention",
  "Sports performance",
  "Cardiovascular health",
  "Older adults",
  "Pediatrics",
  "Other",
];

/* ── Types ── */

interface FormState {
  fullName: string;
  email: string;
  github: string;
  role: string;
  otherRole: string;
  expertiseAreas: string[];
  otherExpertise: string;
  verificationLinks: string[];
  linkInput: string;
  affiliation: string;
  country: string;
  experienceSummary: string;
  agreeGuidelines: boolean;
  agreeNoMedicalAdvice: boolean;
  honeypot: string;
}

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  github: "",
  role: "",
  otherRole: "",
  expertiseAreas: [],
  otherExpertise: "",
  verificationLinks: [],
  linkInput: "",
  affiliation: "",
  country: "",
  experienceSummary: "",
  agreeGuidelines: false,
  agreeNoMedicalAdvice: false,
  honeypot: "",
};

/* ── Page ── */

export default function VerifyPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /* ── Helpers ── */

  const update = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleExpertise = useCallback((value: string) => {
    setForm((prev) => {
      const arr = prev.expertiseAreas;
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, expertiseAreas: next };
    });
  }, []);

  const addLink = useCallback(() => {
    const val = form.linkInput.trim();
    if (val && !form.verificationLinks.includes(val)) {
      setForm((prev) => ({
        ...prev,
        verificationLinks: [...prev.verificationLinks, val],
        linkInput: "",
      }));
    }
  }, [form.linkInput, form.verificationLinks]);

  const removeLink = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      verificationLinks: prev.verificationLinks.filter((_, i) => i !== index),
    }));
  }, []);

  /* ── Validate ── */

  const validate = useCallback((): string[] => {
    const errs: string[] = [];
    if (!form.fullName.trim()) errs.push("Full name is required.");
    if (!form.email.trim()) errs.push("Email is required.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.push("Please enter a valid email address.");
    if (!form.github.trim()) errs.push("GitHub username is required.");
    if (!form.role) errs.push("Please select a role.");
    else if (form.role === "Other" && !form.otherRole.trim())
      errs.push("Please specify your role.");
    if (form.expertiseAreas.length === 0)
      errs.push("Please select at least one area of expertise.");
    if (form.verificationLinks.length === 0)
      errs.push("Please add at least one verification link.");
    if (!form.agreeGuidelines)
      errs.push("You must agree to follow the review guidelines.");
    if (!form.agreeNoMedicalAdvice)
      errs.push("You must agree that reviews do not constitute medical advice.");
    return errs;
  }, [form]);

  /* ── Submit ── */

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setValidationErrors([]);

      const errs = validate();
      if (errs.length > 0) {
        setValidationErrors(errs);
        return;
      }

      setSubmitting(true);

      try {
        const payload = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          githubUsername: form.github.trim(),
          role: form.role === "Other" && form.otherRole.trim()
            ? `Other: ${form.otherRole.trim()}`
            : form.role,
          expertiseAreas: form.expertiseAreas.map((a) =>
            a === "Other" && form.otherExpertise.trim()
              ? `Other: ${form.otherExpertise.trim()}`
              : a
          ),
          verificationLinks: form.verificationLinks.filter((l) => l.trim() !== ""),
          affiliation: form.affiliation.trim(),
          country: form.country.trim(),
          experienceSummary: form.experienceSummary.trim(),
          agreeGuidelines: Boolean(form.agreeGuidelines),
          agreeNoMedicalAdvice: Boolean(form.agreeNoMedicalAdvice),
          honeypot: form.honeypot,
        };

        const res = await fetch("/api/submit-reviewer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.ok) {
          setSubmitted(true);
        } else {
          setError(
            data.error ??
              "Something went wrong. Please try again later."
          );
        }
      } catch {
        setError("Network error. Please check your connection and try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [form, validate]
  );

  /* ── Render ── */

  const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-0 transition-colors";

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-2xl px-6 py-12">
        {/* ── Hero ── */}
        <div className="text-center">
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium tracking-wide text-gray-500 uppercase">
            Reviewer application
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Become a verified reviewer
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-500">
            Help maintain the quality and safety of the database by reviewing community submissions.
            Your expertise ensures every exercise is accurate, safe, and scientifically sound.
          </p>
        </div>

        {/* ── Info cards ── */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {/* Who can apply */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-[13px] font-semibold text-gray-900">Who can apply</h3>
            <div className="mt-3 space-y-2">
              {[
                "Physiotherapists",
                "Sports scientists",
                "Exercise physiologists",
                "Strength & conditioning coaches",
                "Certified trainers",
                "Researchers in exercise science",
              ].map((r) => (
                <p key={r} className="flex items-center gap-2 text-[13px] text-gray-600">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                  {r}
                </p>
              ))}
            </div>
          </div>

          {/* What you do */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-[13px] font-semibold text-gray-900">What reviewers do</h3>
            <div className="mt-3 space-y-2">
              {[
                "Review exercises for accuracy and safety",
                "Verify correct form and technique",
                "Flag injury risks or errors",
                "Suggest improvements to metadata",
                "Follow objective review guidelines",
              ].map((r) => (
                <p key={r} className="flex items-center gap-2 text-[13px] text-gray-600">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                  {r}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* ── Process steps ── */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="text-[13px] font-semibold text-gray-900">After you apply</h3>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-6">
            {[
              { n: "1", t: "We verify your credentials" },
              { n: "2", t: "You receive reviewer access" },
              { n: "3", t: "Start reviewing exercises" },
              { n: "4", t: "Your name appears on approvals" },
            ].map((s) => (
              <div key={s.n} className="flex items-center gap-2.5 sm:flex-1">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                  {s.n}
                </span>
                <span className="text-[13px] text-gray-600">{s.t}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-400">Expected response time: 3–7 days</p>
        </div>

        {/* ═══ SUCCESS ═══ */}
        {submitted && (
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Application received</h3>
            <p className="text-sm text-gray-500">
              We review applications manually and will contact you via the email you provided.
              Expected response time is 3–7 days.
            </p>
            <Link
              href="/"
              className="inline-block mt-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Back to home
            </Link>
          </div>
        )}

        {/* ═══ FORM ═══ */}
        {!submitted && (
          <form onSubmit={handleSubmit} className="mt-10" noValidate>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
              <h2 className="text-base font-semibold text-gray-900">Application form</h2>
              <p className="mt-1 text-[13px] text-gray-400">Fields marked with * are required.</p>

              {/* Honeypot */}
              <div className="absolute opacity-0 h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="honeypot">Leave this empty</label>
                <input id="honeypot" name="honeypot" type="text" tabIndex={-1} autoComplete="off" value={form.honeypot} onChange={(e) => update({ honeypot: e.target.value })} />
              </div>

              <div className="mt-6 space-y-5">
                {/* Name + Email row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="block text-[13px] font-medium text-gray-700 mb-1">Full name *</label>
                    <input id="fullName" type="text" value={form.fullName} onChange={(e) => update({ fullName: e.target.value })} placeholder="Your full name" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-[13px] font-medium text-gray-700 mb-1">Email *</label>
                    <input id="email" type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} placeholder="you@example.com" className={inputCls} />
                  </div>
                </div>

                {/* GitHub + Role row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="github" className="block text-[13px] font-medium text-gray-700 mb-1">GitHub username *</label>
                    <input id="github" type="text" value={form.github} onChange={(e) => update({ github: e.target.value })} placeholder="your-github-username" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-[13px] font-medium text-gray-700 mb-1">Role *</label>
                    <select id="role" value={form.role} onChange={(e) => update({ role: e.target.value })} className={inputCls + " bg-white"}>
                      <option value="">Select your role</option>
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {form.role === "Other" && (
                      <input type="text" value={form.otherRole} onChange={(e) => update({ otherRole: e.target.value })} placeholder="Please specify" className={inputCls + " mt-2"} />
                    )}
                  </div>
                </div>

                {/* Expertise */}
                <div>
                  <span className="block text-[13px] font-medium text-gray-700 mb-2">Areas of expertise *</span>
                  <div className="flex flex-wrap gap-1.5">
                    {EXPERTISE_OPTIONS.map((opt) => {
                      const active = form.expertiseAreas.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleExpertise(opt)}
                          className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-all ${
                            active
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {form.expertiseAreas.includes("Other") && (
                    <input type="text" value={form.otherExpertise} onChange={(e) => update({ otherExpertise: e.target.value })} placeholder="Please specify" className={inputCls + " mt-2"} />
                  )}
                </div>

                {/* Verification links */}
                <div>
                  <label htmlFor="linkInput" className="block text-[13px] font-medium text-gray-700 mb-1">Verification links *</label>
                  <p className="text-[11px] text-gray-400 mb-2">Professional profile, certifications, publications, or portfolio.</p>
                  <div className="flex gap-2">
                    <input
                      id="linkInput"
                      type="url"
                      value={form.linkInput}
                      onChange={(e) => update({ linkInput: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                      placeholder="https://..."
                      className={inputCls + " flex-1"}
                    />
                    <button type="button" onClick={addLink} className="shrink-0 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      Add
                    </button>
                  </div>
                  {form.verificationLinks.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {form.verificationLinks.map((link, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                          <span className="truncate text-[13px] text-gray-600 mr-2">{link}</span>
                          <button type="button" onClick={() => removeLink(i)} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors" aria-label={`Remove link ${i + 1}`}>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Affiliation + Country row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="affiliation" className="block text-[13px] font-medium text-gray-700 mb-1">Affiliation <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input id="affiliation" type="text" value={form.affiliation} onChange={(e) => update({ affiliation: e.target.value })} placeholder="University, clinic, or organization" className={inputCls} />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-[13px] font-medium text-gray-700 mb-1">Country <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input id="country" type="text" value={form.country} onChange={(e) => update({ country: e.target.value })} placeholder="Your country" className={inputCls} />
                  </div>
                </div>

                {/* Experience summary */}
                <div>
                  <label htmlFor="experienceSummary" className="block text-[13px] font-medium text-gray-700 mb-1">Experience summary <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea
                    id="experienceSummary"
                    value={form.experienceSummary}
                    onChange={(e) => update({ experienceSummary: e.target.value })}
                    placeholder="Briefly describe your relevant experience and qualifications"
                    rows={3}
                    className={inputCls + " resize-none"}
                  />
                </div>

                {/* Agreements */}
                <div className="space-y-2.5 rounded-lg bg-gray-50 p-4">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={form.agreeGuidelines} onChange={(e) => update({ agreeGuidelines: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400" />
                    <span className="text-[13px] text-gray-600">
                      I agree to follow the review guidelines and provide objective, evidence-based feedback.
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={form.agreeNoMedicalAdvice} onChange={(e) => update({ agreeNoMedicalAdvice: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400" />
                    <span className="text-[13px] text-gray-600">
                      I understand that reviews do not constitute medical advice and the database is for educational purposes.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-1">
                {validationErrors.map((err, i) => (
                  <p key={i} className="text-[13px] text-gray-700">{err}</p>
                ))}
              </div>
            )}

            {/* Server error */}
            {error && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-[13px] text-gray-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting
                </>
              ) : (
                "Submit application"
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
