import { CATEGORY_BG } from "@/lib/format";

// Brand-toned SVG placeholder used when a product has no .webp images uploaded.
export function ProductPlaceholder({ category, name }: { category: string; name: string }) {
  const bg = CATEGORY_BG[category] ?? "#1f0407";
  // Pick a tiny iconic shape based on category
  const icon = (() => {
    switch (category) {
      case "wearables":
        return <path d="M40 80 L80 60 L120 80 L130 130 L100 140 L100 200 L60 200 L60 140 L30 130 Z" fill="#D4AF7F" opacity=".22" stroke="#D4AF7F" strokeWidth="1.5" />;
      case "bouquets":
        return <g fill="#D4AF7F" opacity=".55">
          <circle cx="80" cy="90" r="14" /><circle cx="105" cy="80" r="12" /><circle cx="92" cy="70" r="10" />
          <path d="M88 100 L90 180 L94 180 L96 100 Z" fill="#2a4a2e" opacity=".7" />
        </g>;
      case "hair":
        return <g fill="none" stroke="#D4AF7F" strokeWidth="2" opacity=".7"><circle cx="90" cy="100" r="32" /><circle cx="90" cy="100" r="20" /><circle cx="90" cy="100" r="8" fill="#D4AF7F" /></g>;
      case "dolls":
        return <g fill="#D4AF7F" opacity=".55"><circle cx="90" cy="80" r="22" /><rect x="68" y="100" width="44" height="60" rx="20" /><circle cx="80" cy="78" r="2" fill="#1f0407" /><circle cx="100" cy="78" r="2" fill="#1f0407" /></g>;
      case "handbags":
        return <g fill="none" stroke="#D4AF7F" strokeWidth="2" opacity=".75"><path d="M55 120 L125 120 L120 180 L60 180 Z" /><path d="M70 120 V100 a20 20 0 0 1 40 0 V120" /></g>;
      case "gajra":
        return <g fill="#D4AF7F" opacity=".7"><circle cx="50" cy="120" r="9" /><circle cx="70" cy="115" r="10" /><circle cx="90" cy="118" r="11" /><circle cx="110" cy="115" r="10" /><circle cx="130" cy="120" r="9" /></g>;
      case "keychains":
        return <g fill="none" stroke="#D4AF7F" strokeWidth="2.5" opacity=".75"><circle cx="90" cy="80" r="14" /><path d="M90 94 L90 130" /><circle cx="90" cy="140" r="14" fill="#D4AF7F" opacity=".4" /></g>;
      default:
        return <circle cx="90" cy="100" r="40" fill="#D4AF7F" opacity=".25" />;
    }
  })();

  return (
    <svg viewBox="0 0 180 220" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="180" height="220" fill={bg} />
      <defs>
        <pattern id={`p-${category}`} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="22" height="22" fill="transparent" />
          <path d="M0 11 H22 M11 0 V22" stroke="#D4AF7F" strokeOpacity=".07" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="180" height="220" fill={`url(#p-${category})`} />
      {icon}
      <text x="90" y="200" textAnchor="middle" fill="#D4AF7F" opacity=".55" fontSize="9" fontFamily="serif" letterSpacing="2">
        {name.slice(0, 22).toUpperCase()}
      </text>
    </svg>
  );
}
