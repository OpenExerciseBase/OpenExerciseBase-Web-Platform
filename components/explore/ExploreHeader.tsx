interface ExploreHeaderProps {
  validatedCount: number;
  communityCount: number;
  includeCommunity: boolean;
  onToggleCommunity: (value: boolean) => void;
  communityError: boolean;
}

export default function ExploreHeader({
  validatedCount,
  communityCount,
  includeCommunity,
  onToggleCommunity,
  communityError,
}: ExploreHeaderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Explore exercises
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Browse validated exercises and community contributions.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Track toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleCommunity(!includeCommunity)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              includeCommunity ? "bg-primary" : "bg-gray-300"
            }`}
            role="switch"
            aria-checked={includeCommunity}
            aria-label="Include community exercises"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                includeCommunity ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700">
            Include community
          </span>
        </div>

        {/* Counts */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {validatedCount} validated
          </span>
          {includeCommunity && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {communityCount} community
            </span>
          )}
        </div>
      </div>

      {communityError && includeCommunity && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Community exercises could not be loaded at this time. Showing validated exercises only.
        </div>
      )}
    </div>
  );
}
