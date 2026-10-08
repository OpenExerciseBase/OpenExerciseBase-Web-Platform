interface Props {
  label: string;
  value: string;
  sublabel?: string;
  color?: string;
}

export default function StatTile({ label, value, sublabel, color = "#0d9488" }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1.5 text-3xl font-bold tracking-tight" style={{ color }}>
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-gray-500">{sublabel}</p>}
    </div>
  );
}
