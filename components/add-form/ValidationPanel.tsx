"use client";

import type { ValidationResult } from "./types";

interface Props {
  validation: ValidationResult;
}

export default function ValidationPanel({ validation }: Props) {
  if (validation.valid) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-green-800">
            Ready to export
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-4">
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <span className="text-sm font-semibold text-amber-800">
          Missing required fields
        </span>
      </div>
      <ul className="mt-2 space-y-1 pl-7">
        {validation.errors.map((err, i) => (
          <li key={i} className="text-xs text-amber-700 list-disc">
            {err}
          </li>
        ))}
      </ul>
    </div>
  );
}
