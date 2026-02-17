"use client";

import { useState } from "react";
import type { ExerciseFormState } from "../types";

interface Props {
  form: ExerciseFormState;
  onChange: (patch: Partial<ExerciseFormState>) => void;
}

export default function NotesSection({ form, onChange }: Props) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v) {
      onChange({ commentsNotes: [...form.commentsNotes, v] });
    }
    setInput("");
  };

  const remove = (idx: number) => {
    onChange({ commentsNotes: form.commentsNotes.filter((_, i) => i !== idx) });
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Notes</h2>
      <p className="mt-1 text-xs text-gray-400">Optional. Add any comments or notes about this exercise.</p>

      {form.commentsNotes.length > 0 && (
        <div className="mt-3 space-y-2">
          {form.commentsNotes.map((note, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2"
            >
              <span className="flex-1 text-sm text-gray-700">{note}</span>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="shrink-0 rounded p-1 text-gray-400 hover:text-red-500"
                title="Remove"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Add a note"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Add
        </button>
      </div>
    </section>
  );
}
