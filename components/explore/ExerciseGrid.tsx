"use client";

import { useState } from "react";
import ExerciseCard from "./ExerciseCard";
import type { Exercise } from "./helpers";

const PAGE_SIZE = 24;

interface ExerciseGridProps {
  exercises: Exercise[];
}

export default function ExerciseGrid({ exercises }: ExerciseGridProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  const displayed = exercises.slice(0, visible);
  const hasMore = visible < exercises.length;

  if (exercises.length === 0) {
    return (
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
    );
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayed.map((exercise) => (
          <ExerciseCard key={`${exercise.track}-${exercise.id}`} exercise={exercise} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-xl border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:border-primary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Load more exercises ({exercises.length - visible} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
