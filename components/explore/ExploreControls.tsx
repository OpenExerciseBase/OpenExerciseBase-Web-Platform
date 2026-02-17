"use client";

import { useState, useRef, useEffect } from "react";
import type { Filters, SortOption } from "./helpers";

interface ExploreControlsProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  categoryOptions: string[];
  equipmentOptions: string[];
  locationOptions: string[];
}

export default function ExploreControls({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  categoryOptions,
  equipmentOptions,
  locationOptions,
}: ExploreControlsProps) {
  const toggleFilter = (
    key: "categories" | "equipment" | "location",
    value: string
  ) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: next });
  };

  const clearAll = () => {
    onFiltersChange({ search: "", categories: [], equipment: [], location: [] });
  };

  const hasActiveFilters =
    filters.search ||
    filters.categories.length > 0 ||
    filters.equipment.length > 0 ||
    filters.location.length > 0;

  return (
    <div className="space-y-3">
      {/* Search, filters, sort — single row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search exercises..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Search exercises"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {categoryOptions.length > 0 && (
            <FilterDropdown
              label="Category"
              options={categoryOptions}
              selected={filters.categories}
              onToggle={(v) => toggleFilter("categories", v)}
            />
          )}
          {equipmentOptions.length > 0 && (
            <FilterDropdown
              label="Equipment"
              options={equipmentOptions}
              selected={filters.equipment}
              onToggle={(v) => toggleFilter("equipment", v)}
            />
          )}
          {locationOptions.length > 0 && (
            <FilterDropdown
              label="Location"
              options={locationOptions}
              selected={filters.location}
              onToggle={(v) => toggleFilter("location", v)}
            />
          )}

          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Sort exercises"
          >
            <option value="name">Sort by name</option>
            <option value="recently_updated">Recently updated</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const count = selected.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
          count > 0
            ? "border-primary bg-primary/5 text-primary"
            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
        }`}
      >
        {label}
        {count > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {count}
          </span>
        )}
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {options.map((opt) => {
              const isActive = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => onToggle(opt)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                  />
                  <span
                    className={`text-sm ${
                      isActive ? "font-medium text-gray-900" : "text-gray-600"
                    }`}
                  >
                    {opt}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
