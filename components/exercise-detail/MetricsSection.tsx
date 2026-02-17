interface Metric {
  type: string;
  unit: string;
  notes: string;
}

interface MetricsSectionProps {
  metrics: Metric[];
}

export default function MetricsSection({ metrics }: MetricsSectionProps) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Performance metrics</h2>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-2.5 font-semibold text-gray-700">Type</th>
              <th className="px-4 py-2.5 font-semibold text-gray-700">Unit</th>
              <th className="px-4 py-2.5 font-semibold text-gray-700">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {metrics.map((m, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-medium text-gray-900">
                  {m.type || "—"}
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {m.unit || "—"}
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {m.notes || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
