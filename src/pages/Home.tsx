import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { api } from "@/lib/api";
import { CATEGORY_BG } from "@/lib/format";

const heroSlides = [
  {
    bg: "#3a0a0f", category: "wearables", to: "/shop?category=wearables",
    eyebrow: "New Arrival · Spring 2026",
    titleA: "Woven", titleB: "with Love", hindi: "बुनाई",
    body: "Hand-crocheted peplum tops, dresses & co-ords — each stitch a labour of devotion. Made to order in your size.",
    ctaPrimary: "Shop Wearables", ctaSecondary: "View Lookbook",
  },
  {
    bg: "#2e0c12", category: "bouquets", to: "/shop?category=bouquets",
    eyebrow: "Forever Florals",
    titleA: "Blooms", titleB: "that Never Fade", hindi: "चिरस्थायी फूल",
    body: "Handcrafted crochet bouquets — roses, lotuses & wildflower mixes. Perfect gifts that last a lifetime.",
    ctaPrimary: "Shop Bouquets", ctaSecondary: "Custom Bouquet",
  },
  {
    bg: "#1a060a", category: "hair", to: "/shop?category=hair",
    eyebrow: "Daily Adornment",
    titleA: "Adorn", titleB: "& Flourish", hindi: "श्रृंगार",
    body: "Crochet hair clips, scrunchies, bows & key chains — soft, handmade & zero damage. Style that tells a story.",
    ctaPrimary: "Shop Accessories", ctaSecondary: "See on Instagram",
  },
];

function HeroBillboard() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % heroSlides.length), 5500);
    return () => clearInterval(t);
  }, []);
  const slide = heroSlides[i];

  return (
    <section className="relative overflow-hidden" style={{ background: slide.bg }}>
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, hsl(var(--gold)) 1px, transparent 1px), radial-gradient(circle at 80% 70%, hsl(var(--gold)) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
      }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(110deg, hsl(354 79% 4% / .85) 0%, hsl(353 71% 21% / .5) 45%, hsl(353 71% 21% / .25) 100%)" }} />

      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center min-h-[600px]">
        <div className="text-white space-y-6 fade-up" key={i}>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold-lt">{slide.eyebrow}</span>
          <h1 className="font-display font-bold leading-[0.95]" style={{ fontSize: "clamp(42px, 6vw, 80px)" }}>
            <span className="text-shimmer">{slide.titleA}</span>{" "}
            <span className="text-white/90">{slide.titleB}</span>
            <span className="block font-dev text-white/50 mt-2" style={{ fontSize: "clamp(20px, 2.4vw, 36px)" }}>{slide.hindi}</span>
          </h1>
          <p className="text-white/70 max-w-md text-[15px] leading-relaxed">{slide.body}</p>
          <div className="flex flex-wrap gap-3">
            <Link to={slide.to} className="px-7 py-3.5 bg-gold hover:bg-gold-lt text-maroon-dp rounded-full text-[12px] uppercase tracking-[0.16em] font-semibold transition-colors flex items-center gap-2">
              {slide.ctaPrimary} <ArrowRight size={14} />
            </Link>
            <button className="px-7 py-3.5 border border-white/30 hover:border-gold text-white rounded-full text-[12px] uppercase tracking-[0.16em] transition-colors">
              {slide.ctaSecondary}
            </button>
          </div>
        </div>
        <div className="hidden md:flex justify-center fade-up" key={`art-${i}`}>
          <CategoryArt category={slide.category} />
        </div>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-4 right-6 font-dev text-gold/15 text-5xl pointer-events-none select-none">हस्तनिर्मित</div>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {heroSlides.map((_, idx) => (
          <button key={idx} onClick={() => setI(idx)}
            className={`h-2 rounded-full transition-all ${idx === i ? "w-7 bg-gold" : "w-2 bg-white/30"}`}
            aria-label={`Slide ${idx + 1}`} />
        ))}
      </div>
    </section>
  );
}

function CategoryArt({ category }: { category: string }) {
  // Larger illustration-style SVG per category
  const common = "max-w-[420px] w-full h-auto";
  if (category === "bouquets")
    return (
      <svg viewBox="0 0 400 480" className={common}>
        {[[200, 130, 60, "#D4AF7F"], [140, 170, 48, "#e8d0a0"], [260, 170, 48, "#e8d0a0"], [200, 220, 36, "#8B1F2A"]].map(([cx, cy, r, c], k) => (
          <g key={k}>
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <ellipse key={deg} cx={cx as number} cy={cy as number} rx={r as number} ry={(r as number) * 0.45}
                transform={`rotate(${deg} ${cx} ${cy})`} fill={c as string} opacity="0.6" />
            ))}
            <circle cx={cx as number} cy={cy as number} r={(r as number) * 0.35} fill="#1f0407" opacity=".6" />
          </g>
        ))}
        <path d="M195 250 Q200 380 200 450 M170 270 Q160 370 175 440 M230 270 Q240 370 225 440" stroke="#2a4a2e" strokeWidth="3" fill="none" />
        <path d="M165 440 Q200 460 235 440 Q230 470 200 472 Q170 470 165 440 Z" fill="#8B1F2A" />
      </svg>
    );
  if (category === "hair")
    return (
      <svg viewBox="0 0 400 480" className={common} fill="none" stroke="#D4AF7F" strokeWidth="2.5">
        <circle cx="200" cy="200" r="100" opacity=".7" />
        <circle cx="200" cy="200" r="70" opacity=".5" />
        <circle cx="200" cy="200" r="40" opacity=".7" />
        <circle cx="200" cy="200" r="18" fill="#D4AF7F" opacity=".7" />
        <g transform="translate(80 360)" stroke="none" fill="#D4AF7F" opacity=".7">
          <ellipse rx="30" ry="14" /><ellipse rx="14" ry="30" />
          <circle r="8" fill="#8B1F2A" />
        </g>
        <g transform="translate(320 360)" fill="#e8d0a0" stroke="none"><circle r="20" /></g>
      </svg>
    );
  // wearables (default)
  return (
    <svg viewBox="0 0 400 520" className={common}>
      <defs>
        <pattern id="weave" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 7 H14 M7 0 V14" stroke="#D4AF7F" strokeOpacity=".55" strokeWidth="1" />
        </pattern>
      </defs>
      <path d="M120 100 L200 70 L280 100 L300 200 L320 360 L240 380 L240 480 L160 480 L160 380 L80 360 L100 200 Z" fill="#5a0f18" />
      <path d="M120 100 L200 70 L280 100 L300 200 L320 360 L240 380 L240 480 L160 480 L160 380 L80 360 L100 200 Z" fill="url(#weave)" opacity=".5" />
      <path d="M150 70 L200 30 L250 70" stroke="#D4AF7F" strokeWidth="3" fill="none" />
      <circle cx="180" cy="130" r="8" fill="#8B1F2A" />
      <circle cx="220" cy="150" r="8" fill="#8B1F2A" />
      <circle cx="200" cy="180" r="8" fill="#8B1F2A" />
      <path d="M80 360 Q200 430 320 360 L300 380 Q200 450 100 380 Z" fill="#D4AF7F" opacity=".6" />
    </svg>
  );
}

function MarqueeTicker() {
  const items = [
    "100% Handmade Crochet", "Custom Sizes Available", "Free Shipping ₹999+",
    "Wearables, Bouquets & Hair Clips", "Made with Pure Love", "Secure UPI Payments",
    "WhatsApp for Custom Orders",
  ];
  const line = items.flatMap((t, i) => [<span key={i} className="px-6 text-gold-lt text-[12px] tracking-[0.18em] uppercase">{t}</span>, <span key={`s${i}`} className="text-gold/60">✦</span>]);
  return (
    <div className="bg-maroon py-3 overflow-hidden border-y" style={{ borderColor: "hsl(var(--gold) / 0.2)" }}>
      <div className="flex marquee-track whitespace-nowrap">
        <div className="flex shrink-0">{line}</div>
        <div className="flex shrink-0">{line}</div>
      </div>
    </div>
  );
}

function CategoryStrip() {
  const cats = [
    { id: "wearables", label: "Wearables", sub: "Tops, dresses & co-ords", badge: "Most Loved", tall: true },
    { id: "bouquets", label: "Bouquets", sub: "Florals that last forever" },
    { id: "hair", label: "Hair Accessories", sub: "Clips, scrunchies & bows", badge: "New" },
    { id: "keychains", label: "Key Chains & Bags", sub: "Tiny treasures" },
  ];
  return (
    <section className="bg-ivory py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-maroon mb-2">Browse by Category</p>
            <h2 className="font-display text-[44px] leading-tight text-maroon-dp">Find Your Perfect Craft</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:auto-rows-[280px]">
          {cats.map((c) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.id}`}
              className={`relative rounded-2xl overflow-hidden group ${c.tall ? "md:row-span-2" : ""}`}
              style={{ background: CATEGORY_BG[c.id], aspectRatio: c.tall ? undefined : "3/4" }}
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-90 group-hover:scale-105 transition-transform duration-700">
                <CategoryArt category={c.id} />
              </div>
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(354 79% 7% / 0.88) 0%, hsl(354 79% 7% / 0.1) 60%, transparent)" }} />
              {c.badge && (
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-gold text-maroon-dp text-[9px] uppercase tracking-[0.16em] rounded-full font-semibold">{c.badge}</span>
              )}
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <h3 className="font-display text-2xl">{c.label}</h3>
                <p className="text-white/60 text-xs mt-1">{c.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="bg-cream py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-maroon mb-2">Hand-Picked for You</p>
            <h2 className="font-display text-[40px] leading-tight text-maroon-dp">New Arrivals</h2>
          </div>
          <Link to="/shop" className="text-[12px] uppercase tracking-[0.16em] text-maroon hover:text-maroon-dk font-medium flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {products.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

function ArtisanStory() {
  return (
    <section className="bg-maroon-dp text-white py-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(0deg, hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }} />
      <div className="relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block px-4 py-1.5 border border-gold rounded-full text-gold text-[10px] uppercase tracking-[0.16em] mb-5">Our Story</span>
          <h2 className="font-display leading-tight" style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>
            Crafted by a <span className="text-gold italic">Mother's</span> Hands,<br/>Worn with Pride
          </h2>
          <p className="text-white/65 mt-6 leading-relaxed max-w-lg">
            Kaari was born from a grandmother's crochet needle and a daughter's dream. Every piece is handcrafted in Bhopal — each loop, each knot, each flower petal is a labour of love passed down through generations.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/10">
            {[["500+", "Happy Customers"], ["100%", "Handcrafted"], ["3 yrs", "Of Love"]].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-4xl text-gold">{n}</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/50 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <svg viewBox="0 0 400 400" className="max-w-md w-full">
            {[150, 110, 70, 35].map((r, i) => (
              <circle key={i} cx="200" cy="200" r={r} fill="none" stroke={i % 2 ? "#D4AF7F" : "#8B1F2A"} strokeOpacity={0.4 - i * 0.06} strokeWidth="1.5" />
            ))}
            <path d="M120 230 L200 100 L280 230" stroke="#D4AF7F" strokeWidth="3" fill="none" />
            <circle cx="200" cy="100" r="10" fill="#8B1F2A" />
            <g transform="translate(200 200)">
              {[0, 72, 144, 216, 288].map((d) => (
                <ellipse key={d} rx="24" ry="9" transform={`rotate(${d})`} fill="#D4AF7F" opacity=".7" />
              ))}
              <circle r="10" fill="#8B1F2A" />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: "♥", title: "100% Handmade", sub: "Every stitch by hand" },
    { icon: "💳", title: "Secure UPI", sub: "Cashfree powered" },
    { icon: "📦", title: "Made to Order", sub: "Custom sizes available" },
    { icon: "🚚", title: "Free Shipping", sub: "Orders above ₹999" },
  ];
  return (
    <section className="bg-cream-warm border-y border-gold/30 py-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((it) => (
          <div key={it.title} className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-maroon text-gold flex items-center justify-center shrink-0 text-lg">{it.icon}</span>
            <div>
              <div className="font-display text-base text-maroon-dp">{it.title}</div>
              <div className="text-[11px] text-muted-foreground">{it.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="bg-maroon py-20 text-center text-white">
      <div className="max-w-2xl mx-auto px-6">
        <h2 className="font-display text-[40px] md:text-[48px] leading-tight">Get Early Access & Exclusive Offers</h2>
        <p className="text-white/70 mt-3">Be the first to know about new launches, seasonal collections & custom order slots.</p>
        <form onSubmit={(e) => e.preventDefault()} className="mt-7 flex gap-2 max-w-lg mx-auto bg-white/10 rounded-full p-1.5">
          <input type="email" placeholder="your@email.com" className="flex-1 bg-transparent px-5 outline-none text-white placeholder:text-white/50 text-sm" />
          <button className="px-6 py-3 bg-gold hover:bg-gold-lt text-maroon-dp rounded-full text-xs uppercase tracking-[0.16em] font-semibold transition-colors">Subscribe</button>
        </form>
        <p className="text-[11px] text-white/45 mt-3">No spam, ever. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { api.listProducts().then(setProducts as any).catch(() => {}); }, []);
  return (
    <SiteLayout>
      <HeroBillboard />
      <MarqueeTicker />
      <CategoryStrip />
      <FeaturedProducts products={products} />
      <ArtisanStory />
      <TrustStrip />
      <Newsletter />
    </SiteLayout>
  );
}
