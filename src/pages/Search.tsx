import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { api } from "@/lib/api";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [val, setVal] = useState(q);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) { setResults([]); return; }
    setLoading(true);
    api.listProducts({ search: q }).then(setResults as any).finally(() => setLoading(false));
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (val) next.set("q", val); else next.delete("q");
    setParams(next);
  };

  const hints = ["Heart top", "Lotus bouquet", "Scrunchie", "Gajra", "Custom"];

  return (
    <SiteLayout>
      <section className="bg-maroon-dp text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="font-display text-5xl">Find your <span className="text-gold italic">perfect</span> craft</h1>
          <form onSubmit={submit} className="mt-8 flex bg-white/10 rounded-full p-1.5 max-w-2xl mx-auto">
            <input
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Search products…"
              className="flex-1 bg-transparent px-5 outline-none text-white placeholder:text-white/50 text-base"
            />
            <button className="px-6 py-3 bg-gold text-maroon-dp rounded-full flex items-center gap-2 text-sm font-semibold">
              <SearchIcon size={16} /> Search
            </button>
          </form>
          <div className="flex gap-2 justify-center flex-wrap mt-5">
            {hints.map((h) => (
              <button key={h} onClick={() => { setVal(h); setParams({ q: h }); }} className="px-4 py-1.5 text-xs border border-gold/30 rounded-full text-gold-lt hover:bg-gold/10">{h}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream py-12">
        <div className="max-w-7xl mx-auto px-6">
          {q && <p className="text-sm text-muted-foreground mb-5">{loading ? "Searching…" : `Showing ${results.length} result${results.length === 1 ? "" : "s"} for "${q}"`}</p>}
          {q && !loading && results.length === 0 && (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-maroon-dp/70">No results for "{q}"</p>
              <p className="text-sm text-muted-foreground mt-2">Try another keyword or browse all products.</p>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {results.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
