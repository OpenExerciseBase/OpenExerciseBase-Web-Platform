"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ExploreHeader from "@/components/explore/ExploreHeader";
import ExploreControls from "@/components/explore/ExploreControls";
import ExerciseGrid from "@/components/explore/ExerciseGrid";
import LoadingSkeleton from "@/components/explore/LoadingSkeleton";
import {
  type Exercise,
  type Filters,
  type SortOption,
  filterExercises,
  sortExercises,
  getUniqueValues,
} from "@/components/explore/helpers";

export default function ExplorePage() {
  const [validated, setValidated] = useState<Exercise[]>([]);
  const [community, setCommunity] = useState<Exercise[]>([]);
  const [communityError, setCommunityError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [includeCommunity, setIncludeCommunity] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    categories: [],
    equipment: [],
    location: [],
  });
  const [sort, setSort] = useState<SortOption>("name");

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
          setCommunityError(data.communityError ?? false);
        }
      } catch {
        console.error("Failed to fetch exercises");
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const allExercises = useMemo(() => {
    if (includeCommunity) return [...validated, ...community];
    return validated;
  }, [validated, community, includeCommunity]);

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

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="space-y-8">
          <ExploreHeader
            validatedCount={validated.length}
            communityCount={community.length}
            includeCommunity={includeCommunity}
            onToggleCommunity={setIncludeCommunity}
            communityError={communityError}
          />

          <ExploreControls
            filters={filters}
            onFiltersChange={setFilters}
            sort={sort}
            onSortChange={setSort}
            categoryOptions={categoryOptions}
            equipmentOptions={equipmentOptions}
            locationOptions={locationOptions}
          />

          {loading ? <LoadingSkeleton /> : <ExerciseGrid exercises={filtered} />}
        </div>
      </main>
    </div>
  );
}
