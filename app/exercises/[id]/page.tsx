"use client";

import { useEffect, useState, useCallback } from "react";
import JSZip from "jszip";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ImageGallery from "@/components/exercise-detail/ImageGallery";
import InstructionsSection from "@/components/exercise-detail/InstructionsSection";
import MetricsSection from "@/components/exercise-detail/MetricsSection";
import {
  EffectsSection,
  BodyPartsSection,
  EquipmentSection,
  VariationsSection,
} from "@/components/exercise-detail/SidebarSections";
import RelationshipsSection from "@/components/exercise-detail/RelationshipsSection";
import NotesSection from "@/components/exercise-detail/NotesSection";
import MetadataSection from "@/components/exercise-detail/MetadataSection";

interface ExerciseData {
  id: string;
  name: string;
  track: "validated" | "community";
  branch: string;
  fileNumber: string;
  categories: string[];
  exerciseEffects: string[];
  bodyParts: string[];
  equipment: string[];
  location: string[];
  instructions: { stepNumber: number; description: string }[];
  performanceMetrics: { type: string; unit: string; notes: string }[];
  variations: (string | { id?: string; variationDescription?: string; level?: string; description?: string })[];
  relationships?: { type: string; target: { track: string; id: string } }[];
  relationshipSuggestions?: {
    type: string;
    targetName: string;
    note: string;
  }[];
  mediaContent: { imageURLs: string[] };
  metadata: {
    createdBy?: string;
    reviewStatus?: string;
    reviewedBy?: string[];
    dateReviewed?: string | null;
    reviewNotes?: string;
    dateCreated?: string;
    lastUpdated?: string;
    lastEditedBy?: string;
    dedupStatus?: string;
    duplicateOf?: { track?: string; id?: string } | string | null;
  };
  commentsNotes: string[];
  resolvedImageUrls: string[];
  githubUrl: string;
}

export default function ExerciseDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = decodeURIComponent(params.id as string);
  const track = searchParams.get("track") ?? "";

  const [data, setData] = useState<ExerciseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const url = track
          ? `/api/exercises/${encodeURIComponent(id)}?track=${track}`
          : `/api/exercises/${encodeURIComponent(id)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, track]);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  const isValidated = data.track === "validated";
  const equipmentSummary =
    data.equipment.length > 0 ? data.equipment.join(", ") : "No equipment";
  const locationSummary =
    data.location.length > 0 ? data.location.join(", ") : "Not specified";

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/explore"
            className="hover:text-primary transition-colors"
          >
            Explore exercises
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-900">{data.name}</span>
        </nav>

        {/* Title & badges */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {data.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isValidated
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isValidated ? "bg-green-500" : "bg-amber-500"
                }`}
              />
              {isValidated ? "Validated" : "Community"}
            </span>
            {data.metadata?.reviewStatus &&
              data.metadata.reviewStatus !== data.track &&
              data.metadata.reviewStatus !== "validated" &&
              data.metadata.reviewStatus !== "community" && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {formatSnakeCase(data.metadata.reviewStatus)}
              </span>
            )}
            {data.metadata?.createdBy && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {formatSnakeCase(data.metadata.createdBy)}
              </span>
            )}
          </div>
        </div>

        {/* Quick summary */}
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
          <SummaryItem
            label="Categories"
            value={data.categories.join(", ") || "None"}
          />
          <SummaryItem label="Equipment" value={equipmentSummary} />
          <SummaryItem label="Location" value={locationSummary} />
          <SummaryItem
            label="Targets"
            value={data.bodyParts.join(", ") || "None"}
          />
        </div>

        {/* Image gallery */}
        <div className="mb-10">
          <ImageGallery
            images={data.resolvedImageUrls}
            exerciseName={data.name}
          />
        </div>

        {/* Two column layout */}
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Left column */}
          <div className="space-y-10">
            <InstructionsSection instructions={data.instructions} />
            <MetricsSection metrics={data.performanceMetrics} />
          </div>

          {/* Right column */}
          <div className="space-y-8">
            <EffectsSection effects={data.exerciseEffects ?? []} />
            <BodyPartsSection bodyParts={data.bodyParts ?? []} />
            <EquipmentSection equipment={data.equipment ?? []} />
            <VariationsSection variations={data.variations ?? []} currentTrack={data.track} />
          </div>
        </div>

        {/* Relationships */}
        <div className="mt-10">
          <RelationshipsSection
            relationships={data.relationships}
            relationshipSuggestions={data.relationshipSuggestions}
          />
        </div>

        {/* Notes */}
        <div className="mt-10">
          <NotesSection notes={data.commentsNotes} />
        </div>

        {/* Metadata */}
        <div className="mt-10">
          <MetadataSection metadata={data.metadata} />
        </div>

        {/* Download */}
        <div className="mt-10">
          <DownloadSection exerciseId={data.id} branch={data.branch} imageFileNames={data.mediaContent?.imageURLs ?? []} />
        </div>

        {/* Footer actions */}
        <div className="mt-10 flex flex-wrap gap-3 border-t border-gray-200 pt-8 pb-4">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:border-primary hover:text-primary transition-colors"
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
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to Explore
          </Link>
          <a
            href={data.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
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
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            View JSON on GitHub
          </a>
        </div>
      </main>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-semibold text-gray-800">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function DownloadSection({
  exerciseId,
  branch,
  imageFileNames,
}: {
  exerciseId: string;
  branch: string;
  imageFileNames: string[];
}) {
  const [jsonBusy, setJsonBusy] = useState(false);
  const [jsonError, setJsonError] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgProgress, setImgProgress] = useState("");

  const RAW = "https://raw.githubusercontent.com/rania-is/samplejson";
  const hasImages = imageFileNames.length > 0;

  const handleJsonDownload = useCallback(async () => {
    setJsonBusy(true);
    setJsonError(false);
    try {
      const res = await fetch(`${RAW}/${branch}/exercises/${exerciseId}.json`);
      if (!res.ok) throw new Error("Failed to fetch");
      const blob = await res.blob();
      triggerDownload(blob, `${exerciseId}.json`);
    } catch {
      setJsonError(true);
    } finally {
      setJsonBusy(false);
    }
  }, [exerciseId, branch, RAW]);

  const handleImgDownload = useCallback(async () => {
    setImgBusy(true);
    setImgError(false);
    setImgProgress("");
    try {
      const zip = new JSZip();
      const total = imageFileNames.length;

      for (let i = 0; i < total; i++) {
        const fileName = imageFileNames[i];
        setImgProgress(`Downloading ${i + 1} of ${total}`);
        const url = `${RAW}/${branch}/images/${exerciseId}/${fileName}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${fileName}`);
        const buf = await res.arrayBuffer();
        zip.file(fileName, buf);
      }

      setImgProgress("Zipping files");
      const content = await zip.generateAsync({ type: "blob" });
      triggerDownload(content, `${exerciseId}_images.zip`);
      setImgProgress("");
    } catch {
      setImgError(true);
      setImgProgress("");
    } finally {
      setImgBusy(false);
    }
  }, [exerciseId, branch, imageFileNames, RAW]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-gray-900">Download Exercise</h2>
      <p className="mt-1.5 text-sm text-gray-500">
        Download the structured JSON file or the instructional images for this exercise.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* JSON button */}
        <button
          onClick={handleJsonDownload}
          disabled={jsonBusy}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DownloadIcon />
          {jsonBusy ? "Downloading..." : "Download JSON"}
        </button>

        {/* Images button */}
        <button
          onClick={handleImgDownload}
          disabled={imgBusy || !hasImages}
          aria-label="Download exercise images as a zip file"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DownloadIcon />
          {imgBusy ? (imgProgress || "Preparing...") : "Download Images"}
        </button>
      </div>

      {!hasImages && (
        <p className="mt-3 text-sm text-gray-400">
          No images available for this exercise.
        </p>
      )}
      {jsonError && (
        <p className="mt-3 text-sm text-red-600">
          Unable to download this exercise at the moment.
        </p>
      )}
      {imgError && (
        <p className="mt-3 text-sm text-red-600">
          Unable to download images at the moment.
        </p>
      )}
    </section>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function formatSnakeCase(str: string): string {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-48 rounded bg-gray-200" />
          <div className="h-10 w-96 rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-gray-200" />
            <div className="h-6 w-24 rounded-full bg-gray-200" />
          </div>
          <div className="aspect-[4/3] max-w-lg rounded-2xl bg-gray-200" />
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="h-6 w-32 rounded bg-gray-200" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div className="h-4 flex-1 rounded bg-gray-200" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-6 w-40 rounded bg-gray-200" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 w-20 rounded-full bg-gray-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <svg
          className="mx-auto h-16 w-16 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <h2 className="mt-4 text-xl font-bold text-gray-900">
          Exercise not found
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          This exercise could not be loaded. It may have been removed or the ID
          is incorrect.
        </p>
        <Link
          href="/explore"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
        >
          Back to Explore
        </Link>
      </div>
    </div>
  );
}
