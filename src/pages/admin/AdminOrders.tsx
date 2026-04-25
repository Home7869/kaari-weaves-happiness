import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

const STATUSES = ["processing", "packed", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [open, setOpen] = useState<any | null>(null);

  const load = () => api.adminOrders().then(setOrders).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, order_status: string) => {
    try { await api.adminUpdateOrder(id, { order_status }); toast.success("Updated"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl text-maroon-dp mb-6">Orders</h1>
      <div className="bg-ivory rounded-xl border border-gold/25 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground bg-cream-warm">
            <tr><th className="p-3">Order #</th><th>Date</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-gold/15">
                <td className="p-3 font-mono text-xs">{o.order_number}</td>
                <td className="text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                <td>{o.customer_name}<div className="text-xs text-muted-foreground">{o.customer_email}</div></td>
                <td>{formatINR(o.total)}</td>
                <td><span className={`text-xs px-2 py-0.5 rounded ${o.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{o.payment_status}</span></td>
                <td>
                  <select value={o.order_status} onChange={(e) => updateStatus(o.id, e.target.value)} className="bg-cream border border-gold/30 rounded px-2 py-1 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="pr-3"><button onClick={() => setOpen(o)} className="text-xs text-maroon underline">View</button></td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No orders yet</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setOpen(null)}>
          <div className="bg-ivory rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-2xl text-maroon-dp">Order {open.order_number}</h2>
              <button onClick={() => setOpen(null)} className="text-muted-foreground">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><div className="text-xs uppercase text-muted-foreground">Customer</div>{open.customer_name}<br/>{open.customer_email}<br/>{open.customer_phone}</div>
              <div><div className="text-xs uppercase text-muted-foreground">Address</div>{Object.values(open.shipping_address ?? {}).filter(Boolean).join(", ")}</div>
            </div>
            <div className="border-t border-gold/20 pt-4">
              <div className="text-xs uppercase text-muted-foreground mb-2">Items</div>
              {(open.items ?? []).map((it: any, i: number) => (
                <div key={i} className="flex justify-between py-1 text-sm"><span>{it.name} × {it.qty}</span><span>{formatINR((it.price ?? 0) * (it.qty ?? 1))}</span></div>
              ))}
              <div className="flex justify-between pt-2 mt-2 border-t border-gold/20 text-sm"><span>Subtotal</span><span>{formatINR(open.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span>Shipping</span><span>{formatINR(open.shipping_charges)}</span></div>
              <div className="flex justify-between font-semibold text-maroon-dp mt-1"><span>Total</span><span>{formatINR(open.total)}</span></div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
