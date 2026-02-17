interface NotesSectionProps {
  notes: string[];
}

export default function NotesSection({ notes }: NotesSectionProps) {
  if (!notes || notes.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-3">Notes</h2>
      <ul className="space-y-2">
        {notes.map((note, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-gray-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
            {note}
          </li>
        ))}
      </ul>
    </section>
  );
}
