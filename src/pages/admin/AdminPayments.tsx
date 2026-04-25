import { useEffect, useMemo, useRef, useState } from "react";
import { Search as SearchIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  payment_status: string;
  order_status: string;
  cashfree_mode: string | null;
  cashfree_order_id: string | null;
  payment_session_id: string | null;
  webhook_received_at: string | null;
  created_at: string;
  updated_at: string;
};

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    failed: "bg-rose-100 text-rose-800 border-rose-200",
  };
  return map[s] ?? "bg-muted text-muted-foreground border-border";
};

const modeBadge = (m: string | null) => {
  if (m === "production") return "bg-maroon text-gold border-maroon-dp";
  if (m === "sandbox") return "bg-gold/30 text-maroon-dp border-gold/40";
  return "bg-muted text-muted-foreground border-border";
};

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminPayments() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<string>("all");
  const [pStatus, setPStatus] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{ paidOrders: number; pendingOrders: number; revenue: number } | null>(null);

  // Debounce search input -> q
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [searchInput]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [mode, pStatus, pageSize]);

  useEffect(() => {
    setLoading(true);
    api.adminOrders({ mode, payment_status: pStatus, q, page, page_size: pageSize })
      .then((d: any) => {
        setOrders(d?.orders ?? []);
        setTotal(d?.total ?? 0);
        setStats(d?.stats ?? null);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [mode, pStatus, q, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow = Math.min(page * pageSize, total);

  const cardTotals = useMemo(() => ({
    count: total,
    paid: stats?.paidOrders ?? 0,
    pending: stats?.pendingOrders ?? 0,
    revenue: stats?.revenue ?? 0,
  }), [total, stats]);

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl text-maroon-dp">Cashfree Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">All payment transactions captured by Cashfree, with mode and webhook timestamps.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.14em] text-maroon-dk mb-1">Search</span>
            <div className="relative">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Order # or Cashfree ID"
                className="bg-ivory border border-gold/40 rounded-lg pl-9 pr-3 py-2 text-sm text-maroon-dp outline-none focus:border-maroon w-64"
              />
            </div>
          </label>
          <Select label="Mode" value={mode} onChange={setMode} options={[
            { v: "all", l: "All modes" },
            { v: "sandbox", l: "Sandbox" },
            { v: "production", l: "Production" },
          ]} />
          <Select label="Payment status" value={pStatus} onChange={setPStatus} options={[
            { v: "all", l: "All statuses" },
            { v: "paid", l: "Paid" },
            { v: "pending", l: "Pending" },
            { v: "failed", l: "Failed" },
          ]} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Transactions" value={String(cardTotals.count)} />
        <Stat label="Paid" value={String(cardTotals.paid)} />
        <Stat label="Pending" value={String(cardTotals.pending)} />
        <Stat label="Revenue (paid)" value={formatINR(cardTotals.revenue)} />
      </div>

      <div className="bg-ivory rounded-xl border border-gold/25 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-warm/50 text-left text-[11px] uppercase tracking-[0.14em] text-maroon-dk">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Cashfree Order ID</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Webhook received</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No payments match these filters.</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-gold/15 hover:bg-cream-warm/30">
                  <td className="px-4 py-3 font-mono text-xs text-maroon-dp">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <div className="text-maroon-dp">{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-maroon">{formatINR(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge(o.payment_status)}`}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${modeBadge(o.cashfree_mode)}`}>
                      {o.cashfree_mode ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{o.cashfree_order_id ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(o.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(o.webhook_received_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ivory rounded-xl border border-gold/25 p-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="font-display text-2xl text-maroon-dp mt-1">{value}</div>
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <label className="flex flex-col">
      <span className="text-[10px] uppercase tracking-[0.14em] text-maroon-dk mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-ivory border border-gold/40 rounded-lg px-3 py-2 text-sm text-maroon-dp outline-none focus:border-maroon"
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
