"use client";

import { useRef, useState } from "react";
import type { ExerciseFormState } from "../types";
import {
  normalizeFilename,
  isAllowedExtension,
  MAX_IMAGES,
  MAX_SIZE_BYTES,
} from "../imageUtils";

interface Props {
  form: ExerciseFormState;
  onChange: (patch: Partial<ExerciseFormState>) => void;
}

export default function MediaSection({ form, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const currentCount = form.imageFiles.length;
    const incoming = Array.from(files);

    if (currentCount + incoming.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }

    const newFiles: File[] = [];
    const newNames: string[] = [];

    for (const file of incoming) {
      if (!file.type.startsWith("image/") || !isAllowedExtension(file.name)) {
        setError(`"${file.name}" is not a supported image format (png, jpg, jpeg, webp).`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`"${file.name}" exceeds the 5 MB size limit.`);
        return;
      }
      const normalized = normalizeFilename(file.name);
      if (form.imageURLs.includes(normalized)) continue;
      newFiles.push(file);
      newNames.push(normalized);
    }

    if (newFiles.length > 0) {
      onChange({
        imageURLs: [...form.imageURLs, ...newNames],
        imageFiles: [...form.imageFiles, ...newFiles],
      });
    }
  };

  const remove = (idx: number) => {
    setError(null);
    onChange({
      imageURLs: form.imageURLs.filter((_, i) => i !== idx),
      imageFiles: form.imageFiles.filter((_, i) => i !== idx),
    });
  };

  const previewUrl = (file: File): string => URL.createObjectURL(file);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Media</h2>
      <p className="mt-1 text-xs text-gray-400">
        Upload images for this exercise (max {MAX_IMAGES}, 5 MB each). Accepted: png, jpg, jpeg, webp.
      </p>

      {error && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-gray-300 bg-gray-50/50 hover:border-gray-400"
        }`}
      >
        <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p className="mt-2 text-sm font-medium text-gray-600">
          Click to upload or drag and drop
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          PNG, JPG, JPEG, WebP
        </p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />

      {/* Uploaded images */}
      {form.imageFiles.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {form.imageFiles.map((file, idx) => (
            <div
              key={idx}
              className="group relative rounded-xl border border-gray-200 bg-white overflow-hidden"
            >
              <div className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl(file)}
                  alt={form.imageURLs[idx]}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="px-2 py-1.5">
                <p className="text-[11px] text-gray-600 truncate">
                  {form.imageURLs[idx]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1 text-gray-400 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-red-500"
                title="Remove image"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
