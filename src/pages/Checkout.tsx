import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductPlaceholder } from "@/components/site/ProductPlaceholder";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { api } from "@/lib/api";
import { loadCashfree } from "@/lib/cashfree";
import { toast } from "sonner";

type Form = { name: string; email: string; phone: string; line1: string; line2: string; city: string; state: string; pincode: string };

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const sub = subtotal();
  const shipping = sub === 0 ? 0 : sub >= 999 ? 0 : 60;
  const total = sub + shipping;
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState<Form>({ name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" });

  const update = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Cart is empty");
    if (!f.name || !f.email || !f.phone || !f.line1 || !f.city || !f.state || !f.pincode) {
      return toast.error("Please fill all required fields");
    }
    // Normalize & validate Indian phone for Cashfree
    const digits = f.phone.replace(/\D/g, "");
    let normalizedPhone = digits;
    if (digits.length === 12 && digits.startsWith("91")) normalizedPhone = digits.slice(2);
    else if (digits.length === 13 && digits.startsWith("091")) normalizedPhone = digits.slice(3);
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return toast.error("Enter a valid 10-digit Indian mobile number (starting 6-9)");
    }
    if (!/^\d{6}$/.test(f.pincode)) {
      return toast.error("Enter a valid 6-digit pincode");
    }
    setSubmitting(true);
    try {
      const res = await api.createOrder({
        customer: {
          name: f.name, email: f.email, phone: normalizedPhone,
          address: { line1: f.line1, line2: f.line2, city: f.city, state: f.state, pincode: f.pincode },
        },
        items: items.map((i) => ({ product_id: i.product_id, qty: i.qty, size: i.size, color: i.color })),
        return_url: `${window.location.origin}/order-success?orderId={order_id}`,
      });

      if (res.payment_session_id) {
        // Real Cashfree Drop-in checkout
        const mode: "sandbox" | "production" = res.cashfree_mode === "production" ? "production" : "sandbox";
        const cashfree = await loadCashfree(mode);
        const returnUrl = `${window.location.origin}/order-success?orderId=${res.order_number}`;
        const result = await cashfree.checkout({
          paymentSessionId: res.payment_session_id,
          redirectTarget: "_self",
          returnUrl,
        });
        // For _self redirect, code below typically does not execute (browser navigates away).
        if (result?.error) {
          toast.error(result.error.message ?? "Payment failed");
          return;
        }
        if (result?.paymentDetails) {
          clear();
          nav(`/order-success?orderId=${res.order_number}`);
        }
      } else if (res.stub) {
        toast.success("Order created (demo mode — Cashfree not configured)");
        clear();
        nav(`/order-success?orderId=${res.order_number}`);
      } else {
        toast.success("Order created");
        clear();
        nav(`/order-success?orderId=${res.order_number}`);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <section className="bg-cream py-12">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[1fr_380px] gap-10">
          <form onSubmit={handlePay} className="space-y-6">
            <h1 className="font-display text-4xl text-maroon-dp">Checkout</h1>

            <div className="bg-ivory rounded-2xl p-6 border border-gold/25">
              <h2 className="font-display text-xl text-maroon-dp mb-4">Customer Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name *" value={f.name} onChange={update("name")} />
                <Field label="Phone *" value={f.phone} onChange={update("phone")} placeholder="10-digit number" />
                <Field label="Email *" type="email" value={f.email} onChange={update("email")} className="sm:col-span-2" />
              </div>
            </div>

            <div className="bg-ivory rounded-2xl p-6 border border-gold/25">
              <h2 className="font-display text-xl text-maroon-dp mb-4">Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Address Line 1 *" value={f.line1} onChange={update("line1")} className="sm:col-span-2" />
                <Field label="Address Line 2" value={f.line2} onChange={update("line2")} className="sm:col-span-2" />
                <Field label="City *" value={f.city} onChange={update("city")} />
                <Field label="State *" value={f.state} onChange={update("state")} />
                <Field label="Pincode *" value={f.pincode} onChange={update("pincode")} />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock size={14} /> Secure Checkout · 100% Safe Payments via Cashfree
            </div>

            <button
              disabled={submitting || items.length === 0}
              className="w-full bg-gold hover:bg-gold-lt disabled:opacity-50 text-maroon-dp font-semibold py-4 rounded-full text-sm uppercase tracking-[0.16em] transition-colors"
            >
              {submitting ? "Processing…" : `Pay ${formatINR(total)}`}
            </button>
          </form>

          <aside className="bg-ivory rounded-2xl p-6 border border-gold/25 h-fit lg:sticky lg:top-24">
            <h2 className="font-display text-xl text-maroon-dp mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {items.length === 0 && <p className="text-sm text-muted-foreground">Your cart is empty.</p>}
              {items.map((i, k) => (
                <div key={k} className="flex gap-3">
                  <div className="w-14 h-16 rounded-md overflow-hidden bg-cream shrink-0">
                    {i.image ? <img src={i.image} alt={i.name} className="w-full h-full object-cover" /> : <ProductPlaceholder category="all" name={i.name} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-maroon-dp truncate">{i.name}</p>
                    <p className="text-[11px] text-muted-foreground">Qty {i.qty}{i.size ? ` · ${i.size}` : ""}{i.color ? ` · ${i.color}` : ""}</p>
                  </div>
                  <span className="text-sm font-medium text-maroon">{formatINR(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-gold/25 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(sub)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? "FREE" : formatINR(shipping)}</span></div>
              <div className="flex justify-between font-display text-xl text-maroon-dp pt-2 border-t border-gold/20"><span>Total</span><span>{formatINR(total)}</span></div>
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ label, className, ...rest }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-[11px] uppercase tracking-[0.14em] text-maroon-dk block mb-1.5">{label}</span>
      <input {...rest} className="w-full bg-cream-warm/50 border border-maroon/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-maroon" />
    </label>
  );
}
