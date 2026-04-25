import { useEffect, useState } from "react";
import { Truck, Package as PackageIcon } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

const STATUSES = ["processing", "packed", "shipped", "delivered", "cancelled"];

type Order = {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total: number;
  subtotal: number;
  shipping_charges: number;
  payment_status: string;
  order_status: string;
  shipping_address: any;
  items: any[];
  tracking_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
};

function fmt(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState<Order | null>(null);

  const load = () =>
    api.adminOrders({ page: 1, page_size: 100 })
      .then((d: any) => setOrders(d?.orders ?? []))
      .catch((e) => toast.error(e.message));

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, order_status: string) => {
    try { await api.adminUpdateOrder(id, { order_status }); toast.success("Status updated"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl text-maroon-dp mb-6">Orders</h1>
      <div className="bg-ivory rounded-xl border border-gold/25 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground bg-cream-warm">
              <tr>
                <th className="p-3">Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Shipment</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-gold/15">
                  <td className="p-3 font-mono text-xs">{o.order_number}</td>
                  <td className="text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>
                    {o.customer_name}
                    <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                  </td>
                  <td>{formatINR(o.total)}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded ${o.payment_status === "paid" ? "bg-green-100 text-green-800" : o.payment_status === "failed" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td>
                    <select value={o.order_status} onChange={(e) => updateStatus(o.id, e.target.value)} className="bg-cream border border-gold/30 rounded px-2 py-1 text-xs">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="text-xs">
                    {o.tracking_number ? (
                      <div>
                        <div className="text-maroon-dp font-medium flex items-center gap-1"><Truck size={12} /> {o.tracking_carrier ?? "—"}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{o.tracking_number}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="pr-3"><button onClick={() => setOpen(o)} className="text-xs text-maroon underline">View</button></td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <OrderDrawer
          order={open}
          onClose={() => setOpen(null)}
          onSaved={() => { load(); }}
        />
      )}
    </AdminLayout>
  );
}

function OrderDrawer({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: () => void }) {
  const [carrier, setCarrier] = useState(order.tracking_carrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? "");
  const [status, setStatus] = useState(order.order_status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.adminUpdateOrder(order.id, {
        order_status: status,
        tracking_carrier: carrier,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
      });
      toast.success("Shipment updated · customer can now see this on the tracking page");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-ivory rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-2xl text-maroon-dp">Order {order.order_number}</h2>
          <button onClick={onClose} className="text-muted-foreground">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Customer</div>
            {order.customer_name}<br/>{order.customer_email}<br/>{order.customer_phone}
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Address</div>
            {Object.values(order.shipping_address ?? {}).filter(Boolean).join(", ")}
          </div>
        </div>

        <div className="border-t border-gold/20 pt-4">
          <div className="text-xs uppercase text-muted-foreground mb-2">Items</div>
          {(order.items ?? []).map((it: any, i: number) => (
            <div key={i} className="flex justify-between py-1 text-sm"><span>{it.name} × {it.qty}</span><span>{formatINR((it.price ?? 0) * (it.qty ?? 1))}</span></div>
          ))}
          <div className="flex justify-between pt-2 mt-2 border-t border-gold/20 text-sm"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>Shipping</span><span>{formatINR(order.shipping_charges)}</span></div>
          <div className="flex justify-between font-semibold text-maroon-dp mt-1"><span>Total</span><span>{formatINR(order.total)}</span></div>
        </div>

        <div className="border-t border-gold/20 pt-4 mt-5">
          <h3 className="font-display text-lg text-maroon-dp flex items-center gap-2 mb-3"><Truck size={16} /> Shipment</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Field label="Order status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-cream-warm/40 border border-maroon/15 rounded-lg px-3 py-2 text-sm">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Carrier">
              <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. Delhivery" className="w-full bg-cream-warm/40 border border-maroon/15 rounded-lg px-3 py-2 text-sm" />
            </Field>
            <Field label="Tracking number">
              <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="AWB / Consignment #" className="w-full bg-cream-warm/40 border border-maroon/15 rounded-lg px-3 py-2 text-sm" />
            </Field>
            <Field label="Tracking URL (optional)">
              <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://…" className="w-full bg-cream-warm/40 border border-maroon/15 rounded-lg px-3 py-2 text-sm" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><PackageIcon size={12} /> Shipped: {fmt(order.shipped_at)}</div>
            <div className="flex items-center gap-2"><PackageIcon size={12} /> Delivered: {fmt(order.delivered_at)}</div>
          </div>
          <button
            disabled={saving}
            onClick={save}
            className="mt-5 bg-maroon hover:bg-maroon-dp disabled:opacity-50 text-gold font-semibold py-2.5 px-5 rounded-full text-xs uppercase tracking-[0.16em]"
          >
            {saving ? "Saving…" : "Save shipment update"}
          </button>
          <p className="text-[11px] text-muted-foreground mt-2">
            Setting status to <strong>shipped</strong> or <strong>delivered</strong> automatically stamps the timestamp and shows it on the customer's tracking page.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.14em] text-maroon-dk block mb-1">{label}</span>
      {children}
    </label>
  );
}
