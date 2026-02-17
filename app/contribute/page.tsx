import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export default function ContributionGuidelinesPage() {
  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Contribution guidelines
        </h1>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <svg
              className="h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Coming soon
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
              Detailed contribution guidelines covering content requirements,
              safety principles, data formatting, and the review process will be
              published here shortly.
            </p>
            <Link
              href="/add"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
            >
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
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back to Add exercise
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
