import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { formatINR, categoryLabel } from "@/lib/format";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProductPlaceholder } from "@/components/site/ProductPlaceholder";

export default function AdminProducts() {
  const [items, setItems] = useState<any[]>([]);
  const load = () => api.adminListProducts().then(setItems).catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);
  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await api.adminDeleteProduct(id); toast.success("Deleted"); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl text-maroon-dp">Products</h1>
        <Link to="/admin/products/new" className="px-4 py-2 bg-maroon text-gold rounded-lg text-xs uppercase tracking-[0.14em] flex items-center gap-2"><Plus size={14} />Add New</Link>
      </div>
      <div className="bg-ivory rounded-xl border border-gold/25 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground bg-cream-warm">
            <tr><th className="p-3">Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Active</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-gold/15">
                <td className="p-3"><div className="w-12 h-14 rounded overflow-hidden bg-cream">
                  {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <ProductPlaceholder category={p.category} name={p.name} />}
                </div></td>
                <td>{p.name}</td>
                <td>{categoryLabel(p.category)}</td>
                <td>{formatINR(p.price)}</td>
                <td className="capitalize text-xs">{p.stock_status.replace(/_/g, " ")}</td>
                <td>{p.is_active ? "✓" : "✗"}</td>
                <td className="pr-3">
                  <div className="flex gap-2 justify-end">
                    <Link to={`/admin/products/${p.id}/edit`} className="p-1.5 text-maroon hover:bg-maroon/10 rounded"><Edit2 size={14} /></Link>
                    <button onClick={() => del(p.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No products yet</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
