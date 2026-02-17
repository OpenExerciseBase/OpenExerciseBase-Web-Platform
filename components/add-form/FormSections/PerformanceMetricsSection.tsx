"use client";

import type { ExerciseFormState, PerformanceMetric } from "../types";
import { METRIC_TYPE_OPTIONS } from "../types";
import { formatSnakeCase } from "../helpers";

const CUSTOM_VALUE = "__custom__";

interface Props {
  form: ExerciseFormState;
  onChange: (patch: Partial<ExerciseFormState>) => void;
}

export default function PerformanceMetricsSection({ form, onChange }: Props) {
  const metrics = form.performanceMetrics;

  const update = (idx: number, patch: Partial<PerformanceMetric>) => {
    const next = metrics.map((m, i) => (i === idx ? { ...m, ...patch } : m));
    onChange({ performanceMetrics: next });
  };

  const add = () => {
    onChange({
      performanceMetrics: [
        ...metrics,
        { type: METRIC_TYPE_OPTIONS[0], unit: null, notes: null },
      ],
    });
  };

  const remove = (idx: number) => {
    onChange({ performanceMetrics: metrics.filter((_, i) => i !== idx) });
  };

  const isCustomType = (type: string) =>
    !(METRIC_TYPE_OPTIONS as readonly string[]).includes(type);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Performance metrics</h2>
      <p className="mt-1 text-xs text-gray-400">Optional. Define how this exercise is measured.</p>

      <div className="mt-4 space-y-3">
        {metrics.map((m, idx) => {
          const custom = isCustomType(m.type);
          return (
          <div key={idx} className="flex flex-wrap items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            <div className="w-full sm:w-auto sm:flex-1">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Type</label>
              <select
                value={custom ? CUSTOM_VALUE : m.type}
                onChange={(e) => {
                  if (e.target.value === CUSTOM_VALUE) {
                    update(idx, { type: "" });
                  } else {
                    update(idx, { type: e.target.value });
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
              >
                {METRIC_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {formatSnakeCase(t)}
                  </option>
                ))}
                <option value={CUSTOM_VALUE}>Custom type...</option>
              </select>
              {(custom || m.type === "") && (
                <input
                  type="text"
                  value={m.type}
                  onChange={(e) => update(idx, { type: e.target.value })}
                  placeholder="Enter custom type"
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
                  autoFocus
                />
              )}
            </div>
            <div className="w-full sm:w-auto sm:flex-1">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Unit</label>
              <input
                type="text"
                value={m.unit ?? ""}
                onChange={(e) => update(idx, { unit: e.target.value || null })}
                placeholder="e.g. meters, kg"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="w-full sm:w-auto sm:flex-1">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Notes</label>
              <input
                type="text"
                value={m.notes ?? ""}
                onChange={(e) => update(idx, { notes: e.target.value || null })}
                placeholder="Optional notes"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="mt-5 shrink-0 rounded p-1 text-gray-400 hover:text-red-500"
              title="Remove metric"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add metric
      </button>
    </section>
  );
}
