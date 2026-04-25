export function formatINR(paise: number) {
  return `₹${(paise ?? 0).toLocaleString("en-IN")}`;
}

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "wearables", label: "Wearables" },
  { id: "bouquets", label: "Bouquets" },
  { id: "hair", label: "Hair Accessories" },
  { id: "dolls", label: "Dolls" },
  { id: "keychains", label: "Key Chains" },
  { id: "handbags", label: "Handbags" },
  { id: "gajra", label: "Gajra" },
] as const;

export const CATEGORY_BG: Record<string, string> = {
  wearables: "#3a0c12",
  bouquets: "#2a0c15",
  hair: "#1f0810",
  dolls: "#2a1020",
  handbags: "#260a10",
  gajra: "#2e0c18",
  keychains: "#1f0810",
  all: "#1f0407",
};

export function categoryLabel(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
