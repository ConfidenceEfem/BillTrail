import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, UserPlus, ArrowRight, Eye, EyeOff } from "lucide-react";
import { getDashboardSummary } from "../api/dashboard";
import { listInvoices } from "../api/invoices";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { formatKobo } from "../lib/money";
import { usePrivacyStore } from "../store/privacyStore";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const amountsHidden = usePrivacyStore((state) => state.amountsHidden);
  const toggleAmountsHidden = usePrivacyStore((state) => state.toggleAmountsHidden);

  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: listInvoices,
  });

  const recentInvoices = invoices?.slice(0, 5) ?? [];

  if (summaryLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (summaryError || !summary) {
    return <p className="text-sm text-red-600">Couldn't load your dashboard. Try refreshing.</p>;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{greeting()}</p>
          <h1 className="text-2xl font-semibold text-gray-900">Here's how business is going</h1>
        </div>
        <button
          onClick={toggleAmountsHidden}
          className="text-gray-400 hover:text-gray-600 p-2"
          title={amountsHidden ? "Show amounts" : "Hide amounts"}
        >
          {amountsHidden ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <MetricCard label="Total revenue" rawValue={summary.totalRevenue} />
        <MetricCard label="Outstanding" rawValue={summary.outstanding} />
        <MetricCard
          label={`Overdue${summary.overdueCount > 0 ? ` (${summary.overdueCount})` : ""}`}
          rawValue={summary.overdueAmount}
          tone={summary.overdueAmount > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <Link
          to="/invoices"
          className="gradient-button text-white rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Plus size={20} />
            <span className="text-sm font-medium">Create an invoice</span>
          </div>
          <ArrowRight size={16} />
        </Link>
        <Link
          to="/clients"
          className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center gap-3 text-gray-700">
            <UserPlus size={20} />
            <span className="text-sm font-medium">Add a client</span>
          </div>
          <ArrowRight size={16} className="text-gray-400" />
        </Link>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-medium text-gray-900">Recent invoices</h2>
        <Link to="/invoices" className="text-sm text-brand-600 font-medium">
          View all
        </Link>
      </div>

      {invoicesLoading && <p className="text-sm text-gray-500">Loading...</p>}

      {!invoicesLoading && recentInvoices.length === 0 && (
        <div className="bg-white border border-gray-200 border-dashed rounded-xl p-8 text-center">
          <p className="text-sm text-gray-500 mb-3">No invoices yet.</p>
          <Link to="/invoices" className="text-sm text-brand-600 font-medium">
            Create your first invoice
          </Link>
        </div>
      )}

      {!invoicesLoading && recentInvoices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {recentInvoices.map((invoice) => (
            <Link
              key={invoice.id}
              to={`/invoices/${invoice.id}`}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{invoice.number}</p>
                <p className="text-xs text-gray-500">{invoice.client.name}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="text-sm font-medium">{formatKobo(invoice.total)}</p>
                <StatusBadge status={invoice.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}