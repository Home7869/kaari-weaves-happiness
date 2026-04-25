import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { Plus } from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api.adminOrders().then(setData).catch(() => {}); }, []);
  const s = data?.stats;
  const stats = [
    { label: "Total Orders", value: s?.totalOrders ?? 0 },
    { label: "Revenue", value: s ? formatINR(s.revenue) : "—" },
    { label: "Pending Orders", value: s?.pendingOrders ?? 0 },
    { label: "Products", value: s?.productCount ?? 0 },
    { label: "Customers", value: s?.customerCount ?? 0 },
  ];
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-3xl text-maroon-dp">Dashboard</h1>
        <Link to="/admin/products/new" className="px-4 py-2 bg-maroon text-gold rounded-lg text-xs uppercase tracking-[0.14em] flex items-center gap-2"><Plus size={14} />Add Product</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {stats.map((st) => (
          <div key={st.label} className="bg-ivory rounded-xl p-5 border border-gold/25">
            <div className="text-[10px] uppercase tracking-[0.16em] text-maroon">{st.label}</div>
            <div className="font-display text-3xl text-maroon-dp mt-1">{st.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-ivory rounded-xl p-6 border border-gold/25">
        <h2 className="font-display text-xl text-maroon-dp mb-4">Recent Orders</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground border-b border-gold/20">
            <tr><th className="pb-2">Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th></tr>
          </thead>
          <tbody>
            {(data?.orders ?? []).slice(0, 8).map((o: any) => (
              <tr key={o.id} className="border-b border-gold/10">
                <td className="py-3 font-mono text-xs">{o.order_number}</td>
                <td>{o.customer_name}</td>
                <td>{formatINR(o.total)}</td>
                <td><span className={`px-2 py-0.5 rounded text-[10px] ${o.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{o.payment_status}</span></td>
                <td className="capitalize">{o.order_status}</td>
              </tr>
            ))}
            {(!data?.orders || data.orders.length === 0) && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No orders yet</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
