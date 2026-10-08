import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export default function ReviewGuidelinesPage() {
  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* ── Hero ── */}
        <div className="text-center">
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium tracking-wide text-gray-500 uppercase">
            For reviewers
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Reviewer Guidelines
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-500">
            Standards and expectations for reviewing exercises in OpenExerciseBase.
            Validation confirms a qualified professional has reviewed the entry for clarity and safety.
            It does not constitute medical advice.
          </p>
        </div>

        {/* ── Purpose ── */}
        <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900">Purpose of review</h2>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-gray-600">
            Professional review ensures every exercise in the database is safe, biomechanically sound,
            clearly written, structurally consistent, and scientifically neutral.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Safe", "Biomechanically sound", "Clear", "Structurally consistent", "Scientifically neutral"].map((t) => (
              <span key={t} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[12px] font-medium text-gray-600">{t}</span>
            ))}
          </div>
        </div>

        {/* ── Five dimensions grid ── */}
        <div className="mt-12 flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Five review dimensions</h2>
            <p className="text-[13px] text-gray-500">Reviewers assess exercises across these areas.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DimCard icon="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" title="Safety & biomechanics">
            <Bullet>No unsafe joint positions</Bullet>
            <Bullet>Alignment cues promote neutral posture</Bullet>
            <Bullet>No extreme angles without context</Bullet>
            <Bullet>Equipment use is appropriate</Bullet>
            <Bullet>Risky movements include cautions</Bullet>
            <Bullet>Appropriate for general populations</Bullet>
          </DimCard>

          <DimCard icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" title="Clarity of instructions">
            <Bullet>Sequential and logically ordered</Bullet>
            <Bullet>Free of ambiguity and contradictions</Bullet>
            <Bullet>Describes posture, direction, control</Bullet>
            <Bullet>Starting position clearly stated</Bullet>
            <Bullet>Movement execution described</Bullet>
            <Bullet>End position or return phase included</Bullet>
          </DimCard>

          <DimCard icon="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" title="Structural consistency">
            <Bullet>Categories match movement type</Bullet>
            <Bullet>Body parts match muscle involvement</Bullet>
            <Bullet>Equipment matches instructions</Bullet>
            <Bullet>Metrics appropriate for exercise</Bullet>
            <Bullet>Variations and relationships consistent</Bullet>
            <Bullet>No irrelevant fields</Bullet>
          </DimCard>

          <DimCard icon="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" title="Scientific neutrality">
            <Bullet>No exaggerated claims</Bullet>
            <Bullet>No medical promises</Bullet>
            <Bullet>No marketing language</Bullet>
            <Bullet>No unsupported physiological claims</Bullet>
            <Bullet>No health outcome guarantees</Bullet>
            <p className="mt-2 text-[12px] text-gray-400">Tone must remain neutral and educational.</p>
          </DimCard>

          <DimCard icon="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" title="Duplication & relationships">
            <Bullet>Check if exercise already exists</Bullet>
            <Bullet>Identify if it&apos;s a variation</Bullet>
            <Bullet>Link via variation_of, progression_of, etc.</Bullet>
            <Bullet>Mark obvious duplicates</Bullet>
            <p className="mt-2 text-[12px] text-gray-400">Link to the canonical entry when marking duplicates.</p>
          </DimCard>
        </div>

        {/* ── Review outcomes ── */}
        <div className="mt-12 flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Review outcomes</h2>
            <p className="text-[13px] text-gray-500">Each decision must include brief review notes.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Approve", desc: "Meets safety, clarity, and structural standards.", icon: "M4.5 12.75l6 6 9-13.5" },
            { title: "Request changes", desc: "Revisions needed. Provide clear, constructive guidance.", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" },
            { title: "Reject", desc: "Unsafe, misleading, structurally inappropriate, or out of scope.", icon: "M6 18L18 6M6 6l12 12" },
            { title: "Mark as duplicate", desc: "Substantially overlaps with an existing validated exercise.", icon: "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" },
          ].map((o) => (
            <div key={o.title} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={o.icon} />
                </svg>
              </div>
              <h3 className="text-[13px] font-semibold text-gray-900">{o.title}</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-gray-500">{o.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Writing notes + Conduct ── */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {/* Review notes */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </div>
              <h2 className="text-[15px] font-semibold text-gray-900">Writing review notes</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[12px] font-medium text-gray-700 mb-1.5">Notes should be:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Objective", "Specific", "Constructive", "Professional"].map((w) => (
                    <span key={w} className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">{w}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[12px] font-medium text-gray-700 mb-1.5">Avoid:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Personal criticism", "Dismissive language", "Overly long essays"].map((w) => (
                    <span key={w} className="rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">{w}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3">
                  <p className="text-[11px] font-semibold text-emerald-600 mb-0.5">Good example</p>
                  <p className="text-[13px] text-gray-700">&ldquo;Instructions should clarify knee alignment during the descent phase.&rdquo;</p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-[11px] font-semibold text-gray-400 mb-0.5">Poor example</p>
                  <p className="text-[13px] text-gray-500">&ldquo;This is badly written.&rdquo;</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conduct + Conflict */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900">Reviewer conduct</h2>
              </div>
              <div className="space-y-1.5">
                <Bullet>Maintain professional tone</Bullet>
                <Bullet>Base decisions on movement science</Bullet>
                <Bullet>Avoid discrimination or bias</Bullet>
                <Bullet>Respect contributors</Bullet>
              </div>
              <p className="mt-3 text-[12px] text-gray-400">The review process is collaborative, not adversarial.</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900">Conflict of interest</h2>
              </div>
              <div className="space-y-1.5">
                <Bullet>Don&apos;t review exercises you submitted</Bullet>
                <Bullet>Don&apos;t review content tied to commercial products</Bullet>
                <Bullet>Disclose potential conflicts</Bullet>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scope of validation ── */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-[15px] font-semibold text-gray-900">Scope of validation</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-4">
              <p className="text-[12px] font-semibold text-emerald-700 mb-2.5 flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Validation confirms
              </p>
              <div className="space-y-1.5">
                <Bullet>Exercise description is safe and clear</Bullet>
                <Bullet>Structural fields are appropriate</Bullet>
                <Bullet>Movement is biomechanically reasonable</Bullet>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-[12px] font-semibold text-gray-500 mb-2.5 flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Validation does not confirm
              </p>
              <div className="space-y-1.5">
                <Bullet>Clinical suitability for all individuals</Bullet>
                <Bullet>Medical effectiveness</Bullet>
                <Bullet>Superiority over other exercises</Bullet>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-8 pb-4">
          <Link
            href="/review/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Review dashboard
          </Link>
          <Link
            href="/review"
            className="text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to review overview
          </Link>
        </div>
      </main>
    </div>
  );
}

/* ── Reusable components ── */

function DimCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <svg className="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </span>
        <h3 className="text-[13px] font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-[12px] leading-relaxed text-gray-600">
      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
      <span>{children}</span>
    </p>
  );
}
