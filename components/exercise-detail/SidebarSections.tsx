import Link from "next/link";

interface ChipListProps {
  title: string;
  items: string[];
  emptyText?: string;
  color?: "teal" | "gray";
}

function ChipList({ title, items, emptyText, color = "teal" }: ChipListProps) {
  const chipClass =
    color === "teal"
      ? "bg-primary/10 text-primary"
      : "bg-gray-100 text-gray-700";

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${chipClass}`}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        emptyText && (
          <p className="text-sm text-gray-500">{emptyText}</p>
        )
      )}
    </section>
  );
}

export function EffectsSection({ effects }: { effects: string[] }) {
  return <ChipList title="Exercise effects" items={effects} />;
}

export function BodyPartsSection({ bodyParts }: { bodyParts: string[] }) {
  return <ChipList title="Targeted body parts" items={bodyParts} />;
}

export function EquipmentSection({ equipment }: { equipment: string[] }) {
  const items = equipment.length > 0 ? equipment : ["No equipment"];
  return <ChipList title="Equipment" items={items} color="gray" />;
}

interface Variation {
  id?: string;
  variationDescription?: string;
  level?: string;
  description?: string;
}

export function VariationsSection({
  variations,
  currentTrack,
}: {
  variations: (Variation | string)[];
  currentTrack?: string;
}) {
  const track = currentTrack ?? "validated";

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-3">Variations</h2>
      {!variations || variations.length === 0 ? (
        <p className="text-sm text-gray-500">
          No variations have been added yet.
        </p>
      ) : (
        <div className="space-y-2">
          {variations.map((v, i) => {
            if (typeof v === "string") {
              return (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <p className="text-sm text-gray-700">{v}</p>
                </div>
              );
            }
            const label =
              v.variationDescription || v.description || "Unnamed variation";
            const level = v.level;
            const hasLink = !!v.id;

            const card = (
              <div
                className={`rounded-xl border bg-white px-4 py-3 transition-colors ${
                  hasLink
                    ? "border-gray-200 hover:border-primary/40 hover:bg-primary/[0.02] group cursor-pointer"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {level && (
                      <span className="mb-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {level}
                      </span>
                    )}
                    <p className={`text-sm text-gray-700 ${hasLink ? "group-hover:text-primary" : ""}`}>
                      {label}
                    </p>
                  </div>
                  {hasLink && (
                    <span className="shrink-0 mt-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {v.id}
                    </span>
                  )}
                </div>
              </div>
            );

            if (hasLink) {
              return (
                <Link
                  key={i}
                  href={`/exercises/${v.id}?track=${track}`}
                  className="block"
                >
                  {card}
                </Link>
              );
            }

            return <div key={i}>{card}</div>;
          })}
        </div>
      )}
    </section>
  );
}
