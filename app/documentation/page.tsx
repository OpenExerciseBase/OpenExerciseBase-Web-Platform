"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";

/* ── Table of Contents data ── */

const TOC = [
  { id: "introduction", label: "1. Introduction" },
  { id: "what-is-exercise", label: "2. What Is Physical Exercise" },
  { id: "purpose", label: "3. Purpose of the Database" },
  { id: "data-structure", label: "4. Exercise Data Structure" },
  { id: "contribution-model", label: "5. Contribution Model" },
  { id: "review-model", label: "6. Professional Review Model" },
  { id: "use-cases", label: "7. Use Cases" },
  { id: "ai-integration", label: "8. AI Integration" },
  { id: "scope-limitations", label: "9. Scope and Limitations" },
  { id: "versioning", label: "10. Versioning and Transparency" },
  { id: "appendix-a", label: "Appendix A: Data Schema" },
];

/* ── Page ── */

export default function DocumentationPage() {
  const [activeId, setActiveId] = useState("");
  const [tocOpen, setTocOpen] = useState(false);

  /* Track which section is in view */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    for (const item of TOC) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTocOpen(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      {/* ── Hero ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Documentation</h1>
          <p className="mt-3 text-base text-gray-500">OpenExerciseBase</p>
        </div>
      </div>

      {/* ── Mobile ToC drawer ── */}
      {tocOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setTocOpen(false)} />
          <nav className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-200 p-5 pt-16 overflow-y-auto">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Contents</p>
            {TOC.map((t) => (
              <button key={t.id} onClick={() => scrollTo(t.id)} className={`block w-full text-left px-2 py-1.5 rounded text-[13px] transition-colors ${activeId === t.id ? "text-primary font-semibold bg-primary/5" : "text-gray-600 hover:text-gray-900"}`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="mx-auto max-w-6xl px-6 py-10 flex gap-10">
        {/* Desktop ToC */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-20">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Contents</p>
            {TOC.map((t) => (
              <button key={t.id} onClick={() => scrollTo(t.id)} className={`block w-full text-left px-2.5 py-1.5 rounded text-[13px] transition-colors ${activeId === t.id ? "text-primary font-semibold bg-primary/5" : "text-gray-500 hover:text-gray-900"}`}>
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <article className="min-w-0 flex-1 max-w-3xl">
          {/* ════════════════════════════════════════════ */}
          {/* 1. Introduction */}
          {/* ════════════════════════════════════════════ */}
          <Section id="introduction" title="1. Introduction">
            <P>OpenExerciseBase is an open, structured, and professionally validated repository of physical exercises designed to serve researchers, developers, clinicians, educators, and exercise professionals.</P>
            <P>The database provides machine readable, consistently structured exercise descriptions that can be used in:</P>
            <UL items={[
              "Research studies",
              "Digital health systems",
              "Behavior change interventions",
              "Rehabilitation platforms",
              "Fitness and wellness applications",
              "Educational materials",
            ]} />
            <P>The platform combines open community contribution with professional validation to ensure both accessibility and scientific integrity.</P>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* 2. What Is Physical Exercise */}
          {/* ════════════════════════════════════════════ */}
          <Section id="what-is-exercise" title="2. What Is Physical Exercise">
            <H3>Core Definition</H3>
            <P>Physical exercise is a type of physical activity that is planned, structured, repetitive, and performed with the specific purpose of improving or maintaining physical fitness and health.</P>
            <P>In exercise science, exercise is defined as a subcategory of physical activity in which muscle contractions are organized in a planned, structured, and repetitive manner.</P>
            <P>The goal of exercise is to improve or maintain one or more components of physical fitness, including:</P>
            <UL items={[
              "Cardiovascular endurance",
              "Muscular strength",
              "Muscular endurance",
              "Flexibility",
              "Balance and coordination",
              "Body composition",
            ]} />

            <H3>Difference Between Physical Activity and Physical Exercise</H3>
            <P>Physical activity refers to any bodily movement produced by skeletal muscles that requires energy expenditure. This includes:</P>
            <UL items={[
              "Occupational movement",
              "Transportation such as walking or cycling",
              "Household tasks",
              "Recreational movement",
            ]} />
            <P>Physical exercise is narrower in scope. It is:</P>
            <UL items={[
              "Intentional",
              "Structured",
              "Repetitive",
              "Designed with a specific fitness goal",
            ]} />
            <P>This distinction is important for research and digital systems, as the database focuses specifically on structured exercise rather than all forms of movement.</P>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* 3. Purpose */}
          {/* ════════════════════════════════════════════ */}
          <Section id="purpose" title="3. Purpose of the Database">
            <P>OpenExerciseBase aims to provide:</P>
            <UL items={[
              "A standardized representation of exercises",
              "A consistent schema for structured data",
              "Open access to exercise descriptions",
              "A transparent validation mechanism",
              "Traceable metadata and versioning",
            ]} />
            <P>Unlike many proprietary exercise databases, this project prioritizes:</P>
            <UL items={[
              "Openness",
              "Scientific neutrality",
              "Community contribution",
              "Professional oversight",
              "Long term extensibility",
            ]} />
            <P>The database is designed to be both human readable and machine actionable.</P>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* 4. Data Structure */}
          {/* ════════════════════════════════════════════ */}
          <Section id="data-structure" title="4. Exercise Data Structure">
            <P>Each exercise in the database follows a structured schema to ensure consistency and interoperability.</P>

            <H3 id="ds-basic">4.1 Basic Information</H3>
            <P>Includes:</P>
            <UL items={[
              "Unique identifier",
              "Name",
              "Categories",
              "Targeted body parts",
              "Required equipment",
              "Location context",
            ]} />
            <P>Categories include:</P>
            <UL items={[
              "Endurance",
              "Strength and resistance",
              "Flexibility and mobility",
              "Balance and coordination",
              "Relaxation and breathing",
            ]} />
            <P>This structure enables filtering, searching, and integration into external systems. It is extensible to accommodate future classifications.</P>

            <H3 id="ds-instructions">4.2 Instructions</H3>
            <P>Instructions are organized as a sequence of clearly defined steps.</P>
            <P>Each step includes:</P>
            <UL items={["Step number", "Description of the movement"]} />
            <P>Instructions must:</P>
            <UL items={[
              "Be sequential",
              "Be biomechanically clear",
              "Avoid ambiguity",
              "Avoid unsafe cues",
              "Avoid unsupported medical claims",
            ]} />

            <H3 id="ds-metrics">4.3 Performance Metrics</H3>
            <P>Performance metrics describe how the exercise may be measured.</P>
            <P>These do not prescribe values. Instead, they define measurable dimensions such as:</P>
            <UL items={[
              "Number of repetitions",
              "Duration",
              "Distance",
              "Load or resistance",
              "Heart rate targets",
              "Physiological parameters",
            ]} />
            <P>This enables integration into tracking systems, research protocols, and digital monitoring platforms.</P>

            <H3 id="ds-variations">4.4 Variations and Relationships</H3>
            <P>Two separate fields describe how an exercise relates to others.</P>
            <UL items={[
              "Relationships are typed, machine readable links to other exercises: variation of, progression of, regression of, similar to, or replacement for. When the related exercise is not in the database yet, a relationship can name it as a suggestion instead of linking to an ID.",
              "Variations are short free text descriptions of ways to change the exercise, for example an easier, harder, or equipment free version. They do not link to other exercises.",
            ]} />
            <P>This supports structured linking between related exercises and enables interoperability across systems.</P>

            <H3 id="ds-media">4.5 Media Content</H3>
            <P>Exercises may include:</P>
            <UL items={[
              "One or more instructional images",
              "Files stored using a standardized folder structure",
              "Image references linked within the JSON representation",
            ]} />
            <P>Images are intended to be:</P>
            <UL items={[
              "Educational",
              "Neutral",
              "Biomechanically accurate",
              "Free of branding or promotional elements",
            ]} />

            <H3 id="ds-metadata">4.6 Metadata and Review Tracking</H3>
            <P>Each exercise includes metadata for transparency and traceability.</P>
            <P>Metadata includes:</P>
            <UL items={[
              "Created by",
              "Review status",
              "Reviewed by",
              "Date reviewed",
              "Review notes",
              "Date created",
              "Last updated",
              "Last edited by",
              "Deduplication status",
            ]} />
            <P>Review statuses include:</P>
            <UL items={["Unreviewed", "Accepted", "Accepted with edits", "Rejected"]} />
            <P>This structure ensures accountability, reproducibility, and auditability.</P>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* 5. Contribution Model */}
          {/* ════════════════════════════════════════════ */}
          <Section id="contribution-model" title="5. Contribution Model">
            <P>The database operates under an open contribution model.</P>
            <P>Anyone can:</P>
            <UL items={[
              "Submit new exercises",
              "Suggest edits or improvements",
              "Contribute variations",
            ]} />
            <P>Submissions are stored in the community branch and undergo professional review before validation.</P>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* 6. Review Model */}
          {/* ════════════════════════════════════════════ */}
          <Section id="review-model" title="6. Professional Review Model">
            <P>Validated exercises are reviewed by verified professionals.</P>
            <P>Reviewers assess:</P>
            <UL items={[
              "Safety and biomechanical soundness",
              "Clarity of instructions",
              "Structural consistency",
              "Scientific neutrality",
              "Duplication and overlap",
            ]} />
            <P>Validation indicates that a qualified professional has reviewed the exercise for clarity and safety.</P>
            <P>Validation does not constitute medical advice, individualized prescription, or clinical recommendation.</P>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* 7. Use Cases */}
          {/* ════════════════════════════════════════════ */}
          <Section id="use-cases" title="7. Use Cases">
            <P>OpenExerciseBase can be used for:</P>

            <H3>Research</H3>
            <UL items={[
              "Standardized exercise representation in studies",
              "Structured datasets for physical activity research",
              "Machine learning applications",
              "Behavior change intervention modeling",
            ]} />

            <H3>Digital Health Applications</H3>
            <UL items={[
              "Exercise recommendation engines",
              "Rehabilitation platforms",
              "Remote monitoring systems",
              "Personalized coaching systems",
            ]} />
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* 8. AI Integration */}
          {/* ════════════════════════════════════════════ */}
          <Section id="ai-integration" title="8. Artificial Intelligence Integration">
            <P>The platform supports AI assisted drafting of exercises.</P>
            <P>AI may be used to:</P>
            <UL items={[
              "Generate structured exercise descriptions",
              "Draft instructional text",
              "Generate neutral instructional images",
            ]} />
            <P>All AI generated exercises remain clearly labeled and require professional validation before being marked as validated.</P>
            <P>AI supports the workflow but does not replace human oversight.</P>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* 9. Scope */}
          {/* ════════════════════════════════════════════ */}
          <Section id="scope-limitations" title="9. Scope and Limitations">
            <P>The database provides structured exercise descriptions for educational and research purposes.</P>
            <P>It does not:</P>
            <UL items={[
              "Provide individualized medical prescriptions",
              "Replace professional clinical judgment",
              "Guarantee specific health outcomes",
              "Serve as medical advice",
            ]} />
            <P>Users are responsible for applying exercises appropriately within their professional or personal context.</P>
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* 10. Versioning */}
          {/* ════════════════════════════════════════════ */}
          <Section id="versioning" title="10. Versioning and Transparency">
            <P>All exercises are version controlled via GitHub.</P>
            <P>Changes are traceable. Review actions are recorded. Metadata provides historical context for every modification.</P>
            <P>This ensures:</P>
            <UL items={["Transparency", "Accountability", "Scientific reproducibility"]} />
          </Section>

          {/* ════════════════════════════════════════════ */}
          {/* Appendix A */}
          {/* ════════════════════════════════════════════ */}
          <Section id="appendix-a" title="Appendix A: Data Schema Specification">
            <P>This appendix defines the structured representation used in OpenExerciseBase. The schema is designed to be machine readable, consistent across entries, and extensible over time.</P>
            <P>All exercises are stored as individual JSON objects using a standardized structure.</P>

            <H3 id="a1">A.1 Top Level Structure</H3>
            <P>Each exercise is represented as a JSON object with the following top level fields:</P>
            <Code>{`{
  "id": "string",
  "name": "string",
  "categories": ["string"],
  "exerciseEffects": ["string"],
  "bodyParts": ["string"],
  "equipment": ["string"],
  "location": ["string"],
  "instructions": [InstructionStep],
  "performanceMetrics": [PerformanceMetric],
  "variations": [Variation],
  "relationships": [Relationship],
  "mediaContent": MediaContent,
  "metadata": Metadata,
  "commentsNotes": ["string"]
}`}</Code>
            <P>All fields must be present unless explicitly stated as optional.</P>

            <H3 id="a2">A.2 Field Specifications</H3>

            <H4>A.2.1 id</H4>
            <P>Type: <code>string</code><br />Required: yes<br />Format: <code>{`EX<slug><unique_string>`}</code> or <code>{`EX<number>`}</code></P>
            <P>Unique identifier for the exercise. It must not collide with any existing exercise. The identifier is immutable once created.</P>
            <P>Example:</P>
            <Code>EX_glute_bridge_01HZY3Q7Z3W8K2QFJ6V9B1T8M4</Code>

            <H4>A.2.2 name</H4>
            <P>Type: <code>string</code><br />Required: yes</P>
            <P>Human readable name of the exercise.</P>
            <P>Example: <code>Glute Bridge</code></P>

            <H4>A.2.3 categories</H4>
            <P>Type: <code>array of strings</code><br />Required: yes</P>
            <P>Allowed values:</P>
            <UL items={[
              "Endurance",
              "Strength and resistance",
              "Flexibility and mobility",
              "Balance and coordination",
              "Relaxation and breathing",
            ]} />
            <P>Defines the primary classification of the exercise. Multiple categories are allowed. This field is extensible.</P>

            <H4>A.2.4 exerciseEffects</H4>
            <P>Type: <code>array of strings</code><br />Required: yes</P>
            <P>Describes intended physiological or functional effects. Effects must remain neutral and avoid exaggerated or unsupported claims.</P>
            <P>Examples:</P>
            <UL items={[
              "increased muscle strength",
              "improved body balance",
              "improved range of motion",
              "increased heart rate",
              "stretch muscle",
            ]} />
            <P>This field is extensible.</P>

            <H4>A.2.5 bodyParts</H4>
            <P>Type: <code>array of strings</code><br />Required: yes</P>
            <P>Specifies primary targeted muscle groups or body regions. Multiple entries are allowed.</P>
            <P>Examples: <code>glutes</code>, <code>hamstrings</code>, <code>quadriceps</code>, <code>core</code>, <code>shoulders</code></P>
            <P>This field is extensible.</P>

            <H4>A.2.6 equipment</H4>
            <P>Type: <code>array of strings</code><br />Required: yes (may be an empty array)</P>
            <P>Lists equipment required to perform the exercise. If no equipment is required, use an empty array.</P>
            <P>Examples: <code>exercise mat</code>, <code>resistance band</code>, <code>dumbbell</code>, <code>barbell</code></P>
            <P>This field is extensible.</P>

            <H4>A.2.7 location</H4>
            <P>Type: <code>array of strings</code><br />Required: yes</P>
            <P>Allowed values: <code>indoor</code>, <code>outdoor</code>. Multiple values are allowed.</P>

            <H3 id="a3">A.3 Instructions Structure</H3>

            <H4>A.3.1 instructions</H4>
            <P>Type: <code>array of InstructionStep</code><br />Required: yes</P>
            <P>Structure:</P>
            <Code>{`{
  "stepNumber": number,
  "description": "string"
}`}</Code>
            <P>Requirements:</P>
            <UL items={[
              "stepNumber must be sequential starting from 1",
              "description must clearly describe movement execution",
              "Unsafe cues must be avoided",
              "Medical claims must not be included",
            ]} />
            <P>Example:</P>
            <Code>{`{
  "stepNumber": 1,
  "description": "Lie on your back with knees bent and feet flat on the floor."
}`}</Code>

            <H3 id="a4">A.4 Performance Metrics</H3>

            <H4>A.4.1 performanceMetrics</H4>
            <P>Type: <code>array of PerformanceMetric</code><br />Required: yes</P>
            <P>Structure:</P>
            <Code>{`{
  "type": "string",
  "unit": "string",
  "notes": "string"
}`}</Code>
            <P>Defines how the exercise may be measured. The schema specifies measurement dimensions rather than prescribed values.</P>
            <P>Examples of types:</P>
            <UL items={[
              "Number of repetitions",
              "Duration",
              "Distance",
              "Weight or resistance",
              "Heart rate goal",
              "Physiological parameters",
            ]} />
            <P>This field is extensible.</P>

            <H3 id="a5">A.5 Variations and Relationships</H3>

            <H4>A.5.1 relationships</H4>
            <P>Type: <code>array of Relationship</code><br />Required: yes (may be empty)</P>
            <P>A relationship is either a link to an existing exercise:</P>
            <Code>{`{
  "type": "string",
  "target": { "track": "string", "id": "string" },
  "note": "string"   // optional
}`}</Code>
            <P>or, when the related exercise does not exist in the database yet, a named suggestion:</P>
            <Code>{`{
  "type": "string",
  "targetName": "string",
  "note": "string"
}`}</Code>
            <P>Allowed values for <code>type</code>:</P>
            <UL items={["variation_of", "progression_of", "regression_of", "similar_to", "replacement_for"]} />
            <P>The type reads from this exercise to the target, for example <code>progression_of</code> means this exercise is a progression of the target. <code>track</code> is <code>validated</code> or <code>community</code>. A linked target must exist in the database.</P>

            <H4>A.5.2 variations</H4>
            <P>Type: <code>array of Variation</code><br />Required: yes (may be empty)</P>
            <P>Structure:</P>
            <Code>{`{
  "variationDescription": "string"
}`}</Code>
            <P>Free text descriptions of ways to modify this exercise. Variations do not reference other exercises. Use <code>relationships</code> for links.</P>

            <H3 id="a6">A.6 Media Content</H3>

            <H4>A.6.1 mediaContent</H4>
            <P>Type: <code>object</code><br />Required: yes</P>
            <P>Structure:</P>
            <Code>{`{
  "imageURLs": ["string"]
}`}</Code>
            <P>Lists image filenames associated with the exercise.</P>
            <P>Images must be stored under:</P>
            <Code>{`images/<exercise_id>/`}</Code>
            <P>Example:</P>
            <Code>{`"imageURLs": [
  "EX_00001_start.png",
  "EX_00001_top.png"
]`}</Code>

            <H3 id="a7">A.7 Metadata and Review Tracking</H3>

            <H4>A.7.1 metadata</H4>
            <P>Type: <code>object</code><br />Required: yes</P>
            <P>Structure:</P>
            <Code>{`{
  "createdBy": "string",
  "reviewStatus": "string",
  "reviewedBy": ["string"],
  "dateReviewed": "string | null",
  "reviewNotes": "string",
  "dateCreated": "string",
  "lastUpdated": "string",
  "lastEditedBy": "string",
  "duplicateOf": "string | null"
}`}</Code>

            <H4>A.7.1.1 createdBy</H4>
            <P>Allowed values:</P>
            <UL items={[
              "professional",
              "ai generated",
              "community,<name>,<email>: submitted through the platform by a community contributor",
              "community co-created with AI,<name>,<email>: submitted by a contributor who started from an AI generated draft",
            ]} />
            <P>For community submissions the value has three comma separated parts: the origin, the contributor name, and the contributor email. Commas are removed from the name and email.</P>

            <H4>A.7.1.2 reviewStatus</H4>
            <P>Allowed values:</P>
            <UL items={["unreviewed", "accepted", "accepted_with_edits", "rejected"]} />
            <P><code>unreviewed</code>: submitted and not yet reviewed. <code>accepted</code>: reviewed and accepted as written. <code>accepted_with_edits</code>: reviewed, edited by the reviewer, then accepted. <code>rejected</code>: reviewed and not accepted, including exercises marked as duplicates (see <code>duplicateOf</code>).</P>

            <H4>A.7.1.3 reviewedBy</H4>
            <P>Array of GitHub usernames who performed validation.</P>

            <H4>A.7.1.4 dateReviewed</H4>
            <P>Format: <code>YYYY MM DD</code>. Null if not yet reviewed.</P>

            <H4>A.7.1.5 reviewNotes</H4>
            <P>Free text summary of review decision.</P>

            <H4>A.7.1.6 dateCreated</H4>
            <P>Format: <code>YYYY MM DD</code></P>

            <H4>A.7.1.7 lastUpdated</H4>
            <P>Format: <code>YYYY MM DD</code></P>

            <H4>A.7.1.8 lastEditedBy</H4>
            <P>GitHub username of last editor.</P>

            <H4>A.7.1.10 duplicateOf</H4>
            <P>String ID of canonical exercise if marked duplicate. Null otherwise.</P>

            <H3 id="a8">A.8 Comments and Notes</H3>

            <H4>A.8.1 commentsNotes</H4>
            <P>Type: <code>array of strings</code><br />Required: yes (may be empty)</P>
            <P>Contains additional tips, warnings, or clarifications.</P>
            <P>Examples:</P>
            <UL items={[
              "If wrist discomfort occurs, modify hand position.",
              "Warm up before starting to reduce injury risk.",
            ]} />
            <P>Statements must remain neutral and avoid medical prescription.</P>

            <H3 id="a10">A.10 Extensibility</H3>
            <P>The schema is designed to be extensible. Future extensions may include:</P>
            <UL items={[
              "Difficulty level",
              "Estimated metabolic intensity",
              "Contraindications",
              "Population tags",
              "Evidence references",
              "Video content",
              "Multilingual support",
            ]} />
            <P>Backward compatibility must be preserved when extending the schema.</P>
          </Section>

          {/* Footer */}
          <div className="mt-16 border-t border-gray-200 pt-8 pb-6 flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              Home
            </Link>
            <p className="text-[12px] text-gray-400">OpenExerciseBase Documentation</p>
          </div>
        </article>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════ */
/* Reusable components                                                     */
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

function H4({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[14px] font-semibold text-gray-800 mt-5 mb-1.5">{children}</h4>;
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

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="my-3 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-[13px] leading-relaxed text-gray-800 font-mono">
      <code>{children}</code>
    </pre>
  );
}
