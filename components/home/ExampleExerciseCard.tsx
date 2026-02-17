interface ExampleExerciseCardProps {
  name: string;
  tags: string[];
  status: "Validated" | "Community";
}

export default function ExampleExerciseCard({
  name,
  tags,
  status,
}: ExampleExerciseCardProps) {
  const isValidated = status === "Validated";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm">{name}</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isValidated
              ? "bg-green-50 text-validated"
              : "bg-amber-50 text-community"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isValidated ? "bg-validated" : "bg-community"
            }`}
          />
          {status}
        </span>
      </div>
    </div>
  );
}
