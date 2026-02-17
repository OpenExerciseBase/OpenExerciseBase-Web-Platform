import Image from "next/image";
import Link from "next/link";
import type { Exercise } from "./helpers";

interface ExerciseCardProps {
  exercise: Exercise;
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const isValidated = exercise.track === "validated";

  const displayCategories = exercise.categories.slice(0, 2);
  const equipmentSummary =
    exercise.equipment.length === 0
      ? "No equipment"
      : exercise.equipment.slice(0, 2).join(", ");
  const locationSummary =
    exercise.location.length === 0
      ? null
      : exercise.location.join(" / ");

  const displayBodyParts = exercise.bodyParts.slice(0, 2);
  const extraBodyParts = exercise.bodyParts.length - 2;

  return (
    <Link
      href={`/exercises/${encodeURIComponent(exercise.id)}?track=${exercise.track}`}
      className="group block rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label={`View details for ${exercise.name}`}
    >
      {/* Thumbnail */}
      <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
        {exercise.imageUrl ? (
          <Image
            src={exercise.imageUrl}
            alt={exercise.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <svg
              className="h-16 w-16"
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

        {/* Track badge */}
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
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
          {exercise.name}
        </h3>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {displayCategories.map((cat) => (
            <span
              key={cat}
              className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {cat}
            </span>
          ))}
          {equipmentSummary && (
            <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {equipmentSummary}
            </span>
          )}
          {locationSummary && (
            <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
              {locationSummary}
            </span>
          )}
        </div>

        {/* Targets */}
        {exercise.bodyParts.length > 0 && (
          <p className="mt-2.5 text-xs text-gray-500">
            Targets: {displayBodyParts.join(", ")}
            {extraBodyParts > 0 && (
              <span className="text-gray-400">
                {" "}
                +{extraBodyParts} more
              </span>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}
