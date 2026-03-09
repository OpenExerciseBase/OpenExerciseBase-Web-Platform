"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  type Exercise,
  type Filters,
  type SortOption,
  filterExercises,
  sortExercises,
  getUniqueValues,
} from "@/components/explore/helpers";
import ExploreControls from "@/components/explore/ExploreControls";
import LoadingSkeleton from "@/components/explore/LoadingSkeleton";

const PAGE_SIZE = 24;

export default function FromExistingPage() {
  const [validated, setValidated] = useState<Exercise[]>([]);
  const [community, setCommunity] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    categories: [],
    equipment: [],
    location: [],
  });
  const [sort, setSort] = useState<SortOption>("name");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/exercises");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (!cancelled) {
          setValidated(data.validated ?? []);
          setCommunity(data.community ?? []);
        }
      } catch {
        console.error("Failed to fetch exercises");
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const allExercises = useMemo(
    () => [...validated, ...community],
    [validated, community]
  );

  const categoryOptions = useMemo(
    () => getUniqueValues(allExercises, "categories"),
    [allExercises]
  );
  const equipmentOptions = useMemo(
    () => getUniqueValues(allExercises, "equipment"),
    [allExercises]
  );
  const locationOptions = useMemo(
    () => getUniqueValues(allExercises, "location"),
    [allExercises]
  );

  const filtered = useMemo(
    () => sortExercises(filterExercises(allExercises, filters), sort),
    [allExercises, filters, sort]
  );

  const displayed = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/add" className="hover:text-primary transition-colors">
            Add exercise
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-900">
            Start from an existing exercise
          </span>
        </nav>

        <div className="mt-6 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Select a template exercise
          </h1>
          <p className="text-lg text-gray-600">
            Choose an existing exercise to use as a starting point. All fields
            will be prefilled and fully editable.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <ExploreControls
            filters={filters}
            onFiltersChange={(f) => { setFilters(f); setVisible(PAGE_SIZE); }}
            sort={sort}
            onSortChange={setSort}
            categoryOptions={categoryOptions}
            equipmentOptions={equipmentOptions}
            locationOptions={locationOptions}
          />

          {loading ? (
            <LoadingSkeleton />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg
                className="h-16 w-16 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <p className="mt-4 text-lg font-medium text-gray-500">
                No exercises match your filters.
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayed.map((exercise) => (
                  <TemplateCard
                    key={`${exercise.track}-${exercise.id}`}
                    exercise={exercise}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="rounded-xl border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:border-primary hover:text-primary transition-colors"
                  >
                    Load more ({filtered.length - visible} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TemplateCard({ exercise }: { exercise: Exercise }) {
  const isValidated = exercise.track === "validated";
  const displayCategories = exercise.categories.slice(0, 2);
  const displayBodyParts = exercise.bodyParts.slice(0, 2);
  const extraBodyParts = exercise.bodyParts.length - 2;

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      {/* Thumbnail */}
      <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
        {exercise.imageUrl ? (
          <Image
            src={exercise.imageUrl}
            alt={exercise.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
        )}
        <span
          className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${
            isValidated
              ? "bg-green-50/90 text-green-700"
              : "bg-amber-50/90 text-amber-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isValidated ? "bg-green-500" : "bg-amber-500"
            }`}
          />
          {isValidated ? "Validated" : "Community"}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
          {exercise.name}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {displayCategories.map((cat) => (
            <span
              key={cat}
              className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {cat}
            </span>
          ))}
        </div>

        {exercise.bodyParts.length > 0 && (
          <p className="mt-2.5 text-xs text-gray-500">
            Targets: {displayBodyParts.join(", ")}
            {extraBodyParts > 0 && (
              <span className="text-gray-400"> +{extraBodyParts} more</span>
            )}
          </p>
        )}

        <div className="mt-auto pt-4">
          <Link
            href={`/add/from-existing/${encodeURIComponent(exercise.id)}?track=${exercise.track}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
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
                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
              />
            </svg>
            Use as template
          </Link>
        </div>
      </div>
    </div>
  );
}
