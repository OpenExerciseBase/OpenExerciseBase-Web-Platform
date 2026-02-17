export default function LoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white overflow-hidden"
        >
          <div className="h-48 bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-16 rounded-full bg-gray-200" />
            <div className="h-5 w-3/4 rounded bg-gray-200" />
            <div className="flex gap-2">
              <div className="h-4 w-20 rounded-full bg-gray-200" />
              <div className="h-4 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="h-4 w-1/2 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
