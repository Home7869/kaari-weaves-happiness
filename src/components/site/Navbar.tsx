import { Link, NavLink } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";

export function Logo({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 no-underline">
      <span className="w-9 h-9 rounded-full bg-maroon flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 19c4-1 8-3 11-7 1.5-2 1.5-4 0-5s-3 0-4 2-1 5 1 7" strokeLinecap="round" />
          <circle cx="6" cy="19" r="1.6" fill="currentColor" />
        </svg>
      </span>
      <div className="leading-none">
        <div className="font-dev font-bold text-maroon" style={{ fontSize: 24 }}>कारी</div>
        {subtitle && (
          <div className="text-[8.5px] uppercase tracking-[0.18em] text-maroon-dk/70 mt-0.5">Handmade Crochet</div>
        )}
      </div>
    </Link>
  );
}

export function AnnouncementBar({ text }: { text: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="relative ann-sweep bg-maroon-dp text-gold-lt text-[11px] tracking-[0.14em] uppercase text-center py-2 px-12 overflow-hidden">
      <span className="relative z-10">{text}</span>
      <button
        onClick={() => setOpen(false)}
        aria-label="Close announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gold hover:text-gold-lt z-10"
      >×</button>
    </div>
  );
}

export function Navbar() {
  const cartCount = useCart((s) => s.count());
  const openCart = useCart((s) => s.setOpen);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: "/shop", label: "Shop All" },
    { to: "/shop?category=wearables", label: "Wearables" },
    { to: "/shop?category=bouquets", label: "Bouquets" },
    { to: "/shop?category=hair", label: "Accessories" },
    { to: "/custom", label: "Custom Orders" },
  ];

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md border-b" style={{ background: "hsl(var(--cream-warm) / 0.92)", borderBottomColor: "hsl(var(--gold) / 0.25)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between gap-4">
        <Logo />
        <ul className="hidden lg:flex gap-7 list-none">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  `text-[11.5px] font-medium tracking-[0.14em] uppercase transition-colors ${
                    isActive ? "text-maroon" : "text-maroon-dk hover:text-maroon"
                  }`
                }
              >{l.label}</NavLink>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <Link to="/search" aria-label="Search" className="w-9 h-9 rounded-full flex items-center justify-center text-maroon hover:bg-maroon/10">
            <Search size={18} />
          </Link>
          <button aria-label="Wishlist" className="w-9 h-9 rounded-full flex items-center justify-center text-maroon hover:bg-maroon/10 hidden sm:flex">
            <Heart size={18} />
          </button>
          <button onClick={() => openCart(true)} aria-label="Cart" className="relative w-9 h-9 rounded-full flex items-center justify-center text-maroon hover:bg-maroon/10">
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-maroon text-gold text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-maroon hover:bg-maroon/10"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden border-t border-gold/20 bg-cream-warm/95">
          <ul className="flex flex-col py-3 px-6 gap-3 list-none">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setMobileOpen(false)}
                  className="block text-[12px] font-medium tracking-[0.14em] uppercase text-maroon-dk py-1.5"
                >{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
