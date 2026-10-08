import ExampleExerciseCard from "./ExampleExerciseCard";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-bg">
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:pt-24 lg:pb-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left column */}
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
              OpenExerciseBase
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-gray-600">
              An open, evolving infrastructure for structured exercise knowledge.
            </p>
            <p className="mt-4 text-base leading-relaxed text-gray-500">
              OpenExerciseBase supports the contribution, revision, professional
              validation, and reuse of machine-readable exercise knowledge across
              research, rehabilitation, digital health, and other applications.
            </p>
            <p className="mt-4 text-lg font-medium text-primary">
              A collaborative, structured, and extendable exercise repository for everyone!
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/explore"
                className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
              >
                Browse exercises
              </a>
              <a
                href="/contribution-guidelines"
                className="inline-flex items-center rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary transition-colors"
              >
                Learn how to contribute
              </a>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <TrustIndicator
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                }
                label="Free and open to use"
              />
              <TrustIndicator
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                }
                label="Structured and extendable"
              />
              <TrustIndicator
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                }
                label="Machine readable with API access"
              />
              <TrustIndicator
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                }
                label="Community powered"
              />
            </div>
          </div>

          {/* Right column: exercise card previews */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary-light/30 via-transparent to-primary/5 blur-2xl" />
            <div className="relative space-y-4">
              <ExampleExerciseCard
                name="Chair Squats"
                tags={["Strength", "Lower body", "No equipment"]}
                status="Validated"
              />
              <ExampleExerciseCard
                name="Wall Push Ups"
                tags={["Strength", "Upper body", "No equipment"]}
                status="Validated"
              />
              <ExampleExerciseCard
                name="Ankle Mobility Circles"
                tags={["Mobility", "Lower body", "No equipment"]}
                status="Community"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustIndicator({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-500 leading-tight">
        {label}
      </span>
    </div>
  );
}
