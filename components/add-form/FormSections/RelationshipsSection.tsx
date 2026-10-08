"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { ExerciseFormState, Relationship } from "../types";
import { RELATIONSHIP_TYPE_OPTIONS, TRACK_OPTIONS } from "../types";
import { formatSnakeCase } from "../helpers";

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

interface Props {
  form: ExerciseFormState;
  onChange: (patch: Partial<ExerciseFormState>) => void;
}

export default function RelationshipsSection({ form, onChange }: Props) {
  const rels = form.relationships;

  const [allExercises, setAllExercises] = useState<FetchedExercise[]>([]);
  const [loadingEx, setLoadingEx] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [linkingEx, setLinkingEx] = useState<FetchedExercise | null>(null);
  const [linkType, setLinkType] = useState<string>(RELATIONSHIP_TYPE_OPTIONS[0]);
  const [linkNote, setLinkNote] = useState("");

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

  const linkedIds = useMemo(() => new Set(rels.map((r) => r.target?.id).filter(Boolean) as string[]), [rels]);

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

  const searchResults = useMemo<FetchedExercise[]>(() => {
    const q = norm(searchQuery);
    if (q.length < 2 || !allExercises.length) return [];
    return allExercises
      .filter((ex) => ex.id !== form.id && !linkedIds.has(ex.id) && (norm(ex.name).includes(q) || norm(ex.id).includes(q)))
      .slice(0, 12);
  }, [searchQuery, allExercises, form.id, linkedIds]);

  const confirmLink = useCallback(() => {
    if (!linkingEx) return;
    const rel: Relationship = { type: linkType, target: { track: linkingEx.track, id: linkingEx.id } };
    if (linkNote.trim()) rel.note = linkNote.trim();
    onChange({ relationships: [...rels, rel] });
    setLinkingEx(null);
    setLinkNote("");
    setLinkType(RELATIONSHIP_TYPE_OPTIONS[0]);
  }, [linkingEx, linkType, linkNote, rels, onChange]);

  const updateRel = (idx: number, patch: Partial<Relationship>) => {
    onChange({ relationships: rels.map((r, i) => (i === idx ? { ...r, ...patch } : r)) });
  };
  const removeRel = (idx: number) => onChange({ relationships: rels.filter((_, i) => i !== idx) });
  const addSuggestion = () =>
    onChange({ relationships: [...rels, { type: RELATIONSHIP_TYPE_OPTIONS[0], targetName: "", note: "" }] });

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
          <button
            type="button"
            onClick={() => { setLinkingEx(isLinking ? null : ex); setLinkNote(""); }}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${isLinking ? "bg-gray-200 text-gray-700" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
          >
            {isLinking ? "Cancel" : "Link"}
          </button>
        </div>
        {isLinking && (
          <div className="mt-2 space-y-2 border-t border-gray-100 pt-2">
            <p className="text-[11px] font-medium text-gray-500">
              This exercise is a&hellip; (relationship to {ex.name})
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
              >
                {RELATIONSHIP_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{formatSnakeCase(t)}</option>
                ))}
              </select>
              <input
                type="text"
                value={linkNote}
                onChange={(e) => setLinkNote(e.target.value)}
                placeholder="Optional note"
                className="min-w-[160px] flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={confirmLink}
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90"
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
      <h2 className="text-lg font-bold text-gray-900">Relationships</h2>
      <p className="mt-1 text-xs text-gray-400">
        Optional. Link this exercise to existing exercises (variation, progression, regression, and so on),
        or suggest a related exercise that is not in the database yet.
      </p>

      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/[0.02] p-4">
        <h3 className="text-sm font-semibold text-gray-800">Find related exercises</h3>
        <p className="mt-0.5 text-[11px] text-gray-400">Search or pick from auto-suggestions to link.</p>

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

        {searchQuery.length >= 2 && searchResults.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-medium text-gray-500">Search results</p>
            {searchResults.map((ex) => <ExRow key={ex.id} ex={ex} />)}
          </div>
        )}
        {searchQuery.length >= 2 && !searchResults.length && !loadingEx && (
          <p className="mt-3 text-xs text-gray-400">No exercises found.</p>
        )}

        {!searchQuery && autoSuggestions.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-medium text-gray-500">Suggested similar exercises</p>
            {autoSuggestions.map((ex) => <ExRow key={ex.id} ex={ex} badge={ex.reason} />)}
          </div>
        )}
      </div>

      <h3 className="mt-6 text-sm font-semibold text-gray-700">Added relationships</h3>
      <div className="mt-2 space-y-3">
        {rels.length === 0 && <p className="text-xs text-gray-400">None yet.</p>}
        {rels.map((r, idx) => (
          <div key={idx} className="flex flex-wrap items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
            <div className="w-full sm:w-44">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">Type</label>
              <select
                value={r.type}
                onChange={(e) => updateRel(idx, { type: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
              >
                {RELATIONSHIP_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{formatSnakeCase(t)}</option>
                ))}
              </select>
            </div>
            {r.target ? (
              <>
                <div className="w-full sm:w-32">
                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Track</label>
                  <select
                    value={r.target.track}
                    onChange={(e) => updateRel(idx, { target: { ...r.target!, track: e.target.value } })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
                  >
                    {TRACK_OPTIONS.map((t) => (
                      <option key={t} value={t}>{formatSnakeCase(t)}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[120px] flex-1">
                  <label className="mb-1 block text-[11px] font-medium text-gray-500">Target ID</label>
                  <input
                    type="text"
                    value={r.target.id}
                    onChange={(e) => updateRel(idx, { target: { ...r.target!, id: e.target.value } })}
                    placeholder="e.g. EX-glute_bridge-01HZY…"
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </>
            ) : (
              <div className="min-w-[150px] flex-1">
                <label className="mb-1 block text-[11px] font-medium text-gray-500">Suggested exercise name</label>
                <input
                  type="text"
                  value={r.targetName ?? ""}
                  onChange={(e) => updateRel(idx, { targetName: e.target.value })}
                  placeholder="e.g. Single Leg Glute Bridge"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
                />
              </div>
            )}
            <div className="min-w-[150px] flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-500">Note (optional)</label>
              <input
                type="text"
                value={r.note ?? ""}
                onChange={(e) => updateRel(idx, { note: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <button type="button" onClick={() => removeRel(idx)} className="mt-5 shrink-0 rounded p-1 text-gray-400 hover:text-red-500" title="Remove">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addSuggestion} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Suggest an exercise not in the database
      </button>
    </section>
  );
}
