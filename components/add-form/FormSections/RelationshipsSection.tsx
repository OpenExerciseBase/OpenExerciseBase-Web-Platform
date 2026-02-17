"use client";

import type {
  ExerciseFormState,
  Relationship,
} from "../types";
import {
  RELATIONSHIP_TYPE_OPTIONS,
  TRACK_OPTIONS,
} from "../types";
import { formatSnakeCase } from "../helpers";

interface Props {
  form: ExerciseFormState;
  onChange: (patch: Partial<ExerciseFormState>) => void;
}

export default function RelationshipsSection({ form, onChange }: Props) {
  const rels = form.relationships;

  /* ── Relationships ── */
  const updateRel = (idx: number, patch: Partial<Relationship>) => {
    const next = rels.map((r, i) => {
      if (i !== idx) return r;
      return {
        ...r,
        ...patch,
        target: { ...r.target, ...(patch.target ?? {}) },
      };
    });
    onChange({ relationships: next });
  };

  const addRel = () => {
    onChange({
      relationships: [
        ...rels,
        {
          type: RELATIONSHIP_TYPE_OPTIONS[0],
          target: { track: "community", id: "" },
        },
      ],
    });
  };

  const removeRel = (idx: number) => {
    onChange({ relationships: rels.filter((_, i) => i !== idx) });
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Relationships</h2>
      <p className="mt-1 text-xs text-gray-400">
        Optional. Link to existing exercises by type and ID.
      </p>

      {/* Relationships */}
      <h3 className="mt-5 text-sm font-semibold text-gray-700">
        Direct relationships
      </h3>
      <div className="mt-2 space-y-3">
        {rels.map((r, idx) => (
          <div
            key={idx}
            className="flex flex-wrap items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3"
          >
            <div className="w-full sm:w-44">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                Type
              </label>
              <select
                value={r.type}
                onChange={(e) => updateRel(idx, { type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
              >
                {RELATIONSHIP_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {formatSnakeCase(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-32">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                Track
              </label>
              <select
                value={r.target.track}
                onChange={(e) =>
                  updateRel(idx, { target: { ...r.target, track: e.target.value } })
                }
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
              >
                {TRACK_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {formatSnakeCase(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">
                Target ID
              </label>
              <input
                type="text"
                value={r.target.id}
                onChange={(e) =>
                  updateRel(idx, { target: { ...r.target, id: e.target.value } })
                }
                placeholder="e.g. EX-3"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => removeRel(idx)}
              className="mt-5 shrink-0 rounded p-1 text-gray-400 hover:text-red-500"
              title="Remove"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRel}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
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
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Add relationship
      </button>

    </section>
  );
}
