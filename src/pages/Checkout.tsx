import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, MapPin, Loader2, Check, X, Truck, Zap } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductPlaceholder } from "@/components/site/ProductPlaceholder";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { api } from "@/lib/api";
import { loadCashfree } from "@/lib/cashfree";
import { lookupPincode, reverseGeocode, getEta, formatEtaRange, type PostOffice } from "@/lib/checkout-helpers";
import { toast } from "sonner";

type Form = {
  name: string; email: string; phone: string;
  line1: string; line2: string; city: string; state: string; pincode: string; locality: string;
};

const STORAGE_KEY = "kaari_checkout_form_v2";
const empty: Form = { name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", locality: "" };

type DeliveryType = "standard" | "express";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const sub = subtotal();
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [f, setF] = useState<Form>(empty);
  const [restored, setRestored] = useState(false);

  // Pincode state
  const [pinLoading, setPinLoading] = useState(false);
  const [pinValid, setPinValid] = useState<null | boolean>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [postOffices, setPostOffices] = useState<PostOffice[]>([]);
  const [autoFilled, setAutoFilled] = useState(false);
  const [editGeo, setEditGeo] = useState(false);

  // Phone state
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneValid, setPhoneValid] = useState(false);

  // Geo
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);

  // Delivery + promo
  const [delivery, setDelivery] = useState<DeliveryType>("standard");
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  // Pricing
  const baseShip = sub === 0 ? 0 : sub >= 999 ? 0 : 60;
  const expressShip = sub === 0 ? 0 : sub >= 999 ? 99 : 159;
  const shipping = delivery === "express" ? expressShip : baseShip;
  const discount = appliedPromo ? promoDiscount : 0;
  const total = Math.max(0, sub + shipping - discount);
  const promoBlocksCheckout = !!promo.trim() && !appliedPromo;

  // ETA
  const eta = useMemo(() => getEta(delivery), [delivery]);

  // ---- Restore from localStorage ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setF({ ...empty, ...parsed });
          setRestored(true);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Persist debounced
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(f)); } catch { /* ignore */ }
    }, 800);
    return () => clearTimeout(t);
  }, [f]);

  // ---- Pincode auto-fill ----
  const pinCtrl = useRef<AbortController | null>(null);
  useEffect(() => {
    const pin = f.pincode;
    setPinError(null);
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setPinValid(null);
      setPostOffices([]);
      return;
    }
    pinCtrl.current?.abort();
    const ctrl = new AbortController();
    pinCtrl.current = ctrl;
    const timeout = setTimeout(() => ctrl.abort(), 5000);
    setPinLoading(true);
    lookupPincode(pin, ctrl.signal)
      .then((pos) => {
        setPostOffices(pos);
        const top = pos[0];
        setF((prev) => ({
          ...prev,
          city: top.District,
          state: top.State,
          locality: prev.locality || top.Name,
        }));
        setPinValid(true);
        setAutoFilled(true);
        setEditGeo(false);
      })
      .catch((e) => {
        if (ctrl.signal.aborted && e?.name === "AbortError") {
          setPinError("Couldn't verify pincode. Please fill city & state manually.");
          setEditGeo(true);
        } else {
          setPinValid(false);
          setPinError("Invalid PIN code. Please check and re-enter.");
          setF((prev) => ({ ...prev, city: "", state: "" }));
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        setPinLoading(false);
      });
    return () => { clearTimeout(timeout); ctrl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.pincode]);

  // ---- Field updaters ----
  const update = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let v = e.target.value;
    if (k === "pincode") v = v.replace(/\D/g, "").slice(0, 6);
    if (k === "phone") {
      const digits = v.replace(/\D/g, "");
      let n = digits;
      if (n.length === 12 && n.startsWith("91")) n = n.slice(2);
      else if (n.length === 13 && n.startsWith("091")) n = n.slice(3);
      v = n.slice(0, 10);
      if (phoneError) setPhoneError(null);
      setPhoneValid(/^[6-9]\d{9}$/.test(v));
    }
    setF((prev) => ({ ...prev, [k]: v }));
  };

  const onPhoneBlur = () => {
    if (!f.phone) return;
    if (!/^[6-9]\d{9}$/.test(f.phone)) {
      setPhoneError("Please enter a valid 10-digit Indian mobile number");
      setPhoneValid(false);
    } else {
      setPhoneValid(true);
    }
  };

  const onLine1Blur = () => {
    if (!f.line1) return;
    const cap = f.line1.replace(/\b\w/g, (c) => c.toUpperCase());
    if (cap !== f.line1) setF({ ...f, line1: cap });
  };

  // ---- Use current location ----
  const useLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setF((prev) => ({
            ...prev,
            pincode: r.pincode || prev.pincode,
            line1: prev.line1 || r.line1,
            city: r.city || prev.city,
            state: r.state || prev.state,
            locality: r.locality || prev.locality,
          }));
          setEditGeo(true);
          toast.success("Location detected — please verify your address");
        } catch {
          toast.error("Couldn't detect location. Please enter manually.");
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoDenied(true);
          toast.error("Location access denied. Please enter your PIN code manually.");
        } else {
          toast.error("Couldn't detect location. Please enter manually.");
        }
      },
      { timeout: 8000, enableHighAccuracy: false },
    );
  };

  const applyPromo = async () => {
    const code = promo.trim();
    if (!code) {
      setAppliedPromo(null); setPromoDiscount(0); setPromoError(null);
      return;
    }
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await api.validatePromo(code, sub);
      if (res?.valid) {
        setAppliedPromo(res.code);
        setPromoDiscount(res.discount ?? 0);
        setPromoError(null);
        toast.success(res.message ?? "Promo applied");
      } else {
        setAppliedPromo(null);
        setPromoDiscount(0);
        setPromoError(res?.message ?? "Invalid promo code");
        toast.error(res?.message ?? "Invalid promo code");
      }
    } catch (e: any) {
      setAppliedPromo(null);
      setPromoDiscount(0);
      setPromoError(e?.message ?? "Could not validate promo");
    } finally {
      setPromoLoading(false);
    }
  };

  const clearPromo = () => {
    setPromo(""); setAppliedPromo(null); setPromoDiscount(0); setPromoError(null);
  };

  const clearForm = () => {
    setF(empty);
    localStorage.removeItem(STORAGE_KEY);
    setRestored(false);
    setPostOffices([]);
    setPinValid(null);
    setAutoFilled(false);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Cart is empty");
    if (!f.name || !f.email || !f.phone || !f.line1 || !f.city || !f.state || !f.pincode) {
      return toast.error("Please fill all required fields");
    }
    if (!/^[6-9]\d{9}$/.test(f.phone)) {
      setPhoneError("Please enter a valid 10-digit Indian mobile number");
      return toast.error("Invalid phone number");
    }
    if (!/^\d{6}$/.test(f.pincode) || pinValid === false) {
      return toast.error("Enter a valid 6-digit pincode");
    }
    if (f.line1.trim().length < 10) {
      return toast.error("Address Line 1 must be at least 10 characters");
    }
    setSubmitting(true);
    try {
      const res = await api.createOrder({
        customer: {
          name: f.name, email: f.email, phone: f.phone,
          address: { line1: f.line1, line2: f.line2, city: f.city, state: f.state, pincode: f.pincode, locality: f.locality },
        },
        items: items.map((i) => ({ product_id: i.product_id, qty: i.qty, size: i.size, color: i.color })),
        delivery_type: delivery,
        promo_code: appliedPromo,
        return_url: `${window.location.origin}/order-success?orderId={order_id}`,
      });

      if (res.payment_session_id) {
        const mode: "sandbox" | "production" = res.cashfree_mode === "production" ? "production" : "sandbox";
        const cashfree = await loadCashfree(mode);
        const returnUrl = `${window.location.origin}/order-success?orderId=${res.order_number}`;
        const result = await cashfree.checkout({
          paymentSessionId: res.payment_session_id,
          redirectTarget: "_self",
          returnUrl,
        });
        if (result?.error) {
          toast.error(result.error.message ?? "Payment failed");
          return;
        }
        if (result?.paymentDetails) {
          localStorage.removeItem(STORAGE_KEY);
          clear();
          nav(`/order-success?orderId=${res.order_number}`);
        }
      } else {
        if (res.stub) toast.success("Order created (demo mode — Cashfree not configured)");
        else toast.success("Order created");
        localStorage.removeItem(STORAGE_KEY);
        clear();
        nav(`/order-success?orderId=${res.order_number}`);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const cityStateDisabled = autoFilled && !editGeo;

  return (
    <SiteLayout>
      <section className="bg-cream py-10 md:py-12 pb-32 lg:pb-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-10">
          <form onSubmit={handlePay} className="space-y-6">
            <h1 className="font-display text-3xl md:text-4xl text-maroon-dp">Checkout</h1>

            {restored && (
              <div className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 text-sm text-maroon-dk flex items-center justify-between gap-3 animate-fade-in">
                <span>We saved your address. Continue from where you left off.</span>
                <button type="button" onClick={clearForm} className="underline text-maroon hover:text-maroon-dp shrink-0">Clear & start fresh</button>
              </div>
            )}

            {/* Section 1: Contact */}
            <Card title="Contact Information">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name *" value={f.name} onChange={update("name")} autoComplete="name" />
                <PhoneField
                  value={f.phone}
                  onChange={update("phone")}
                  onBlur={onPhoneBlur}
                  error={phoneError}
                  valid={phoneValid}
                />
                <Field label="Email *" type="email" value={f.email} onChange={update("email")} className="sm:col-span-2" autoComplete="email" />
              </div>
            </Card>

            {/* Section 2: Address */}
            <Card title="Delivery Address">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  {!geoDenied && (
                    <button
                      type="button"
                      onClick={useLocation}
                      disabled={geoLoading}
                      className="inline-flex items-center gap-1.5 bg-cream-warm hover:bg-cream border border-maroon/30 text-maroon text-[11px] uppercase tracking-[0.14em] px-3 py-2 rounded-full transition-colors disabled:opacity-60"
                    >
                      {geoLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                      {geoLoading ? "Detecting location…" : "Use current location"}
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <Field
                      label="Pincode *"
                      value={f.pincode}
                      onChange={update("pincode")}
                      placeholder="6-digit PIN"
                      inputMode="numeric"
                      maxLength={6}
                      error={pinError ?? undefined}
                      className={pinValid === false ? "field-error" : ""}
                    />
                    <div className="absolute right-3 top-[34px] flex items-center pointer-events-none">
                      {pinLoading && <Loader2 size={16} className="animate-spin text-maroon" />}
                      {!pinLoading && pinValid === true && <Check size={16} className="text-green-600" />}
                      {!pinLoading && pinValid === false && <X size={16} className="text-red-600" />}
                    </div>
                    {pinValid === true && !pinError && (
                      <p className="text-[11px] text-green-700 mt-1 flex items-center gap-1">
                        <Check size={12} /> We deliver to this pincode
                      </p>
                    )}
                  </div>

                  {postOffices.length > 1 && (
                    <label className="block">
                      <span className="text-[11px] uppercase tracking-[0.14em] text-maroon-dk block mb-1.5">Locality</span>
                      <select
                        value={f.locality}
                        onChange={update("locality")}
                        className="w-full bg-cream-warm/50 border border-maroon/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-maroon"
                      >
                        {postOffices.map((p) => (
                          <option key={p.Name} value={p.Name}>{p.Name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <Field
                  label="Address Line 1 *"
                  value={f.line1}
                  onChange={update("line1")}
                  onBlur={onLine1Blur}
                  placeholder="House No., Building Name, Street"
                  maxLength={100}
                  autoComplete="address-line1"
                />
                <Field
                  label="Address Line 2"
                  value={f.line2}
                  onChange={update("line2")}
                  placeholder="Landmark, Area, Colony (Optional)"
                  autoComplete="address-line2"
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <ReadonlyField
                    label="City / District *"
                    value={f.city}
                    onChange={update("city")}
                    disabled={cityStateDisabled}
                    onEdit={() => setEditGeo(true)}
                    showEdit={cityStateDisabled}
                  />
                  <ReadonlyField
                    label="State *"
                    value={f.state}
                    onChange={update("state")}
                    disabled={cityStateDisabled}
                    onEdit={() => setEditGeo(true)}
                    showEdit={cityStateDisabled}
                  />
                </div>
              </div>
            </Card>

            {/* Section 3: Delivery method */}
            <Card title="Delivery Method">
              <div className="space-y-3">
                <DeliveryCard
                  selected={delivery === "standard"}
                  onSelect={() => setDelivery("standard")}
                  icon={<Truck size={20} />}
                  title="Standard Delivery"
                  desc="Estimated delivery in 8–10 working days · Best for non-urgent orders"
                  price={baseShip === 0 ? "FREE" : formatINR(baseShip)}
                  priceClass={baseShip === 0 ? "text-green-700" : "text-maroon-dp"}
                  eta={`Arrives by ${formatEtaRange(getEta("standard").from, getEta("standard").to)}`}
                />
                <DeliveryCard
                  selected={delivery === "express"}
                  onSelect={() => setDelivery("express")}
                  icon={<Zap size={20} />}
                  title="Express Delivery"
                  desc="Estimated delivery in 3–5 working days · Priority packaging & dispatch within 24h"
                  price={`+ ${formatINR(expressShip)}`}
                  priceClass="text-maroon-dp"
                  eta={`Arrives by ${formatEtaRange(getEta("express").from, getEta("express").to)}`}
                  note={`${formatINR(expressShip)} added to your order total`}
                />
                {delivery === "express" && sub < 999 && (
                  <p className="text-xs text-muted-foreground">
                    Save {formatINR(expressShip - baseShip)} with Standard Delivery
                  </p>
                )}
              </div>
            </Card>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock size={14} /> Secure Checkout · 100% Safe Payments via Cashfree
            </div>

            <button
              disabled={submitting || items.length === 0}
              className="hidden lg:block w-full bg-gold hover:bg-gold-lt disabled:opacity-50 text-maroon-dp font-semibold py-4 rounded-full text-sm uppercase tracking-[0.16em] transition-colors"
            >
              {submitting ? "Processing…" : `Pay ${formatINR(total)}`}
            </button>
          </form>

          {/* Sidebar */}
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

            {/* Promo */}
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  value={promo}
                  onChange={(e) => {
                    setPromo(e.target.value);
                    if (appliedPromo) { setAppliedPromo(null); setPromoDiscount(0); }
                    if (promoError) setPromoError(null);
                  }}
                  placeholder="Promo code (try KAARI10)"
                  className={`flex-1 bg-cream-warm/50 border rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon ${
                    promoError ? "border-red-500" : appliedPromo ? "border-green-600" : "border-maroon/15"
                  }`}
                />
                {appliedPromo ? (
                  <button
                    type="button"
                    onClick={clearPromo}
                    className="px-4 py-2 text-xs uppercase tracking-[0.14em] bg-cream border border-maroon/30 text-maroon rounded-lg hover:bg-cream-warm transition-colors"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={promoLoading || !promo.trim()}
                    className="px-4 py-2 text-xs uppercase tracking-[0.14em] bg-maroon text-ivory rounded-lg hover:bg-maroon-dp transition-colors disabled:opacity-50"
                  >
                    {promoLoading ? "…" : "Apply"}
                  </button>
                )}
              </div>
              {promoError && <p className="text-[11px] text-red-600 mt-1.5">{promoError}</p>}
              {appliedPromo && !promoError && (
                <p className="text-[11px] text-green-700 mt-1.5">✓ {appliedPromo} applied — you saved {formatINR(discount)}</p>
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-gold/25 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(sub)}</span></div>
              <div className="flex justify-between">
                <span>Delivery ({delivery === "express" ? "Express" : "Standard"})</span>
                <span className={shipping === 0 ? "text-green-700 font-medium" : ""}>
                  {shipping === 0 ? "FREE" : formatINR(shipping)}
                </span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-green-700">
                  <span>Discount ({appliedPromo})</span><span>− {formatINR(discount)}</span>
                </div>
              )}
              <div
                key={total}
                className="flex justify-between font-display text-2xl text-maroon-dp pt-2 border-t border-gold/20 animate-fade-in"
              >
                <span>Total</span><span>{formatINR(total)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                Arrives by {formatEtaRange(eta.from, eta.to)}
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                const form = (e.currentTarget.closest("section")?.querySelector("form") as HTMLFormElement | null);
                form?.requestSubmit();
              }}
              disabled={submitting || items.length === 0}
              className="hidden lg:block mt-5 w-full bg-gold hover:bg-gold-lt disabled:opacity-50 text-maroon-dp font-semibold h-[52px] rounded-full text-sm uppercase tracking-[0.16em] transition-colors"
            >
              {submitting ? "Processing…" : "Proceed to Pay"}
            </button>

            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>🔒 Secure</span><span>✓ Cashfree</span><span>↩ Easy Returns</span>
            </div>
          </aside>
        </div>

        {/* Mobile sticky bottom bar */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-ivory border-t border-gold/30 px-4 py-3 flex items-center gap-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)]">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Total</div>
            <div className="font-display text-xl text-maroon-dp">{formatINR(total)}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              const form = document.querySelector("form") as HTMLFormElement | null;
              form?.requestSubmit();
            }}
            disabled={submitting || items.length === 0}
            className="bg-gold hover:bg-gold-lt disabled:opacity-50 text-maroon-dp font-semibold px-6 py-3 rounded-full text-xs uppercase tracking-[0.14em] transition-colors"
          >
            {submitting ? "Processing…" : "Proceed to Pay →"}
          </button>
        </div>
      </section>
    </SiteLayout>
  );
}

// ---------- Subcomponents ----------

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-ivory rounded-2xl p-6 border border-gold/25">
      <h2 className="font-display text-xl text-maroon-dp mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label, className, error, ...rest
}: { label: string; className?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-[11px] uppercase tracking-[0.14em] text-maroon-dk block mb-1.5">{label}</span>
      <input
        {...rest}
        className={`w-full bg-cream-warm/50 border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-maroon ${
          error ? "border-red-500" : "border-maroon/15"
        }`}
      />
      {error && <span className="text-[11px] text-red-600 mt-1 block">{error}</span>}
    </label>
  );
}

function PhoneField({
  value, onChange, onBlur, error, valid,
}: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onBlur: () => void;
  error: string | null;
  valid: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-maroon-dk block mb-1.5">Mobile Number *</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+91</span>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="10-digit mobile"
          autoComplete="tel-national"
          className={`w-full bg-cream-warm/50 border rounded-lg pl-12 pr-9 py-2.5 text-sm outline-none focus:border-maroon ${
            error ? "border-red-500" : "border-maroon/15"
          }`}
        />
        {valid && !error && (
          <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
        )}
      </div>
      {error && <span className="text-[11px] text-red-600 mt-1 block">{error}</span>}
    </label>
  );
}

function ReadonlyField({
  label, value, onChange, disabled, onEdit, showEdit,
}: {
  label: string; value: string; onChange: React.ChangeEventHandler<HTMLInputElement>;
  disabled: boolean; onEdit: () => void; showEdit: boolean;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.14em] text-maroon-dk">{label}</span>
        {showEdit && (
          <button type="button" onClick={onEdit} className="text-[11px] text-maroon underline hover:text-maroon-dp">Edit</button>
        )}
      </div>
      <input
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-maroon ${
          disabled ? "bg-cream-warm/30 border-maroon/10 text-muted-foreground" : "bg-cream-warm/50 border-maroon/15"
        }`}
      />
    </label>
  );
}

function DeliveryCard({
  selected, onSelect, icon, title, desc, price, priceClass, eta, note,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  price: string;
  priceClass?: string;
  eta: string;
  note?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl p-4 transition-all ${
        selected
          ? "bg-cream-warm border border-maroon/15 border-l-[3px] border-l-maroon"
          : "bg-ivory border border-maroon/10 hover:border-maroon/25"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? "border-maroon" : "border-maroon/30"
        }`}>
          {selected && <span className="w-2 h-2 bg-maroon rounded-full" />}
        </span>
        <span className="text-maroon-dp shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-maroon-dp">{title}</h3>
              {selected && (
                <span className="text-[10px] uppercase tracking-[0.12em] bg-gold/30 text-maroon-dp px-2 py-0.5 rounded-full">Selected</span>
              )}
            </div>
            <span className={`text-sm font-semibold ${priceClass ?? ""}`}>{price}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          <p className="text-[11px] text-maroon mt-1">{eta}</p>
          {note && selected && <p className="text-[11px] text-muted-foreground mt-1">{note}</p>}
        </div>
      </div>
    </button>
  );
}
