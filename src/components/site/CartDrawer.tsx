import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Trash2, Plus, Minus } from "lucide-react";
import { useCart, cartKey } from "@/lib/cart";
import { ProductPlaceholder } from "./ProductPlaceholder";
import { formatINR } from "@/lib/format";

export function CartDrawer() {
  const { items, isOpen, setOpen, remove, setQty, subtotal } = useCart();
  const sub = subtotal();
  const shipping = sub === 0 ? 0 : sub >= 999 ? 0 : 60;
  const total = sub + shipping;

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-maroon-dp/45 backdrop-blur-sm transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-ivory shadow-2xl flex flex-col transition-transform duration-350 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}
      >
        <header className="flex items-center justify-between px-5 py-4 border-b border-gold/25">
          <h2 className="font-display text-2xl text-maroon-dp">Your Bag</h2>
          <button onClick={() => setOpen(false)} className="text-maroon"><X size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="font-display text-2xl text-maroon-dp/70">Your bag is empty</p>
              <p className="text-sm mt-2">Add a little handmade love.</p>
              <Link to="/shop" onClick={() => setOpen(false)} className="inline-block mt-6 px-6 py-2.5 bg-maroon text-gold rounded-full text-xs uppercase tracking-[0.16em]">Shop now</Link>
            </div>
          )}
          {items.map((i) => {
            const k = cartKey(i);
            return (
              <div key={k} className="flex gap-3 pb-4 border-b border-gold/15 last:border-0">
                <div className="w-20 h-24 rounded-lg overflow-hidden shrink-0 bg-cream">
                  {i.image
                    ? <img src={i.image} alt={i.name} className="w-full h-full object-cover" />
                    : <ProductPlaceholder category="all" name={i.name} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-[15px] text-maroon-dp truncate">{i.name}</h3>
                  {(i.size || i.color) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {[i.size, i.color].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="font-display text-maroon font-semibold mt-1">{formatINR(i.price * i.qty)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 border border-maroon/20 rounded-full">
                      <button onClick={() => setQty(k, i.qty - 1)} className="w-7 h-7 flex items-center justify-center text-maroon"><Minus size={12} /></button>
                      <span className="text-sm w-6 text-center">{i.qty}</span>
                      <button onClick={() => setQty(k, i.qty + 1)} className="w-7 h-7 flex items-center justify-center text-maroon"><Plus size={12} /></button>
                    </div>
                    <button onClick={() => remove(k)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-gold/25 p-5 space-y-3 bg-cream-warm">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-medium">{formatINR(sub)}</span></div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span className="font-medium">{shipping === 0 ? "FREE" : formatINR(shipping)}</span>
            </div>
            {sub > 0 && sub < 999 && (
              <p className="text-[11px] text-maroon">Add {formatINR(999 - sub)} more for free shipping</p>
            )}
            <div className="flex justify-between font-display text-xl text-maroon-dp pt-2 border-t border-gold/20">
              <span>Total</span><span>{formatINR(total)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => setOpen(false)}
              className="block text-center bg-gold hover:bg-gold-lt text-maroon-dp font-semibold py-3.5 rounded-full text-sm uppercase tracking-[0.16em] transition-colors"
            >Proceed to Checkout</Link>
          </footer>
        )}
      </aside>
    </>
  );
}
