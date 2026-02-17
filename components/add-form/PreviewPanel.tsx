"use client";

import type { ExerciseFormState } from "./types";
import { formatSnakeCase, todayISO } from "./helpers";

interface Props {
  form: ExerciseFormState;
}

/* ── Chips helper ── */
function Chips({ items, color = "teal" }: { items: string[]; color?: "teal" | "gray" }) {
  if (items.length === 0) return null;
  const cls =
    color === "teal"
      ? "bg-primary/10 text-primary"
      : "bg-gray-100 text-gray-700";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cls}`}
        >
          {formatSnakeCase(item)}
        </span>
      ))}
    </div>
  );
}

/* ── Section wrapper ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default function PreviewPanel({ form }: Props) {
  const today = todayISO();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {form.name || "Untitled exercise"}
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Community
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
            Community
          </span>
          {form.id && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
              {form.id}
            </span>
          )}
        </div>
      </div>

      {/* Categories */}
      {form.categories.length > 0 && (
        <Section title="Categories">
          <Chips items={form.categories} />
        </Section>
      )}

      {/* Location */}
      {form.location.length > 0 && (
        <Section title="Location">
          <Chips items={form.location} color="gray" />
        </Section>
      )}

      {/* Effects */}
      {form.exerciseEffects.length > 0 && (
        <Section title="Exercise effects">
          <Chips items={form.exerciseEffects} />
        </Section>
      )}

      {/* Body parts */}
      {form.bodyParts.length > 0 && (
        <Section title="Targeted body parts">
          <Chips items={form.bodyParts} />
        </Section>
      )}

      {/* Equipment */}
      <Section title="Equipment">
        {form.equipment.length > 0 ? (
          <Chips items={form.equipment} color="gray" />
        ) : (
          <span className="text-xs text-gray-500">No equipment</span>
        )}
      </Section>

      {/* Image gallery area */}
      {form.imageURLs.length > 0 && (
        <Section title="Images">
          <div className="grid grid-cols-3 gap-2">
            {form.imageURLs.map((name, i) => (
              <div
                key={i}
                className="flex flex-col items-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3"
              >
                <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span className="mt-1 text-[10px] text-gray-500 truncate max-w-full">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Instructions */}
      {form.instructions.some((s) => s.description.trim()) && (
        <Section title="Instructions">
          <ol className="space-y-2">
            {form.instructions
              .filter((s) => s.description.trim())
              .map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700">
                    {step.description}
                  </span>
                </li>
              ))}
          </ol>
        </Section>
      )}

      {/* Performance metrics */}
      {form.performanceMetrics.length > 0 && (
        <Section title="Performance metrics">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Unit</th>
                  <th className="pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {form.performanceMetrics.map((m, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1.5 pr-4 text-gray-700">
                      {formatSnakeCase(m.type)}
                    </td>
                    <td className="py-1.5 pr-4 text-gray-600">
                      {m.unit || "—"}
                    </td>
                    <td className="py-1.5 text-gray-600">
                      {m.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Linked variations */}
      {form.variations.length > 0 && (
        <Section title="Linked variations">
          <div className="space-y-2">
            {form.variations.map((v, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                {v.id && (
                  <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 mb-1">
                    {v.id}
                  </span>
                )}
                <p className="text-sm text-gray-700">
                  {v.variationDescription || "No description"}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Variation suggestions */}
      {form.variationSuggestions.length > 0 && (
        <Section title="Suggested variations">
          <div className="space-y-2">
            {form.variationSuggestions.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2"
              >
                <span className="text-sm font-medium text-gray-900">
                  {s.exerciseName || "Unnamed"}
                </span>
                {s.variationDescription && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {s.variationDescription}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Notes */}
      {form.commentsNotes.length > 0 && (
        <Section title="Notes">
          <ul className="space-y-1">
            {form.commentsNotes.map((n, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                {n}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Metadata */}
      <Section title="Metadata">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <dt className="text-gray-500">Created by</dt>
          <dd className="text-gray-700">community</dd>
          <dt className="text-gray-500">Review status</dt>
          <dd className="text-gray-700">community</dd>
          <dt className="text-gray-500">Date created</dt>
          <dd className="text-gray-700">{today}</dd>
          <dt className="text-gray-500">Last updated</dt>
          <dd className="text-gray-700">{today}</dd>
          <dt className="text-gray-500">Dedup status</dt>
          <dd className="text-gray-700">unknown</dd>
        </dl>
      </Section>
    </div>
  );
}
