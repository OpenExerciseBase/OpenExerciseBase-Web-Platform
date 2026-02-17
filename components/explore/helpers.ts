/**
 * Client-side helpers for the Explore page.
 *
 * Data is fetched from /api/exercises (which reads index.json via raw GitHub URLs).
 * This file only contains types, filtering, sorting, and utility functions.
 */

// ─── Normalized UI model ─────────────────────────────────────────────────────

export interface Exercise {
  track: "validated" | "community";
  id: string;
  name: string;
  categories: string[];
  bodyParts: string[];
  equipment: string[];
  location: string[];
  imageUrl: string | null;
  lastUpdated: string | null;
  reviewStatus: string;
}

// ─── Filtering ───────────────────────────────────────────────────────────────

export interface Filters {
  search: string;
  categories: string[];
  equipment: string[];
  location: string[];
}

export function filterExercises(
  exercises: Exercise[],
  filters: Filters
): Exercise[] {
  return exercises.filter((ex) => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [
        ex.name,
        ...ex.categories,
        ...ex.bodyParts,
        ...ex.equipment,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // Category filter
    if (filters.categories.length > 0) {
      const exCats = ex.categories.map((c) => c.toLowerCase());
      if (!filters.categories.some((c) => exCats.includes(c.toLowerCase())))
        return false;
    }

    // Equipment filter
    if (filters.equipment.length > 0) {
      const exEquip = ex.equipment.map((e) => e.toLowerCase());
      const hasNoEquip = filters.equipment
        .map((e) => e.toLowerCase())
        .includes("no equipment");
      if (hasNoEquip && exEquip.length === 0) {
        // passes
      } else if (
        !filters.equipment.some((e) => exEquip.includes(e.toLowerCase()))
      ) {
        if (!(hasNoEquip && exEquip.length === 0)) return false;
      }
    }

    // Location filter
    if (filters.location.length > 0) {
      const exLoc = ex.location.map((l) => l.toLowerCase());
      if (!filters.location.some((l) => exLoc.includes(l.toLowerCase())))
        return false;
    }

    return true;
  });
}

// ─── Sorting ─────────────────────────────────────────────────────────────────

export type SortOption = "name" | "recently_updated";

export function sortExercises(
  exercises: Exercise[],
  sort: SortOption
): Exercise[] {
  const sorted = [...exercises];
  if (sort === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    sorted.sort((a, b) => {
      const da = a.lastUpdated ?? "";
      const db = b.lastUpdated ?? "";
      return db.localeCompare(da);
    });
  }
  return sorted;
}

// ─── Unique values for filter options ────────────────────────────────────────

export function getUniqueValues(
  exercises: Exercise[],
  key: "categories" | "equipment" | "location"
): string[] {
  const set = new Set<string>();
  for (const ex of exercises) {
    for (const val of ex[key]) {
      set.add(val);
    }
  }
  const arr = Array.from(set).sort();
  if (key === "equipment" && !arr.map((a) => a.toLowerCase()).includes("no equipment")) {
    arr.push("No equipment");
  }
  return arr;
}
