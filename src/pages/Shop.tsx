import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { api } from "@/lib/api";
import { CATEGORIES } from "@/lib/format";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "all";
  const search = params.get("search") ?? "";
  const sort = params.get("sort") ?? "newest";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.listProducts({ category, search, sort })
      .then(setProducts as any)
      .finally(() => setLoading(false));
  }, [category, search, sort]);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v && v !== "all") next.set(k, v); else next.delete(k);
    setParams(next);
  };

  return (
    <SiteLayout>
      <section className="bg-maroon-dp text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: "linear-gradient(45deg, hsl(var(--gold)) 1px, transparent 1px), linear-gradient(-45deg, hsl(var(--gold)) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h1 className="font-display text-5xl md:text-6xl">Shop <span className="text-gold italic">All</span> Products</h1>
          <p className="font-dev text-gold-lt/70 mt-3">प्यार से बुनी गई · Crafted with Love</p>
        </div>
      </section>

      <div className="sticky top-[60px] z-30 bg-cream-warm border-b border-gold/30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3 overflow-x-auto">
          <div className="flex gap-2 flex-1 min-w-0">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setParam("category", c.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.14em] font-medium transition-colors ${
                  category === c.id
                    ? "bg-maroon text-gold"
                    : "bg-transparent text-maroon-dk hover:bg-maroon/10"
                }`}
              >{c.label}</button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="shrink-0 bg-white border border-maroon/20 rounded-full px-4 py-1.5 text-xs text-maroon-dk"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="rating">Best Rated</option>
          </select>
        </div>
      </div>

      <section className="bg-cream py-10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sm text-muted-foreground mb-5">
            {loading ? "Loading…" : `Showing ${products.length} product${products.length === 1 ? "" : "s"}`}
          </p>
          {!loading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-maroon-dp/70">No products found</p>
              <button onClick={() => setParams(new URLSearchParams())} className="mt-4 text-maroon underline">Clear filters</button>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
