export default function ContributionSummary() {
  const steps = [
    {
      number: "1",
      title: "Submit an exercise",
      description:
        "Contributors propose a new exercise or improvement using a shared structured format.",
    },
    {
      number: "2",
      title: "Community collection",
      description:
        "The exercise is added to the community collection and becomes openly visible.",
    },
    {
      number: "3",
      title: "Professional review",
      description:
        "Selected entries are reviewed by professionals for accuracy, safety, and clarity.",
    },
    {
      number: "4",
      title: "Validated promotion",
      description:
        "Approved exercises are promoted to the validated collection.",
    },
  ];

  return (
    <section id="contribute" className="bg-bg py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How contributions work
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm h-full">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {step.number}
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="/contribution-guidelines"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-deep transition-colors"
          >
            Read the full contribution guide
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
          </a>
        </div>
      </div>
    </section>
  );
}
