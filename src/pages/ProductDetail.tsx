import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Heart, MessageCircle, Shield, Truck, Sparkles, Plus, Minus } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { ProductPlaceholder } from "@/components/site/ProductPlaceholder";
import { api } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { formatINR, categoryLabel } from "@/lib/format";
import { toast } from "sonner";

type ProductFull = Product & {
  description: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  care_instructions: string;
  shipping_info: string;
};

type Review = { id: string; reviewer_name: string; rating: number; review_text: string; verified: boolean; created_at: string };

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const [p, setP] = useState<ProductFull | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState<string | undefined>();
  const [color, setColor] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [openAcc, setOpenAcc] = useState<string | null>("desc");
  const add = useCart((s) => s.add);

  useEffect(() => {
    setP(null);
    api.getProductBySlug(slug).then((d: any) => {
      if (!d) return;
      const full = d as ProductFull;
      setP(full);
      if (Array.isArray(full.sizes) && full.sizes.length) setSize(full.sizes[0]);
      if (Array.isArray(full.colors) && full.colors.length) setColor(full.colors[0].name);
      api.getReviews(full.id).then(setReviews as any);
      api.listProducts({ category: full.category }).then((rs) => setRelated((rs as Product[]).filter((x) => x.id !== full.id).slice(0, 4)));
    });
  }, [slug]);

  if (!p) {
    return <SiteLayout><div className="max-w-7xl mx-auto px-6 py-20 text-center text-muted-foreground">Loading…</div></SiteLayout>;
  }

  const discount = p.original_price && p.original_price > p.price
    ? Math.round((1 - p.price / p.original_price) * 100) : null;
  const img = p.images?.[imgIdx];

  const handleAdd = () => {
    add({ product_id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images?.[0] ?? null, size, color }, qty);
    toast.success(`${p.name} added to cart`);
  };

  return (
    <SiteLayout>
      <section className="bg-cream py-10">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10">
          {/* Gallery */}
          <div>
            <div className="aspect-[4/5] rounded-2xl border border-gold/30 overflow-hidden bg-ivory">
              {img
                ? <img src={img} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                : <ProductPlaceholder category={p.category} name={p.name} />}
            </div>
            {p.images && p.images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {p.images.map((src, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`w-[70px] h-[70px] rounded-lg overflow-hidden border-2 ${i === imgIdx ? "border-maroon" : "border-transparent"}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex gap-2 mb-3">
              {p.badge && <span className="px-2.5 py-1 bg-maroon text-gold rounded-full text-[10px] uppercase tracking-[0.14em] font-semibold">{p.badge}</span>}
              {p.stock_status === "made_to_order" && <span className="px-2.5 py-1 bg-green-700 text-white rounded-full text-[10px] uppercase tracking-[0.14em] font-semibold">Made to Order</span>}
              <span className="px-2.5 py-1 border border-gold text-gold-lt bg-maroon-dp rounded-full text-[10px] uppercase tracking-[0.14em]">Handmade</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-maroon mb-2 pb-2 border-b border-gold/30 inline-block">{categoryLabel(p.category)} · Spring 2026</p>
            <h1 className="font-display font-bold text-maroon-dp leading-tight" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>{p.name}</h1>
            <div className="flex items-center gap-2 mt-3 text-gold">
              {[...Array(5)].map((_, i) => <Star key={i} size={15} fill={i < Math.round(p.rating) ? "currentColor" : "none"} />)}
              <span className="text-sm text-muted-foreground ml-1">{p.rating.toFixed(1)} · {p.review_count} reviews</span>
            </div>
            <div className="flex items-baseline gap-3 mt-5">
              <span className="font-display text-4xl text-maroon font-semibold">{formatINR(p.price)}</span>
              {p.original_price && p.original_price > p.price && (
                <>
                  <span className="text-base text-muted-foreground line-through">{formatINR(p.original_price)}</span>
                  {discount && <span className="text-xs bg-green-700 text-white px-2 py-0.5 rounded">{discount}% off</span>}
                </>
              )}
            </div>

            {p.sizes?.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-maroon-dk">Size</span>
                  <button className="text-xs text-maroon underline">Size Guide</button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {p.sizes.map((s) => (
                    <button key={s} onClick={() => setSize(s)}
                      className={`px-4 py-2 rounded-full border text-sm transition-colors ${size === s ? "bg-maroon text-gold border-maroon" : "border-maroon/30 text-maroon-dk hover:border-maroon"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {p.colors?.length > 0 && (
              <div className="mt-5">
                <div className="text-[11px] uppercase tracking-[0.16em] text-maroon-dk mb-2">
                  Color: <span className="normal-case tracking-normal text-maroon-dp">{color}</span>
                </div>
                <div className="flex gap-2.5">
                  {p.colors.map((c) => (
                    <button key={c.name} onClick={() => setColor(c.name)} aria-label={c.name}
                      className={`w-9 h-9 rounded-full transition-all ${color === c.name ? "ring-2 ring-offset-2 ring-maroon" : ""}`}
                      style={{ background: c.hex }} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mt-6">
              <div className="flex items-center border border-maroon/25 rounded-xl">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-11 flex items-center justify-center text-maroon"><Minus size={14} /></button>
                <span className="w-10 text-center text-sm">{qty}</span>
                <button onClick={() => setQty(Math.min(10, qty + 1))} className="w-10 h-11 flex items-center justify-center text-maroon"><Plus size={14} /></button>
              </div>
              <button onClick={handleAdd} className="flex-1 bg-maroon hover:bg-maroon-dk text-gold font-semibold py-3 rounded-xl text-[12px] uppercase tracking-[0.16em] transition-colors">
                Add to Cart
              </button>
              <Link to="/checkout" onClick={handleAdd} className="hidden sm:block px-6 py-3 border-2 border-maroon text-maroon hover:bg-maroon hover:text-gold rounded-xl text-[12px] uppercase tracking-[0.16em] font-semibold transition-colors">
                Buy Now
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-gold/30">
              {[[<Heart size={14} key="h" />, "Handmade"], [<Truck size={14} key="t" />, "Free Ship ₹999+"], [<Shield size={14} key="s" />, "Secure UPI"]].map(([ic, l], i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-maroon-dk justify-center"><span className="text-maroon">{ic}</span>{l}</div>
              ))}
            </div>

            <div className="mt-5 p-4 border-2 border-green-600/30 rounded-xl bg-green-50/50">
              <div className="flex items-start gap-3">
                <MessageCircle className="text-green-700 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm text-maroon-dp">Want a custom colour or size? Chat with us on WhatsApp for custom orders.</p>
                  <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs font-semibold text-green-700 hover:text-green-800 uppercase tracking-[0.14em]">Chat Now →</a>
                </div>
              </div>
            </div>

            {/* Accordion */}
            <div className="mt-8 divide-y divide-gold/25 border-y border-gold/25">
              {[
                { id: "desc", label: "Product Description", body: p.description },
                { id: "care", label: "Care Instructions", body: p.care_instructions },
                { id: "ship", label: "Shipping & Delivery", body: p.shipping_info },
                { id: "return", label: "Returns & Refunds", body: "Custom and made-to-order pieces are non-refundable. In-stock items can be exchanged within 7 days of delivery." },
              ].map((a) => (
                <div key={a.id}>
                  <button onClick={() => setOpenAcc(openAcc === a.id ? null : a.id)} className="w-full py-4 flex items-center justify-between text-left">
                    <span className="font-display text-lg text-maroon-dp">{a.label}</span>
                    <span className={`text-2xl text-maroon transition-transform ${openAcc === a.id ? "rotate-45" : ""}`}>+</span>
                  </button>
                  {openAcc === a.id && <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{a.body || "—"}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="bg-ivory py-14">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="font-display text-3xl text-maroon-dp mb-6">Customer Reviews</h2>
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-cream-warm rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-maroon-dp">{r.reviewer_name}</span>
                    {r.verified && <Sparkles size={12} className="text-gold" />}
                    <span className="text-xs text-muted-foreground">· {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex text-gold mb-2">{[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"} />)}</div>
                  <p className="text-sm text-maroon-dp/80">{r.review_text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-cream py-14">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-display text-3xl text-maroon-dp mb-8">You May Also Love</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((rp) => <ProductCard key={rp.id} p={rp} />)}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
