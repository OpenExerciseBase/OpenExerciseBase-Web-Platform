"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { MobileTableOfContents, DesktopTableOfContents, TocItem } from "@/components/DocumentationTableOfContents";

const TOC: TocItem[] = [
  { id: "scope", label: "1. Scope of Contribution" },
  { id: "purpose", label: "2. Purpose of These Guidelines" },
  { id: "workflow", label: "3. Contribution Workflow" },
  { id: "submission-methods", label: "4. Submission Methods" },
  { id: "structural-requirements", label: "5. Structural Requirements" },
  { id: "writing-standards", label: "6. Writing Standards" },
  { id: "duplication-policy", label: "7. Duplication Policy" },
  { id: "professional-review", label: "8. Professional Review" },
  { id: "transparency", label: "9. Transparency and Traceability" },
  { id: "ethical-legal", label: "10. Ethical and Legal Considerations" },
  { id: "contributor-responsibility", label: "11. Contributor Responsibility" },
];

export default function ContributionGuidelinesPage() {
  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      {/* ── Hero ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Contribution Guidelines</h1>
          <p className="mt-3 text-base text-gray-500">Open Exercise Database</p>
        </div>
      </div>

      {/* ── Mobile ToC ── */}
      <MobileTableOfContents items={TOC} />

      {/* ── Main layout ── */}
      <div className="mx-auto max-w-6xl px-6 py-10 flex gap-10">
        <DesktopTableOfContents items={TOC} />

        {/* Content */}
        <article className="min-w-0 flex-1 max-w-3xl">
          {/* Callout */}
          <div className="mb-10 rounded-xl border border-primary/20 bg-primary/[0.03] p-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
            <span className="text-gray-600">Related pages:</span>
            <Link href="/documentation" className="text-primary font-medium hover:underline">Documentation</Link>
            <Link href="/review-guidelines" className="text-primary font-medium hover:underline">Review Guidelines</Link>
          </div>

          {/* ── 1. Scope ── */}
          <Section id="scope" title="1. Scope of Contribution">
            <P>The Open Exercise Database currently supports a single category of contribution:</P>
            <P><strong>Submission of a new exercise to the database.</strong></P>
            <P>All new exercises, regardless of submission method, are stored in the community branch of the repository. Exercises remain in the community branch until they undergo professional review.</P>
            <P>No exercise becomes part of the validated dataset until it has been reviewed and approved by a verified professional.</P>
            <P>This structured workflow ensures openness while maintaining scientific integrity and safety standards.</P>
          </Section>

          {/* ── 2. Purpose ── */}
          <Section id="purpose" title="2. Purpose of These Guidelines">
            <P>These Contribution Guidelines define the standards, expectations, and procedural requirements for submitting new exercises. They are designed to ensure:</P>
            <UL items={[
              "Scientific neutrality",
              "Biomechanical clarity",
              "Structural consistency",
              "Data interoperability",
              "Transparency and traceability",
              "Ethical responsibility",
            ]} />
            <P>All contributors must adhere to these principles when submitting content.</P>
          </Section>

          {/* ── 3. Workflow ── */}
          <Section id="workflow" title="3. Contribution Workflow">
            <P>The submission and validation process follows a transparent and traceable structure:</P>
            <OL items={[
              "A contributor submits a new exercise.",
              "The exercise is stored in the community branch.",
              "Verified professionals evaluate the submission.",
              "A review decision is recorded.",
              "If approved, the exercise is promoted to the main branch.",
            ]} />
            <P>Review outcomes may include:</P>
            <UL items={[
              "Approved",
              "Edited and approved",
              "Marked as duplicate",
              "Rejected",
            ]} />
            <P>Validation indicates that a qualified professional has reviewed the exercise for clarity, safety, and structural compliance. Validation does not constitute medical advice or individualized prescription.</P>
          </Section>

          {/* ── 4. Submission Methods ── */}
          <Section id="submission-methods" title="4. Submission Methods">
            <P>Contributors may add new exercises through one of four structured methods.</P>

            <H3 id="sm-form">4.1 Structured Web Form</H3>
            <P>The structured form provides a guided interface aligned with the official Data Schema Specification.</P>
            <P>Contributors manually enter:</P>
            <UL items={[
              "Basic exercise information",
              "Categories",
              "Targeted body parts",
              "Required equipment",
              "Location context",
              "Sequential instructions",
              "Performance metrics",
              "Variations",
              "Media references",
              "Comments and notes",
            ]} />
            <P>The system automatically generates a unique exercise identifier.</P>
            <P>This method is recommended for most contributors as it ensures schema compliance and reduces formatting errors.</P>
            <P>All form submissions are stored in the community branch.</P>

            <H3 id="sm-ai">4.2 AI Assisted Drafting</H3>
            <P>The platform supports AI assisted drafting of exercises.</P>
            <P>In this workflow:</P>
            <OL items={[
              "The contributor provides structured inputs such as exercise goal, body parts, equipment, setting, and difficulty.",
              "The AI generates a structured draft aligned with the database schema.",
              "The contributor reviews and edits the draft before submission.",
            ]} />
            <P>The contributor remains fully responsible for:</P>
            <UL items={[
              "Accuracy",
              "Biomechanical correctness",
              "Clarity",
              "Compliance with schema requirements",
            ]} />
            <P>Metadata must clearly indicate whether the exercise was:</P>
            <UL items={[
              "ai_generated",
              "co generated with ai",
            ]} />
            <P>AI assistance does not replace professional review.</P>
            <P>All AI assisted submissions are stored in the community branch.</P>

            <H3 id="sm-json">4.3 Uploading a Structured JSON File</H3>
            <P>Technically experienced contributors may upload a JSON file directly.</P>
            <P>Requirements:</P>
            <UL items={[
              "The file must strictly follow the official schema.",
              "All required fields must be present.",
              "Field types must match specification.",
              "Instructions must be sequential.",
              "Metadata must be correctly initialized.",
            ]} />
            <P>If the identifier does not conform to required format, the system will generate a compliant identifier.</P>
            <P>Media files must follow the standardized folder structure.</P>
            <P>Improperly structured JSON files may be rejected or require correction before review.</P>
            <P>All uploaded files are stored in the community branch.</P>

            <H3 id="sm-pr">4.4 Manual Pull Request via GitHub</H3>
            <P>Advanced contributors may submit exercises directly through a pull request to the repository.</P>
            <P>Requirements:</P>
            <UL items={[
              "The submission must target the community branch.",
              "The JSON file must be placed in the exercises directory.",
              "Media files must be placed in the corresponding images directory.",
              "The schema must be fully respected.",
            ]} />
            <P>Manual pull requests are subject to the same professional review process as web based submissions.</P>
          </Section>

          {/* ── 5. Structural Requirements ── */}
          <Section id="structural-requirements" title="5. Structural Requirements">
            <P>All submissions must conform exactly to the official Data Schema Specification.</P>
            <P>Each exercise must include:</P>
            <UL items={[
              "Unique identifier",
              "Name",
              "Categories",
              "Exercise effects",
              "Body parts",
              "Equipment",
              "Location",
              "Instructions",
              "Performance metrics",
              "Variations",
              "Media content",
              "Metadata",
              "Comments and notes",
            ]} />
            <P>Submissions that fail to meet structural requirements may be rejected or corrected during review.</P>
          </Section>

          {/* ── 6. Writing Standards ── */}
          <Section id="writing-standards" title="6. Writing Standards">
            <H3 id="ws-language">6.1 Language</H3>
            <P>Submissions must:</P>
            <UL items={[
              "Use neutral and educational tone",
              "Avoid marketing language",
              "Avoid exaggerated or unsupported claims",
              "Avoid definitive health guarantees",
              "Avoid medical prescriptions",
            ]} />
            <div className="my-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3">
                <p className="text-[11px] font-semibold text-emerald-600 mb-1">Acceptable example</p>
                <p className="text-[13px] text-gray-700">&ldquo;May contribute to improved muscular endurance.&rdquo;</p>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                <p className="text-[11px] font-semibold text-gray-400 mb-1">Unacceptable examples</p>
                <p className="text-[13px] text-gray-500">&ldquo;Cures back pain.&rdquo;</p>
                <p className="text-[13px] text-gray-500">&ldquo;Guaranteed fat loss.&rdquo;</p>
              </div>
            </div>

            <H3 id="ws-clarity">6.2 Instruction Clarity</H3>
            <P>Instructions must:</P>
            <UL items={[
              "Be sequential and logically ordered",
              "Clearly define starting position",
              "Clearly describe movement execution",
              "Indicate return phase when relevant",
              "Avoid ambiguity",
              "Avoid unsafe joint positions",
            ]} />
            <P>Each step must be understandable without external explanation.</P>

            <H3 id="ws-safety">6.3 Safety</H3>
            <P>Contributors are responsible for ensuring that:</P>
            <UL items={[
              "The described movement does not encourage unsafe alignment",
              "Equipment usage is appropriate",
              "Biomechanical cues are sound",
              "Risk elements are appropriately clarified",
            ]} />
            <P>The database does not replace professional screening or individualized assessment.</P>
          </Section>

          {/* ── 7. Duplication Policy ── */}
          <Section id="duplication-policy" title="7. Duplication Policy">
            <P>Before submitting a new exercise, contributors should:</P>
            <UL items={[
              "Search for similar exercises",
              "Determine whether the submission represents a meaningful variation",
            ]} />
            <P>Submissions that are substantially identical to existing validated exercises may be marked as duplicate during review.</P>
            <P>Meaningful variations are encouraged. Redundant duplication is discouraged.</P>
          </Section>

          {/* ── 8. Professional Review ── */}
          <Section id="professional-review" title="8. Professional Review">
            <P>All exercises in the community branch undergo evaluation by verified professionals.</P>
            <P>Reviewers assess:</P>
            <UL items={[
              "Safety and biomechanical soundness",
              "Clarity of instructions",
              "Structural consistency",
              "Scientific neutrality",
              "Duplication",
            ]} />
            <P>Only exercises approved during this process are promoted to the main branch.</P>
            <P>All review decisions are recorded in metadata.</P>
          </Section>

          {/* ── 9. Transparency ── */}
          <Section id="transparency" title="9. Transparency and Traceability">
            <P>All submissions are:</P>
            <UL items={[
              "Version controlled",
              "Associated with contributor identity",
              "Recorded with review metadata",
              "Publicly traceable",
            ]} />
            <P>This ensures accountability and scientific reproducibility.</P>
          </Section>

          {/* ── 10. Ethical and Legal ── */}
          <Section id="ethical-legal" title="10. Ethical and Legal Considerations">
            <P>Contributors must:</P>
            <UL items={[
              "Submit original content",
              "Avoid copying proprietary exercise databases",
              "Avoid uploading copyrighted images without permission",
              "Avoid discriminatory or harmful language",
              "Avoid unsupported medical claims",
            ]} />
            <P>The Open Exercise Database is intended for research and educational purposes.</P>
          </Section>

          {/* ── 11. Contributor Responsibility ── */}
          <Section id="contributor-responsibility" title="11. Contributor Responsibility">
            <P>By submitting a new exercise, contributors acknowledge that:</P>
            <UL items={[
              "They are responsible for the accuracy of the content",
              "The submission may be edited during review",
              "Validation does not imply medical endorsement",
              "The database is not a substitute for professional clinical advice",
            ]} />
          </Section>

          {/* Footer */}
          <div className="mt-16 border-t border-gray-200 pt-8 pb-6 flex flex-wrap items-center justify-between gap-4">
            <Link href="/documentation" className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              Documentation
            </Link>
            <p className="text-[12px] text-gray-400">Open Exercise Database Contribution Guidelines</p>
          </div>
        </article>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
/* Reusable content components                                             */
/* ════════════════════════════════════════════════════════════════════════ */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-14 scroll-mt-24">
      <h2 className="text-xl font-bold text-gray-900 tracking-tight border-b border-gray-200 pb-3 mb-5">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function H3({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h3 id={id} className="text-[15px] font-semibold text-primary mt-6 mb-2 scroll-mt-24">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] leading-relaxed text-gray-600">{children}</p>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-gray-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function OL({ items }: { items: string[] }) {
  return (
    <ol className="space-y-1 pl-1 list-none">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-gray-600">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{i + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
