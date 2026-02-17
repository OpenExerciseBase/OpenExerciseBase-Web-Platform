"use client";

import type { ExerciseFormState } from "../types";

interface Props {
  form: ExerciseFormState;
  onChange: (patch: Partial<ExerciseFormState>) => void;
  onRefreshId: () => void;
}

export default function IdentitySection({
  form,
  onChange,
  onRefreshId,
}: Props) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Identity</h2>

      {/* Name field — shown first since ID is derived from it */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Exercise name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Glute Bridge"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
        <p className="mt-1 text-xs text-gray-400">
          Use a clear, commonly recognized name. The exercise ID will be generated from this.
        </p>
      </div>

      {/* ID field — read only, generated from name */}
      <div className="mt-5">
        <label className="block text-sm font-medium text-gray-700">
          Exercise ID
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={form.id || (form.name.trim() ? "Generating..." : "Enter a name first")}
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(form.id)}
            disabled={!form.id}
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            title="Copy ID"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRefreshId}
            disabled={!form.name.trim()}
            className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
          >
            Regenerate ID
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Auto generated from the exercise name. Click Regenerate ID to get a new unique identifier.
        </p>
      </div>
    </section>
  );
}
