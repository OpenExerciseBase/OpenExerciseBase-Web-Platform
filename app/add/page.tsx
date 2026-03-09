import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const options = [
  {
    title: "Create with a form",
    description:
      "Use a structured editor to add one exercise at a time using guided inputs.",
    bullets: [
      "Best for most contributors",
      "Step by step validation",
      "Live preview before submission",
    ],
    button: "Start form entry",
    href: "/add/form",
    icon: (
      <svg
        className="h-8 w-8 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        />
      </svg>
    ),
  },
  {
    title: "Co create with AI",
    description:
      "Generate a draft exercise using AI, then review and modify it before submitting.",
    bullets: [
      "Fast way to create a draft",
      "Full control over editing",
    ],
    button: "Start with AI",
    href: "/add/ai",
    icon: (
      <svg
        className="h-8 w-8 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      </svg>
    ),
  },
  {
    title: "Upload JSON file",
    description:
      "Upload or paste a structured JSON file that follows the exercise schema.",
    bullets: [
      "Ideal for advanced users",
      "Bulk ready workflow",
      "Instant structure validation",
    ],
    button: "Upload JSON",
    href: "/add/import",
    icon: (
      <svg
        className="h-8 w-8 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
    ),
  },
  {
    title: "Start from an existing exercise",
    description:
      "Use an existing exercise as a template to create a new variation, progression, or modification.",
    bullets: [
      "Build on proven exercises",
      "Prefilled form fields",
      "Full control to customize",
    ],
    button: "Select exercise",
    href: "/add/from-existing",
    icon: (
      <svg
        className="h-8 w-8 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
        />
      </svg>
    ),
  },
];

export default function AddExercisePage() {
  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Add an exercise
        </h1>

        {/* Callout */}
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/60 px-6 py-5">
          <p className="text-sm leading-relaxed text-red-900 font-medium">
            Before contributing, please read our contribution guidelines to
            understand content requirements, safety principles, and review
            process.
          </p>
          <Link
            href="/contribution-guidelines"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
          >
            Read contribution guidelines
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>

        {/* Option cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {options.map((opt) => (
            <Link
              key={opt.title}
              href={opt.href}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                {opt.icon}
              </div>

              <h2 className="mt-5 text-lg font-bold text-gray-900">
                {opt.title}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {opt.description}
              </p>

              <ul className="mt-4 space-y-2 flex-1">
                {opt.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <span className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm group-hover:bg-primary-deep transition-colors">
                  {opt.button}
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom info */}
        <div className="mt-16 flex justify-center">
          <div className="max-w-lg rounded-2xl bg-white border border-gray-200 px-8 py-8 text-center shadow-sm">
            <h3 className="text-base font-bold text-gray-900">
              Where your submission goes
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              New submissions are added to the community track. Professionals
              review selected entries and promote approved exercises to the
              validated track.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
