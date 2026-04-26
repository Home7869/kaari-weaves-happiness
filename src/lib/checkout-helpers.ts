// Helpers for checkout: pincode lookup, working-day eta, geocoding, formatting.

export type PostOffice = {
  Name: string;
  District: string;
  State: string;
  Country: string;
  Pincode: string;
};

export async function lookupPincode(pincode: string, signal?: AbortSignal): Promise<PostOffice[]> {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, { signal });
  if (!res.ok) throw new Error("Pincode lookup failed");
  const data = await res.json();
  const entry = Array.isArray(data) ? data[0] : null;
  if (!entry || entry.Status !== "Success" || !Array.isArray(entry.PostOffice)) {
    throw new Error("Invalid pincode");
  }
  return entry.PostOffice as PostOffice[];
}

export async function reverseGeocode(lat: number, lon: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) throw new Error("Reverse geocoding failed");
  const data = await res.json();
  const a = data.address ?? {};
  return {
    pincode: a.postcode ?? "",
    line1: [a.house_number, a.road].filter(Boolean).join(" "),
    locality: a.suburb ?? a.neighbourhood ?? a.village ?? "",
    city: a.city ?? a.town ?? a.county ?? a.state_district ?? "",
    state: a.state ?? "",
  };
}

// Add N working days, skipping Sundays only.
export function addWorkingDays(start: Date, days: number): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++;
  }
  return d;
}

export function formatEtaRange(from: Date, to: Date): string {
  const opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
  return `${from.toLocaleDateString("en-IN", opts)} – ${to.toLocaleDateString("en-IN", opts)}`;
}

export function getEta(deliveryType: "standard" | "express"): { from: Date; to: Date } {
  const now = new Date();
  if (deliveryType === "express") return { from: addWorkingDays(now, 3), to: addWorkingDays(now, 5) };
  return { from: addWorkingDays(now, 8), to: addWorkingDays(now, 10) };
}
