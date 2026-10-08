"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import StatTile from "@/components/insights/StatTile";
import BarList from "@/components/insights/BarList";
import SegmentedBar from "@/components/insights/SegmentedBar";
import type { InsightsResponse, Track, TrackStats } from "@/components/insights/types";
import { TRACK_LABEL, TRACK_COLOR } from "@/components/insights/types";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [track, setTrack] = useState<Track>("combined");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load dataset insights.");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dataset insights.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats: TrackStats | null = data ? data[track] : null;
  const color = TRACK_COLOR[track];

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Explore the current composition and coverage of OpenExerciseBase
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
              This page provides an overview of the exercises available in the database, including their validation
              status, origin, classifications, targeted body regions, equipment, settings, and other characteristics.
              Statistics are generated from the current version of the database and evolve as new exercises are
              contributed, reviewed, and updated.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={loading || refreshing}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Track selector */}
        <div className="mt-6 inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {(["combined", "main", "community"] as Track[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrack(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                track === t ? "text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
              style={track === t ? { backgroundColor: TRACK_COLOR[t] } : undefined}
            >
              {TRACK_LABEL[t]}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-10 flex flex-col items-center gap-3 py-20 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
            <p className="text-sm">Loading dataset insights…</p>
          </div>
        )}

        {error && !loading && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-5">
            <p className="text-sm font-medium text-red-900">{error}</p>
            <button type="button" onClick={() => load()} className="mt-3 text-sm font-medium text-red-700 underline">
              Try again
            </button>
          </div>
        )}

        {stats && !loading && !error && (
          <div className="mt-8 space-y-8">
            {data && (
              <p className="text-xs text-gray-400">
                Last computed {new Date(data.updatedAt).toLocaleString()}. Showing {TRACK_LABEL[track].toLowerCase()}.
              </p>
            )}

            {/* Top-line stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile label="Exercises" value={String(stats.total)} color={color} />
              <StatTile
                label="With a relationship"
                value={`${Math.round(stats.relationshipsCoverage * 100)}%`}
                sublabel="linked to another exercise"
                color={color}
              />
              <StatTile
                label="With a performance metric"
                value={`${Math.round(stats.metricsCoverage * 100)}%`}
                color={color}
              />
              <StatTile
                label="With an image"
                value={`${Math.round(stats.imageCoverage * 100)}%`}
                color={color}
              />
            </div>

            {stats.total === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
                No exercises in this track yet.
              </p>
            ) : (
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  <Section title="Review status" description="How the exercises in this view are currently classified.">
                    <SegmentedBar items={stats.byStatus} colors={["#16a34a", "#0d9488", "#9ca3af", "#dc2626"]} />
                  </Section>

                  <Section title="Categories" description="Share of exercises tagged with each category. Exercises may carry more than one.">
                    <BarList items={stats.categories} color={color} />
                  </Section>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Section title="Most frequent body parts" description={`Median ${stats.bodyPartsPerExercise.toFixed(1)} body parts per exercise.`}>
                    <BarList items={stats.bodyParts} color={color} />
                  </Section>
                  <Section title="Body regions covered">
                    <BarList items={stats.regions} color={color} />
                  </Section>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <Section title="Equipment need">
                    <SegmentedBar items={stats.equipmentNeed} colors={["#16a34a", "#d97706", "#0d9488"]} />
                  </Section>
                  <Section title="Setting">
                    <SegmentedBar items={stats.location} colors={["#0d9488", "#7dd3c0", "#d1d5db"]} />
                  </Section>
                  <Section title="Most frequent equipment">
                    <BarList items={stats.topEquipment.slice(0, 6)} color={color} />
                  </Section>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Section title="Intended effects" description={`Median ${stats.effectsPerExercise.toFixed(1)} effects per exercise.`}>
                    <BarList items={stats.effects} color={color} />
                  </Section>
                  <Section title="Instructions">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.instructions.medianSteps.toFixed(0)}</p>
                        <p className="text-xs text-gray-500">median instruction steps</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stats.instructions.medianWords.toFixed(0)}</p>
                        <p className="text-xs text-gray-500">median words of instructions</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700">{stats.instructions.avgSteps.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">average steps</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700">{stats.instructions.avgWords.toFixed(0)}</p>
                        <p className="text-xs text-gray-500">average words</p>
                      </div>
                    </div>
                  </Section>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Section title="Performance metric types" description="Among exercises that specify at least one metric.">
                    <BarList items={stats.topMetricTypes} color={color} />
                  </Section>
                  <Section title="Coverage of optional information">
                    <BarList
                      items={[
                        { label: "Relationship to another exercise", count: 0, pct: stats.relationshipsCoverage },
                        { label: "Variation described", count: 0, pct: stats.variationsCoverage },
                        { label: "Coaching note", count: 0, pct: stats.notesCoverage },
                        { label: "Performance metric", count: 0, pct: stats.metricsCoverage },
                        { label: "Image", count: 0, pct: stats.imageCoverage },
                      ]}
                      color={color}
                    />
                  </Section>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
