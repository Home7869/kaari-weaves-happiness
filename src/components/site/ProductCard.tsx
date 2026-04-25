import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { ProductPlaceholder } from "./ProductPlaceholder";
import { formatINR, categoryLabel } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  original_price: number | null;
  badge: string | null;
  images: string[];
  rating: number;
  review_count: number;
  stock_status: string;
};

const badgeStyles: Record<string, string> = {
  new: "bg-maroon text-gold",
  hot: "bg-orange-600 text-white",
  custom: "bg-maroon-dk text-gold-lt",
};

export function ProductCard({ p }: { p: Product }) {
  const add = useCart((s) => s.add);
  const img = p.images?.[0];
  const discount = p.original_price && p.original_price > p.price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : null;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    add({ product_id: p.id, slug: p.slug, name: p.name, price: p.price, image: img ?? null });
    toast.success(`${p.name} added to cart`);
  };

  return (
    <Link
      to={`/product/${p.slug}`}
      className="group relative block rounded-[14px] bg-ivory border border-maroon/[0.06] overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-cream">
        {img ? (
          <img src={img} alt={p.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <ProductPlaceholder category={p.category} name={p.name} />
        )}
        {p.badge && (
          <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-[0.16em] font-semibold ${badgeStyles[p.badge] ?? "bg-maroon text-gold"}`}>
            {p.badge}
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toast("Saved to wishlist ♥"); }}
          aria-label="Wishlist"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-maroon opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart size={15} />
        </button>
        <button
          onClick={quickAdd}
          className="absolute left-3 right-3 bottom-3 bg-maroon text-gold py-2.5 rounded-full text-[11px] uppercase tracking-[0.16em] font-semibold translate-y-[120%] group-hover:translate-y-0 transition-transform duration-300"
        >
          Quick Add to Cart
        </button>
      </div>
      <div className="p-4">
        <div className="text-[9px] uppercase tracking-[0.18em] text-maroon/70 mb-1">{categoryLabel(p.category)}</div>
        <h3 className="font-display text-[17px] leading-tight text-maroon-dp line-clamp-2">{p.name}</h3>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="font-display text-[19px] text-maroon font-semibold">{formatINR(p.price)}</span>
          {p.original_price && p.original_price > p.price && (
            <>
              <span className="text-xs text-muted-foreground line-through">{formatINR(p.original_price)}</span>
              {discount && <span className="text-[10px] text-green-700 font-semibold">{discount}% off</span>}
            </>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-gold">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={11} fill={i < Math.round(p.rating) ? "currentColor" : "none"} />
          ))}
          <span className="text-[11px] text-muted-foreground ml-1">({p.review_count})</span>
        </div>
      </div>
    </Link>
  );
}
