import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export default function ReviewLandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Professional exercise review
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600">
            Help maintain the quality and safety of OpenExerciseBase by reviewing
            community-submitted exercises. Every review ensures that exercises are accurate,
            safe, and scientifically sound.
          </p>
        </div>

        {/* ═══ Three steps ═══ */}
        <div className="mt-14 space-y-8">

          {/* Step 1 — Guidelines */}
          <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Read the review guidelines</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Before reviewing any exercises, familiarize yourself with the review standards.
                  Reviewers evaluate exercises across five dimensions: safety, clarity, structural
                  consistency, scientific neutrality, and duplication.
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Ensure exercises are safe and biomechanically sound
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Verify instructions are clear and unambiguous
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Check structural consistency with the database schema
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    Flag duplicates and suggest relationships
                  </li>
                </ul>
                <Link
                  href="/review-guidelines"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  Read guidelines
                </Link>
              </div>
            </div>
          </div>

          {/* Step 2 — Register */}
          <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Register as a reviewer</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  The review process is open to qualified professionals. Apply to become a verified
                  reviewer by submitting your credentials. Once approved, you will receive reviewer
                  access on the repository.
                </p>
                <div className="mt-3 text-sm text-gray-600">
                  <p className="font-medium text-gray-700 mb-1.5">Who can apply:</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Physiotherapists and rehabilitation specialists
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Sports scientists and exercise physiologists
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Certified strength and conditioning coaches
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Researchers in exercise science or related fields
                    </li>
                  </ul>
                </div>
                <Link
                  href="/verify"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Apply to become a reviewer
                </Link>
              </div>
            </div>
          </div>

          {/* Step 3 — Review */}
          <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Review exercises</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Once verified, access the review dashboard to browse and review community-submitted
                  exercises. You can approve, request changes, reject, or mark exercises as duplicates.
                  Your name will appear as a verified reviewer on exercises you approve.
                </p>
                <div className="mt-3 text-sm text-gray-600">
                  <p className="font-medium text-gray-700 mb-1.5">Review actions:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Approve</span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Edit and approve</span>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">Mark as duplicate</span>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">Reject</span>
                  </div>
                </div>
                <Link
                  href="/review/dashboard"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  Go to review dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-12 rounded-xl border border-primary/20 bg-primary/[0.03] p-5 text-center">
          <p className="text-sm text-gray-600">
            All review decisions are recorded publicly in the repository. Validation confirms that a
            qualified professional has reviewed the exercise for clarity and safety. It does not
            constitute medical advice.
          </p>
        </div>
      </main>
    </div>
  );
}
