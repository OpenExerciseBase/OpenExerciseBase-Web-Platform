"use client";

import type { ExerciseFormState } from "../types";

interface Props {
  form: ExerciseFormState;
  onChange: (patch: Partial<ExerciseFormState>) => void;
}

export default function VariationsSection({ form, onChange }: Props) {
  const variations = form.variations;

  const update = (idx: number, variationDescription: string) => {
    onChange({ variations: variations.map((v, i) => (i === idx ? { variationDescription } : v)) });
  };
  const add = () => onChange({ variations: [...variations, { variationDescription: "" }] });
  const remove = (idx: number) => onChange({ variations: variations.filter((_, i) => i !== idx) });

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Variations</h2>
      <p className="mt-1 text-xs text-gray-400">
        Optional. Describe ways to change this exercise in plain text, for example an easier,
        harder or equipment-free version. To link to another exercise in the database, use
        Relationships below.
      </p>

      <div className="mt-4 space-y-3">
        {variations.map((v, idx) => (
          <div key={idx} className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">Variation description</label>
              <input
                type="text"
                value={v.variationDescription}
                onChange={(e) => update(idx, e.target.value)}
                placeholder="e.g. Single leg version targeting balance"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <button type="button" onClick={() => remove(idx)} className="mt-5 shrink-0 rounded p-1 text-gray-400 hover:text-red-500" title="Remove">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Add variation
      </button>
    </section>
  );
}
