export default function Governance() {
  return (
    <section id="governance" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Validation and governance
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            To balance openness with data quality, OpenExerciseBase
            maintains two clearly separated tracks.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {/* Community track */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <span className="h-3 w-3 rounded-full bg-community" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Community exercises
              </h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Exercises contributed by the community that follow the shared
              structure but have not yet undergone professional validation. These
              entries remain openly visible and versioned.
            </p>
          </div>

          {/* Validated track */}
          <div className="rounded-2xl border border-green-200 bg-green-50/40 p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <span className="h-3 w-3 rounded-full bg-validated" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Validated exercises
              </h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Exercises that have undergone professional review and have been
              approved according to the OpenExerciseBase review process. Their
              validated status is recorded explicitly and remains distinct from
              their provenance or method of creation.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Both tracks are publicly accessible and maintained with full
          transparency.
        </p>
      </div>
    </section>
  );
}
