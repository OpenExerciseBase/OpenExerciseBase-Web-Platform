import type { Bucket } from "./types";

interface Props {
  items: Bucket[];
  color?: string;
  emptyText?: string;
  formatValue?: (b: Bucket) => string;
}

export default function BarList({ items, color = "#0d9488", emptyText = "No data yet.", formatValue }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-400">{emptyText}</p>;
  }
  const max = Math.max(...items.map((i) => i.pct), 0.0001);
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="capitalize text-gray-700">{item.label}</span>
            <span className="shrink-0 font-medium text-gray-900">
              {formatValue ? formatValue(item) : `${Math.round(item.pct * 100)}%`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(item.pct / max) * 100}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
