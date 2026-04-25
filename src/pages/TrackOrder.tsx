import { useState } from "react";
import { Search as SearchIcon, Package, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductPlaceholder } from "@/components/site/ProductPlaceholder";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

type TrackResult = {
  order_number: string;
  customer_name: string;
  items: any[];
  subtotal: number;
  shipping_charges: number;
  total: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string;
  webhook_received_at: string | null;
  shipping_address: any;
};

const ORDER_STEPS = [
  { key: "processing", label: "Processing", icon: Clock },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
] as const;

function fmt(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) {
      return toast.error("Please enter both your order number and email");
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.trackOrder(orderNumber.trim(), email.trim());
      setResult(res as TrackResult);
    } catch (err: any) {
      toast.error(err.message ?? "Could not find that order");
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = result
    ? ORDER_STEPS.findIndex((s) => s.key === result.order_status)
    : -1;
  const isCancelled = result?.order_status === "cancelled";

  return (
    <SiteLayout>
      <section className="bg-cream py-14">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="font-display text-4xl md:text-5xl text-maroon-dp">Track your order</h1>
          <p className="text-muted-foreground mt-2">Enter your order number and the email used at checkout.</p>

          <form onSubmit={submit} className="mt-8 bg-ivory rounded-2xl border border-gold/25 p-6 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <Field label="Order number" value={orderNumber} onChange={setOrderNumber} placeholder="KAARI-XXXXX-XXXX" />
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <button
              disabled={loading}
              className="bg-maroon hover:bg-maroon-dp disabled:opacity-50 text-gold font-semibold py-3 px-6 rounded-full text-sm uppercase tracking-[0.16em] flex items-center gap-2 justify-center"
            >
              <SearchIcon size={14} /> {loading ? "Searching…" : "Track"}
            </button>
          </form>

          {result && (
            <div className="mt-8 space-y-6">
              {/* Header */}
              <div className="bg-ivory rounded-2xl border border-gold/25 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Order</p>
                    <h2 className="font-display text-2xl text-maroon-dp font-mono">{result.order_number}</h2>
                    <p className="text-sm text-muted-foreground mt-1">Placed {fmt(result.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <PaymentBadge status={result.payment_status} />
                    {result.webhook_received_at && (
                      <p className="text-[11px] text-muted-foreground mt-2">Confirmed by gateway · {fmt(result.webhook_received_at)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status timeline */}
              <div className="bg-ivory rounded-2xl border border-gold/25 p-6">
                <h3 className="font-display text-lg text-maroon-dp mb-5">Order status</h3>
                {isCancelled ? (
                  <div className="flex items-center gap-3 text-rose-700">
                    <XCircle size={20} /> <span className="font-medium">This order was cancelled.</span>
                  </div>
                ) : (
                  <ol className="grid grid-cols-3 gap-2">
                    {ORDER_STEPS.map((s, i) => {
                      const Icon = s.icon;
                      const reached = stepIndex >= i;
                      const current = stepIndex === i;
                      return (
                        <li key={s.key} className="flex flex-col items-center text-center">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-colors ${
                            reached ? "bg-maroon border-maroon text-gold" : "bg-cream-warm/40 border-gold/30 text-muted-foreground"
                          } ${current ? "ring-4 ring-gold/30" : ""}`}>
                            <Icon size={18} />
                          </div>
                          <span className={`mt-2 text-xs uppercase tracking-[0.14em] ${reached ? "text-maroon-dp" : "text-muted-foreground"}`}>
                            {s.label}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
                <p className="text-xs text-muted-foreground mt-5">Last updated {fmt(result.updated_at)}</p>
              </div>

              {/* Items */}
              <div className="bg-ivory rounded-2xl border border-gold/25 p-6">
                <h3 className="font-display text-lg text-maroon-dp mb-4 flex items-center gap-2"><Package size={16} /> Items</h3>
                <div className="space-y-3">
                  {(result.items ?? []).map((i: any, k: number) => (
                    <div key={k} className="flex gap-3">
                      <div className="w-14 h-16 rounded-md overflow-hidden bg-cream shrink-0">
                        {i.image ? <img src={i.image} alt={i.name} className="w-full h-full object-cover" /> : <ProductPlaceholder category="all" name={i.name} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-maroon-dp truncate">{i.name}</p>
                        <p className="text-[11px] text-muted-foreground">Qty {i.qty}{i.size ? ` · ${i.size}` : ""}{i.color ? ` · ${i.color}` : ""}</p>
                      </div>
                      <span className="text-sm font-medium text-maroon">{formatINR((i.price ?? 0) * (i.qty ?? 1))}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-gold/25 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(result.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{result.shipping_charges === 0 ? "FREE" : formatINR(result.shipping_charges)}</span></div>
                  <div className="flex justify-between font-display text-xl text-maroon-dp pt-2 border-t border-gold/20"><span>Total</span><span>{formatINR(result.total)}</span></div>
                </div>
              </div>

              {/* Shipping */}
              {result.shipping_address && (
                <div className="bg-ivory rounded-2xl border border-gold/25 p-6">
                  <h3 className="font-display text-lg text-maroon-dp mb-3">Shipping to</h3>
                  <p className="text-sm text-maroon-dp">{result.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[result.shipping_address.line1, result.shipping_address.line2, result.shipping_address.city, result.shipping_address.state, result.shipping_address.pincode].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-maroon-dk block mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-cream-warm/50 border border-maroon/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-maroon"
      />
    </label>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const cls = status === "paid"
    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : status === "failed"
    ? "bg-rose-100 text-rose-800 border-rose-200"
    : "bg-amber-100 text-amber-800 border-amber-200";
  return (
    <span className={`inline-block text-[11px] uppercase tracking-[0.16em] px-3 py-1 rounded-full border ${cls}`}>
      Payment · {status}
    </span>
  );
}
