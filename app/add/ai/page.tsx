"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import {
  CATEGORY_OPTIONS,
  COMMON_BODY_PARTS,
  COMMON_EQUIPMENT,
  LOCATION_OPTIONS,
} from "@/components/add-form/types";
import { formatSnakeCase } from "@/components/add-form/helpers";

/* ── Types ── */

interface GenerateInput {
  exerciseGoal: string;
  categories: string[];
  bodyParts: string[];
  customBodyPart: string;
  equipment: string[];
  customEquipment: string;
  noEquipment: boolean;
  location: string[];
  difficulty: string;
  specialConsiderations: string;
  noGoMovements: string;
}

const INITIAL_INPUT: GenerateInput = {
  exerciseGoal: "",
  categories: [],
  bodyParts: [],
  customBodyPart: "",
  equipment: [],
  customEquipment: "",
  noEquipment: false,
  location: [],
  difficulty: "",
  specialConsiderations: "",
  noGoMovements: "",
};

const DIFFICULTY_OPTIONS = ["beginner", "intermediate", "advanced"];

/* ── Multi select chip component ── */

function ChipSelect({
  label,
  options,
  selected,
  onToggle,
  formatLabel,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  formatLabel?: (s: string) => string;
}) {
  const fmt = formatLabel ?? formatSnakeCase;
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "bg-primary text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {fmt(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════════════════════ */

export default function AiGeneratePage() {
  const router = useRouter();
  const [input, setInput] = useState<GenerateInput>(INITIAL_INPUT);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Input helpers ── */

  const updateInput = useCallback((patch: Partial<GenerateInput>) => {
    setInput((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleArrayItem = useCallback(
    (field: "categories" | "bodyParts" | "equipment" | "location", value: string) => {
      setInput((prev) => {
        const arr = prev[field];
        const next = arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value];
        return { ...prev, [field]: next };
      });
    },
    []
  );

  const addCustomBodyPart = useCallback(() => {
    const val = input.customBodyPart.trim().toLowerCase();
    if (val && !input.bodyParts.includes(val)) {
      setInput((prev) => ({
        ...prev,
        bodyParts: [...prev.bodyParts, val],
        customBodyPart: "",
      }));
    }
  }, [input.customBodyPart, input.bodyParts]);

  const addCustomEquipment = useCallback(() => {
    const val = input.customEquipment.trim().toLowerCase();
    if (val && !input.equipment.includes(val)) {
      setInput((prev) => ({
        ...prev,
        equipment: [...prev.equipment, val],
        customEquipment: "",
      }));
    }
  }, [input.customEquipment, input.equipment]);

  /* ── Generate ── */

  const canGenerate =
    input.categories.length > 0 && input.bodyParts.length > 0;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) {
      setError("Please select at least one category and one target body part.");
      return;
    }
    setGenerating(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {};
      if (input.exerciseGoal.trim()) payload.exerciseGoal = input.exerciseGoal.trim();
      if (input.categories.length) payload.categories = input.categories;
      if (input.bodyParts.length) payload.bodyParts = input.bodyParts;
      if (input.noEquipment) {
        payload.equipment = [];
      } else if (input.equipment.length) {
        payload.equipment = input.equipment;
      }
      if (input.location.length) payload.location = input.location;
      if (input.difficulty) payload.difficulty = input.difficulty;
      if (input.specialConsiderations.trim())
        payload.specialConsiderations = input.specialConsiderations.trim();
      if (input.noGoMovements.trim())
        payload.noGoMovements = input.noGoMovements.trim();

      const res = await fetch("/api/generate-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error ?? "Failed to generate exercise.");
        return;
      }

      // Store draft in sessionStorage and navigate to form
      const draftPayload = { draft: data.draft, images: [] };
      sessionStorage.setItem("oexdb_ai_draft", JSON.stringify(draftPayload));
      router.push("/add/form");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  }, [input, canGenerate, router]);

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Back + Title */}
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/add"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
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
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Back
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Co create exercise with AI
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Generate a structured exercise draft based on a few inputs. Review carefully before submitting.
        </p>

        {/* ═══ INPUT FORM ═══ */}
        <div className="mt-8 space-y-6">
            {/* Exercise goal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Exercise goal
              </label>
              <textarea
                value={input.exerciseGoal}
                onChange={(e) => updateInput({ exerciseGoal: e.target.value })}
                placeholder="e.g. Improve lower body strength for beginners with no equipment"
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Categories */}
            <ChipSelect
              label="Categories *"
              options={CATEGORY_OPTIONS}
              selected={input.categories}
              onToggle={(v) => toggleArrayItem("categories", v)}
            />

            {/* Body parts */}
            <div>
              <ChipSelect
                label="Target body parts *"
                options={COMMON_BODY_PARTS}
                selected={input.bodyParts}
                onToggle={(v) => toggleArrayItem("bodyParts", v)}
                formatLabel={(s) => s.charAt(0).toUpperCase() + s.slice(1)}
              />
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={input.customBodyPart}
                  onChange={(e) => updateInput({ customBodyPart: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomBodyPart();
                    }
                  }}
                  placeholder="Add custom body part"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={addCustomBodyPart}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Equipment */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Equipment</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.noEquipment}
                    onChange={(e) =>
                      updateInput({
                        noEquipment: e.target.checked,
                        equipment: e.target.checked ? [] : input.equipment,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">No equipment</span>
                </label>
              </div>
              {!input.noEquipment && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_EQUIPMENT.map((opt) => {
                      const active = input.equipment.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleArrayItem("equipment", opt)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                            active
                              ? "bg-primary text-white shadow-sm"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={input.customEquipment}
                      onChange={(e) => updateInput({ customEquipment: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomEquipment();
                        }
                      }}
                      placeholder="Add custom equipment"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={addCustomEquipment}
                      className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <div className="flex gap-4">
                {LOCATION_OPTIONS.map((loc) => (
                  <label key={loc} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={input.location.includes(loc)}
                      onChange={() => toggleArrayItem("location", loc)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 capitalize">{loc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTY_OPTIONS.map((d) => {
                  const active = input.difficulty === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => updateInput({ difficulty: active ? "" : d })}
                      className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all capitalize ${
                        active
                          ? "bg-primary text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special considerations */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Special considerations
              </label>
              <textarea
                value={input.specialConsiderations}
                onChange={(e) =>
                  updateInput({ specialConsiderations: e.target.value })
                }
                placeholder="e.g. Suitable for seniors, avoid high impact"
                rows={2}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Movements to avoid */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Movements to avoid
              </label>
              <textarea
                value={input.noGoMovements}
                onChange={(e) => updateInput({ noGoMovements: e.target.value })}
                placeholder="e.g. No jumping, no twisting at the waist"
                rows={2}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !canGenerate}
              className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                  Generate draft
                </>
              )}
            </button>
        </div>
      </main>
    </div>
  );
}
