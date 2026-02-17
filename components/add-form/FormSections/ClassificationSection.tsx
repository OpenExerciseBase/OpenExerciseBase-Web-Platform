"use client";

import type { ExerciseFormState } from "../types";
import { CATEGORY_OPTIONS, EFFECT_OPTIONS, LOCATION_OPTIONS } from "../types";
import { formatSnakeCase } from "../helpers";

interface Props {
  form: ExerciseFormState;
  onChange: (patch: Partial<ExerciseFormState>) => void;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export default function ClassificationSection({ form, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Classification</h2>

      {/* Categories */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Categories <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((cat) => {
            const active = form.categories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onChange({ categories: toggle(form.categories, cat) })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {formatSnakeCase(cat)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise effects */}
      <div className="mt-5">
        <label className="block text-sm font-medium text-gray-700">
          Exercise effects <span className="text-xs text-gray-400">(recommended)</span>
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {EFFECT_OPTIONS.map((eff) => {
            const active = form.exerciseEffects.includes(eff);
            return (
              <button
                key={eff}
                type="button"
                onClick={() =>
                  onChange({ exerciseEffects: toggle(form.exerciseEffects, eff) })
                }
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {formatSnakeCase(eff)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div className="mt-5">
        <label className="block text-sm font-medium text-gray-700">
          Location <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 flex gap-3">
          {LOCATION_OPTIONS.map((loc) => {
            const active = form.location.includes(loc);
            return (
              <label
                key={loc}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onChange({ location: toggle(form.location, loc) })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700 capitalize">{loc}</span>
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}
