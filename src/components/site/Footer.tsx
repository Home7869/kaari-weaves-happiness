import { Link } from "react-router-dom";
import { Logo } from "./Navbar";

export function Footer({ instagramHandle = "kaari.handmade" }: { instagramHandle?: string }) {
  const col = (title: string, items: { label: string; to?: string; href?: string }[]) => (
    <div>
      <h4 className="text-gold-lt text-[11px] tracking-[0.18em] uppercase mb-4 font-medium">{title}</h4>
      <ul className="space-y-2.5 list-none">
        {items.map((it, i) => (
          <li key={i}>
            {it.href ? (
              <a href={it.href} target="_blank" rel="noreferrer" className="text-white/45 hover:text-gold-lt text-sm transition-colors">{it.label}</a>
            ) : (
              <Link to={it.to ?? "#"} className="text-white/45 hover:text-gold-lt text-sm transition-colors">{it.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="bg-maroon-dp text-white/70 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="bg-cream-warm/5 inline-block p-2 rounded-lg">
            <Logo />
          </div>
          <p className="text-white/55 text-sm mt-4 leading-relaxed">
            प्यार से बुनी गई · Crafted with love in Bhopal, India.
          </p>
          <div className="flex gap-3 mt-5">
            <a href={`https://instagram.com/${instagramHandle}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-gold/30 hover:bg-gold/15 flex items-center justify-center text-gold-lt">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
            </a>
            <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-gold/30 hover:bg-gold/15 flex items-center justify-center text-gold-lt">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4a10 10 0 0 0-16.6 11L2 22l7.2-1.4A10 10 0 1 0 20 4ZM12 20a8 8 0 0 1-4-1.1l-.3-.2-3.7.7.7-3.6-.2-.3A8 8 0 1 1 12 20Zm4.4-5.7-1.4-.7c-.2 0-.4 0-.5.2l-.5.6c-.2.2-.3.2-.5.1-1.1-.4-2.3-1.5-2.7-2.5 0-.2 0-.4.1-.5l.5-.5c.2-.2.2-.3.3-.5l-.6-1.5c-.2-.4-.5-.4-.8-.4h-.7c-.4 0-.7.1-1 .5-.7.7-1 1.7-.5 2.7.9 2 2.5 3.6 4.5 4.5 1 .4 2 .2 2.7-.5.4-.3.5-.6.5-1l-.1-.5c0-.1-.2-.2-.3-.2Z"/></svg>
            </a>
          </div>
        </div>
        {col("Shop", [
          { label: "Wearables", to: "/shop?category=wearables" },
          { label: "Bouquets", to: "/shop?category=bouquets" },
          { label: "Hair Accessories", to: "/shop?category=hair" },
          { label: "Key Chains", to: "/shop?category=keychains" },
          { label: "Gajra", to: "/shop?category=gajra" },
          { label: "All Products", to: "/shop" },
        ])}
        {col("Help", [
          { label: "Track Your Order", to: "/track" },
          { label: "Shipping Policy", to: "/policies/shipping" },
          { label: "Returns & Refunds", to: "/policies/returns" },
          { label: "Privacy Policy", to: "/policies/privacy" },
          { label: "Terms of Service", to: "/policies/terms" },
          { label: "Cancellation", to: "/policies/cancellation" },
        ])}
        {col("Contact", [
          { label: `@${instagramHandle}`, href: `https://instagram.com/${instagramHandle}` },
          { label: "WhatsApp Us", href: "https://wa.me/919876543210" },
          { label: "About Kaari", to: "/about" },
          { label: "FAQs", to: "/faq" },
        ])}
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-white/40">
          <span>© 2026 कारी. All rights reserved. Made with ❤ in Bhopal, India.</span>
          <span className="flex gap-2 items-center">
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">UPI</span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">Cashfree</span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">Secure</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
