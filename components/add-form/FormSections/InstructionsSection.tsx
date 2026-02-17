"use client";

import type { ExerciseFormState, InstructionStep } from "../types";

interface Props {
  form: ExerciseFormState;
  onChange: (patch: Partial<ExerciseFormState>) => void;
}

export default function InstructionsSection({ form, onChange }: Props) {
  const steps = form.instructions;

  const update = (idx: number, desc: string) => {
    const next = steps.map((s, i) =>
      i === idx ? { ...s, description: desc } : s
    );
    onChange({ instructions: next });
  };

  const add = () => {
    onChange({
      instructions: [
        ...steps,
        { stepNumber: steps.length + 1, description: "" },
      ],
    });
  };

  const remove = (idx: number) => {
    if (steps.length <= 2) return;
    const next = steps
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, stepNumber: i + 1 }));
    onChange({ instructions: next });
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({
      instructions: next.map((s, i) => ({ ...s, stepNumber: i + 1 })),
    });
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Instructions</h2>
      <p className="mt-1 text-xs text-gray-400">
        Minimum 2 steps required. Describe each step clearly.
      </p>

      <div className="mt-4 space-y-3">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
              {idx + 1}
            </span>
            <textarea
              value={step.description}
              onChange={(e) => update(idx, e.target.value)}
              placeholder={`Step ${idx + 1} description`}
              rows={2}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                title="Move up"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === steps.length - 1}
                className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                title="Move down"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => remove(idx)}
                disabled={steps.length <= 2}
                className="rounded p-1 text-gray-400 hover:text-red-500 disabled:opacity-30"
                title="Remove step"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add step
      </button>
    </section>
  );
}
