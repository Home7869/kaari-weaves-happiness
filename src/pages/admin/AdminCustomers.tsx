import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

export default function AdminCustomers() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { api.adminCustomers().then(setItems).catch((e) => toast.error(e.message)); }, []);
  return (
    <AdminLayout>
      <h1 className="font-display text-3xl text-maroon-dp mb-6">Customers</h1>
      <div className="bg-ivory rounded-xl border border-gold/25 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground bg-cream-warm">
            <tr><th className="p-3">Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-gold/15">
                <td className="p-3">{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone ?? "—"}</td>
                <td>{c.total_orders}</td>
                <td>{formatINR(c.total_spent)}</td>
                <td className="text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No customers yet</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
