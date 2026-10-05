import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "../api/auth";
import { MetricCard } from "../components/MetricCard";




export function DashboardPage() {

   const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">Couldn't load your dashboard. Try refreshing.</p>;
  }


    return (
    <div>
      <h1 className="text-xl font-medium text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
       <MetricCard label="Total revenue" rawValue={data.totalRevenue} />
<MetricCard label="Outstanding" rawValue={data.outstanding} />
<MetricCard
  label={`Overdue${data.overdueCount > 0 ? ` (${data.overdueCount})` : ""}`}
  rawValue={data.overdueAmount}
  tone={data.overdueAmount > 0 ? "danger" : "default"}
/>
      </div>
    </div>
  );
}