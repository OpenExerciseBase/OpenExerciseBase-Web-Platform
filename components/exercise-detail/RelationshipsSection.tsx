import Link from "next/link";

interface Relationship {
  type: string;
  target?: {
    track: string;
    id: string;
  };
  targetName?: string;
  note?: string;
}

const TYPE_LABELS: Record<string, string> = {
  variation_of: "Variation of",
  progression_of: "Progression of",
  regression_of: "Regression of",
  similar_to: "Similar to",
  replacement_for: "Replacement for",
};

function formatType(type: string): string {
  if (TYPE_LABELS[type]) return TYPE_LABELS[type];
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface RelationshipsSectionProps {
  relationships?: Relationship[];
}

export default function RelationshipsSection({
  relationships,
}: RelationshipsSectionProps) {
  const links = (relationships ?? []).filter((r) => r.target);
  const suggestions = (relationships ?? []).filter((r) => !r.target && r.targetName);

  if (links.length === 0 && suggestions.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Related exercises
      </h2>

      {links.length > 0 && (
        <div className="space-y-2 mb-6">
          {links.map((rel, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {formatType(rel.type)}
                </span>
                <Link
                  href={`/exercises/${rel.target!.id}?track=${rel.target!.track}`}
                  className="text-sm font-medium text-gray-900 hover:text-primary transition-colors"
                >
                  {rel.target!.id}
                </Link>
              </div>
              {rel.note && <p className="mt-1.5 text-xs text-gray-500">{rel.note}</p>}
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            Suggested relationships
          </h3>
          <div className="space-y-2">
            {suggestions.map((sug, i) => (
              <div
                key={i}
                className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {formatType(sug.type)}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {sug.targetName}
                  </span>
                </div>
                {sug.note && (
                  <p className="text-xs text-gray-500">{sug.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
