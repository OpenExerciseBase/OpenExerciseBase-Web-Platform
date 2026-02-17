"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  ExerciseFormState,
  Variation,
  VariationSuggestion,
} from "../types";

/* ── Types ── */
interface FetchedExercise {
  track: "validated" | "community";
  id: string;
  name: string;
  categories: string[];
  bodyParts: string[];
  equipment: string[];
  imageUrl: string | null;
}
interface ScoredExercise extends FetchedExercise { score: number; reason: string; }

/* ── Similarity helpers ── */
function norm(s: string) { return s.toLowerCase().replace(/[-_]/g, " ").replace(/[^a-z0-9 ]/g, "").trim(); }
function wordSim(a: string, b: string) {
  const wa = new Set(norm(a).split(/\s+/).filter(Boolean));
  const wb = new Set(norm(b).split(/\s+/).filter(Boolean));
  if (!wa.size || !wb.size) return 0;
  let o = 0; for (const w of wa) if (wb.has(w)) o++;
  return o / Math.max(wa.size, wb.size);
}
function subMatch(a: string, b: string) { const na = norm(a), nb = norm(b); return na.length > 2 && nb.length > 2 && (na.includes(nb) || nb.includes(na)); }
function arrOverlap(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const sa = new Set(a.map(norm)); let o = 0;
  for (const x of b) if (sa.has(norm(x))) o++;
  return o / Math.max(a.length, b.length);
}

const DESC_PRESETS = [
  "Easier variation", "Harder variation", "Alternative variation",
  "Progression", "Regression", "Unilateral version",
  "Bodyweight version", "Weighted version",
];

/* ── Props ── */
interface Props {
  form: ExerciseFormState;
  onChange: (patch: Partial<ExerciseFormState>) => void;
}

export default function VariationsSection({ form, onChange }: Props) {
  const linked = form.variations;
  const suggestions = form.variationSuggestions;

  /* ── Fetch all exercises once ── */
  const [allExercises, setAllExercises] = useState<FetchedExercise[]>([]);
  const [loadingEx, setLoadingEx] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // Track which exercise is being linked (showing description picker)
  const [linkingEx, setLinkingEx] = useState<FetchedExercise | null>(null);
  const [linkDesc, setLinkDesc] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/exercises");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setAllExercises([...(data.validated ?? []), ...(data.community ?? [])]);
      } catch { /* silent */ } finally { if (!cancelled) setLoadingEx(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ── IDs already linked ── */
  const linkedIds = useMemo(() => new Set(linked.map((v) => v.id).filter(Boolean)), [linked]);

  /* ── Auto-suggestions based on form fields ── */
  const autoSuggestions = useMemo<ScoredExercise[]>(() => {
    if (!form.name.trim() || !allExercises.length) return [];
    const results: ScoredExercise[] = [];
    for (const ex of allExercises) {
      if (ex.id === form.id || linkedIds.has(ex.id)) continue;
      let score = 0;
      const reasons: string[] = [];
      const ns = wordSim(form.name, ex.name);
      if (ns >= 0.5) { score += ns * 60; reasons.push("similar name"); }
      if (subMatch(form.name, ex.name)) { score += 25; if (!reasons.length) reasons.push("similar name"); }
      const bo = arrOverlap(form.bodyParts, ex.bodyParts);
      if (bo > 0) { score += bo * 20; if (bo >= 0.5) reasons.push("same muscles"); }
      const co = arrOverlap(form.categories, ex.categories);
      if (co > 0) { score += co * 10; if (co >= 0.5) reasons.push("same category"); }
      score += arrOverlap(form.equipment, ex.equipment) * 5;
      if (score >= 20 && reasons.length) results.push({ ...ex, score, reason: reasons.join(", ") });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 8);
  }, [form.name, form.id, form.bodyParts, form.categories, form.equipment, allExercises, linkedIds]);

  /* ── Search results ── */
  const searchResults = useMemo<FetchedExercise[]>(() => {
    const q = norm(searchQuery);
    if (q.length < 2 || !allExercises.length) return [];
    return allExercises
      .filter((ex) => ex.id !== form.id && !linkedIds.has(ex.id) && (norm(ex.name).includes(q) || norm(ex.id).includes(q)))
      .slice(0, 12);
  }, [searchQuery, allExercises, form.id, linkedIds]);

  /* ── Link exercise as variation ── */
  const confirmLink = useCallback(() => {
    if (!linkingEx || !linkDesc.trim()) return;
    onChange({ variations: [...linked, { id: linkingEx.id, variationDescription: linkDesc.trim() }] });
    setLinkingEx(null);
    setLinkDesc("");
  }, [linkingEx, linkDesc, linked, onChange]);

  /* ── Linked variations CRUD ── */
  const updateLinked = (idx: number, patch: Partial<Variation>) => {
    onChange({ variations: linked.map((v, i) => (i === idx ? { ...v, ...patch } : v)) });
  };
  const addLinked = () => onChange({ variations: [...linked, { id: "", variationDescription: "" }] });
  const removeLinked = (idx: number) => onChange({ variations: linked.filter((_, i) => i !== idx) });

  /* ── Variation suggestions CRUD ── */
  const updateSuggestion = (idx: number, patch: Partial<VariationSuggestion>) => {
    onChange({ variationSuggestions: suggestions.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  };
  const addSuggestion = () => onChange({ variationSuggestions: [...suggestions, { exerciseName: "", variationDescription: "" }] });
  const removeSuggestion = (idx: number) => onChange({ variationSuggestions: suggestions.filter((_, i) => i !== idx) });

  /* ── Render a single exercise result row ── */
  const ExRow = ({ ex, badge }: { ex: FetchedExercise; badge?: string }) => {
    const isLinking = linkingEx?.id === ex.id;
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{ex.name}</p>
            <p className="truncate text-[11px] text-gray-400">{ex.id}</p>
            {badge && <span className="mt-0.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">{badge}</span>}
          </div>
          {linkedIds.has(ex.id) ? (
            <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">Linked</span>
          ) : (
            <button
              type="button"
              onClick={() => { setLinkingEx(isLinking ? null : ex); setLinkDesc(""); }}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${isLinking ? "bg-gray-200 text-gray-700" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
            >
              {isLinking ? "Cancel" : "Link"}
            </button>
          )}
        </div>
        {/* Description picker */}
        {isLinking && (
          <div className="mt-2 space-y-2 border-t border-gray-100 pt-2">
            <p className="text-[11px] font-medium text-gray-500">Pick or write a description:</p>
            <div className="flex flex-wrap gap-1.5">
              {DESC_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setLinkDesc(d)}
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${linkDesc === d ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={linkDesc}
                onChange={(e) => setLinkDesc(e.target.value)}
                placeholder="Or type a custom description…"
                className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={confirmLink}
                disabled={!linkDesc.trim()}
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Variations</h2>
      <p className="mt-1 text-xs text-gray-400">
        Link to existing exercises or suggest variations not yet in the database.
      </p>

      {/* ═══ Find & link similar exercises ═══ */}
      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/[0.02] p-4">
        <h3 className="text-sm font-semibold text-gray-800">Find similar exercises</h3>
        <p className="mt-0.5 text-[11px] text-gray-400">
          Search or pick from auto-suggestions to link as a variation.
        </p>

        {/* Search bar */}
        <div className="relative mt-3">
          <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or ID…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        {loadingEx && <p className="mt-3 text-xs text-gray-400">Loading exercises…</p>}

        {/* Search results */}
        {searchQuery.length >= 2 && searchResults.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-medium text-gray-500">Search results</p>
            {searchResults.map((ex) => <ExRow key={ex.id} ex={ex} />)}
          </div>
        )}
        {searchQuery.length >= 2 && !searchResults.length && !loadingEx && (
          <p className="mt-3 text-xs text-gray-400">No exercises found.</p>
        )}

        {/* Auto-suggestions */}
        {!searchQuery && autoSuggestions.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-medium text-gray-500">Suggested similar exercises</p>
            {autoSuggestions.map((ex) => <ExRow key={ex.id} ex={ex} badge={ex.reason} />)}
          </div>
        )}
      </div>

      {/* ═══ Linked variations list ═══ */}
      <h3 className="mt-6 text-sm font-semibold text-gray-700">Linked variations</h3>
      <p className="mt-0.5 text-xs text-gray-400">
        Exercises from the database linked as variations. You can also add manually.
      </p>
      <div className="mt-2 space-y-3">
        {linked.map((v, idx) => (
          <div key={idx} className="flex flex-wrap items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            <div className="w-full sm:w-48">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Exercise ID</label>
              <input type="text" value={v.id} onChange={(e) => updateLinked(idx, { id: e.target.value })} placeholder="e.g. EX-glute_bridge-01HZY…" className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary" />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Variation description</label>
              <input type="text" value={v.variationDescription} onChange={(e) => updateLinked(idx, { variationDescription: e.target.value })} placeholder="e.g. Single leg version targeting balance" className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary" />
            </div>
            <button type="button" onClick={() => removeLinked(idx)} className="mt-5 shrink-0 rounded p-1 text-gray-400 hover:text-red-500" title="Remove">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addLinked} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Add linked variation
      </button>

      {/* ═══ Variation suggestions (not in DB) ═══ */}
      <h3 className="mt-8 text-sm font-semibold text-gray-700">Suggested variations</h3>
      <p className="mt-0.5 text-xs text-gray-400">
        Suggest variations by exercise name if they don&apos;t exist in the database yet.
      </p>
      <div className="mt-2 space-y-3">
        {suggestions.map((s, idx) => (
          <div key={idx} className="flex flex-wrap items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Exercise name</label>
              <input type="text" value={s.exerciseName} onChange={(e) => updateSuggestion(idx, { exerciseName: e.target.value })} placeholder="e.g. Single Leg Glute Bridge" className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Variation description</label>
              <input type="text" value={s.variationDescription} onChange={(e) => updateSuggestion(idx, { variationDescription: e.target.value })} placeholder="e.g. Easier single-leg version" className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary" />
            </div>
            <button type="button" onClick={() => removeSuggestion(idx)} className="mt-5 shrink-0 rounded p-1 text-gray-400 hover:text-red-500" title="Remove">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addSuggestion} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Add suggested variation
      </button>
    </section>
  );
}
