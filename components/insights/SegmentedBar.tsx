import type { Bucket } from "./types";

const PALETTE = ["#0d9488", "#7dd3c0", "#d1d5db"];

interface Props {
  items: Bucket[];
  colors?: string[];
}

export default function SegmentedBar({ items, colors = PALETTE }: Props) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>;
  }
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {items.map((item, i) =>
          item.pct > 0 ? (
            <div key={item.label} style={{ width: `${item.pct * 100}%`, backgroundColor: colors[i % colors.length] }} />
          ) : null
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            {item.label} <span className="font-medium text-gray-900">{Math.round(item.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
