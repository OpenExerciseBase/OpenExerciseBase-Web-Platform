import Link from "next/link";

interface Metadata {
  createdBy?: string;
  reviewStatus?: string;
  reviewedBy?: string[];
  dateReviewed?: string | null;
  reviewNotes?: string;
  dateCreated?: string;
  lastUpdated?: string;
  lastEditedBy?: string;
  dedupStatus?: string;
  duplicateOf?: { track?: string; id?: string } | string | null;
}

interface MetadataSectionProps {
  metadata: Metadata;
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not available";
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "None";
  }
  return String(value);
}

const DISPLAY_KEYS: Array<{ key: keyof Metadata; label: string }> = [
  { key: "createdBy", label: "Created by" },
  { key: "reviewStatus", label: "Review status" },
  { key: "reviewedBy", label: "Reviewed by" },
  { key: "dateReviewed", label: "Date reviewed" },
  { key: "reviewNotes", label: "Review notes" },
  { key: "dateCreated", label: "Date created" },
  { key: "lastUpdated", label: "Last updated" },
  { key: "lastEditedBy", label: "Last edited by" },
  { key: "dedupStatus", label: "Dedup status" },
];

export default function MetadataSection({ metadata }: MetadataSectionProps) {
  if (!metadata) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Metadata</h2>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <dl className="divide-y divide-gray-100">
          {DISPLAY_KEYS.map(({ key, label }) => {
            const value = metadata[key];
            if (value === undefined) return null;
            return (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-baseline px-4 py-2.5 gap-1 sm:gap-4"
              >
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide sm:w-40 shrink-0">
                  {label}
                </dt>
                <dd className="text-sm text-gray-800">
                  {formatValue(value)}
                </dd>
              </div>
            );
          })}

          {metadata.duplicateOf && (
            <div className="flex flex-col sm:flex-row sm:items-baseline px-4 py-2.5 gap-1 sm:gap-4">
              <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide sm:w-40 shrink-0">
                Duplicate of
              </dt>
              <dd className="text-sm text-gray-800">
                {typeof metadata.duplicateOf === "string" ? (
                  metadata.duplicateOf
                ) : (
                  <Link
                    href={`/exercises/${metadata.duplicateOf.id}?track=${metadata.duplicateOf.track ?? "validated"}`}
                    className="font-medium text-primary hover:text-primary-deep transition-colors"
                  >
                    {metadata.duplicateOf.id}
                  </Link>
                )}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
