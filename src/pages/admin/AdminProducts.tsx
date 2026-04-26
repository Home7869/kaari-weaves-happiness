import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { formatINR, categoryLabel, CATEGORIES } from "@/lib/format";
import { Plus, Edit2, Trash2, Copy, Star, Search } from "lucide-react";
import { toast } from "sonner";
import { ProductPlaceholder } from "@/components/site/ProductPlaceholder";

export default function AdminProducts() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [activeOnly, setActiveOnly] = useState<"all" | "active" | "inactive">("all");

  const load = () => api.adminListProducts().then(setItems).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (activeOnly === "active" && !p.is_active) return false;
      if (activeOnly === "inactive" && p.is_active) return false;
      if (q.trim() && !`${p.name} ${p.slug}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
      return true;
    });
  }, [items, q, cat, activeOnly]);

  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await api.adminDeleteProduct(id); toast.success("Deleted"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const toggle = async (p: any, key: "is_active" | "is_featured") => {
    try {
      await api.adminUpdateProduct(p.id, { [key]: !p[key] });
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, [key]: !p[key] } : x)));
    } catch (e: any) { toast.error(e.message); }
  };

  const duplicate = async (p: any) => {
    try {
      const { id, created_at, updated_at, ...rest } = p;
      const copy = {
        ...rest,
        name: `${p.name} (Copy)`,
        slug: `${p.slug}-copy-${Math.random().toString(36).slice(2, 6)}`,
        is_active: false,
      };
      await api.adminCreateProduct(copy);
      toast.success("Duplicated");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="font-display text-3xl text-maroon-dp">Products ({filtered.length})</h1>
        <Link to="/admin/products/new" className="px-4 py-2 bg-maroon text-gold rounded-lg text-xs uppercase tracking-[0.14em] flex items-center gap-2">
          <Plus size={14} />Add New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-ivory rounded-xl border border-gold/25 p-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or slug…"
            className="w-full bg-cream border border-gold/30 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-maroon"
          />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="bg-cream border border-gold/30 rounded-lg px-3 py-2 text-sm">
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={activeOnly} onChange={(e) => setActiveOnly(e.target.value as any)} className="bg-cream border border-gold/30 rounded-lg px-3 py-2 text-sm">
          <option value="all">All</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      <div className="bg-ivory rounded-xl border border-gold/25 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground bg-cream-warm">
              <tr>
                <th className="p-3">Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th className="text-center">Active</th>
                <th className="text-center">Featured</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-gold/15 hover:bg-cream/40">
                  <td className="p-3">
                    <div className="w-12 h-14 rounded overflow-hidden bg-cream">
                      {p.images?.[0]
                        ? <img src={p.images[0]} className="w-full h-full object-cover" alt="" />
                        : <ProductPlaceholder category={p.category} name={p.name} />}
                    </div>
                  </td>
                  <td className="font-medium text-maroon-dp">{p.name}</td>
                  <td>{categoryLabel(p.category)}</td>
                  <td>
                    {formatINR(p.price)}
                    {p.original_price && p.original_price > p.price && (
                      <span className="ml-1 text-[10px] line-through text-muted-foreground">{formatINR(p.original_price)}</span>
                    )}
                  </td>
                  <td className="capitalize text-xs">{p.stock_status.replace(/_/g, " ")}</td>
                  <td className="text-center">
                    <button
                      onClick={() => toggle(p, "is_active")}
                      className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider ${
                        p.is_active ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="text-center">
                    <button onClick={() => toggle(p, "is_featured")} className="p-1.5 hover:bg-gold/10 rounded">
                      <Star size={16} className={p.is_featured ? "fill-gold text-gold" : "text-muted-foreground"} />
                    </button>
                  </td>
                  <td className="pr-3">
                    <div className="flex gap-1 justify-end">
                      <Link to={`/admin/products/${p.id}`} title="Edit" className="p-1.5 text-maroon hover:bg-maroon/10 rounded"><Edit2 size={14} /></Link>
                      <button onClick={() => duplicate(p)} title="Duplicate" className="p-1.5 text-maroon hover:bg-maroon/10 rounded"><Copy size={14} /></button>
                      <button onClick={() => del(p.id)} title="Delete" className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                  {items.length === 0 ? "No products yet — click Add New Product to create your first one." : "No products match the filters."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
