type MetricCardProps = {
  label: string;
  value: string;
  tone?: "default" | "danger";
};

export function MetricCard({ label, value, tone = "default" }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-4">
      <p className="text-sm text-gray-500 mb-1.5">{label}</p>
      <p className={`text-2xl font-medium ${tone === "danger" ? "text-red-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}