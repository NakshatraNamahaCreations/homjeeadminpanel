// Canonical service cities + the strings that may appear in a Google
// address_components long_name/short_name and should be treated as that
// city.
//
// You only list the city itself + its well-known aliases (Bangalore vs
// Bengaluru, Bombay vs Mumbai) and its district / municipal-corporation
// names (Bengaluru Urban, Mumbai Suburban, Pimpri-Chinchwad). You do NOT
// need to list sub-localities (Indiranagar, BTM Layout, Madivala,
// Koramangala...). Google's geocoding response for any address inside the
// metro always includes the parent city as a sibling component, and our
// scanner walks every component until it hits a known canonical alias.
//
// Add a city here when you start serving it; comment out aliases for
// satellite cities (e.g. "thane", "gurgaon") if you serve them as
// separate areas with their own pricing.
//
// Mirrors Homjee-website-main/src/utils/serviceCity.js — keep in sync.
const SERVICE_CITIES = {
  // Canonical = "Bengaluru" because that's what the admin's pricing /
  // package / minimum-order configs are saved under. Google Geocoding
  // sometimes returns "Bangalore" as the locality, which is why
  // "bangalore" is listed as an alias here.
  Bengaluru: [
    "bangalore",
    "bengaluru",
    "bangalore urban",
    "bengaluru urban",
    "bangalore rural",
    "bengaluru rural",
  ],
  Pune: [
    "pune",
    "pune urban",
    "pune rural",
    "pimpri",
    "chinchwad",
    "pimpri-chinchwad",
    "pimpri chinchwad",
  ],
  Mumbai: [
    "mumbai",
    "bombay",
    "mumbai suburban",
    "mumbai city",
    // Add "thane" / "navi mumbai" only if you serve them as Mumbai metro.
  ],
  Delhi: [
    "delhi",
    "new delhi",
    "central delhi",
    "north delhi",
    "south delhi",
    "east delhi",
    "west delhi",
    "north-east delhi",
    "north east delhi",
    "north-west delhi",
    "north west delhi",
    "south-east delhi",
    "south east delhi",
    "south-west delhi",
    "south west delhi",
    "shahdara",
    // Add "gurgaon"/"gurugram"/"noida" only if you serve them as Delhi.
  ],
  Hyderabad: ["hyderabad", "secunderabad"],
  Chennai: ["chennai", "madras"],
  Kolkata: ["kolkata", "calcutta"],
  Ahmedabad: ["ahmedabad"],
  Jaipur: ["jaipur"],
  Lucknow: ["lucknow"],
  Mysuru: ["mysuru", "mysore"],
};

// Reverse-lookup map: lowercase alias → canonical city.
const ALIAS_TO_CANONICAL = (() => {
  const out = {};
  for (const [canonical, aliases] of Object.entries(SERVICE_CITIES)) {
    out[canonical.toLowerCase()] = canonical;
    for (const a of aliases) out[String(a).trim().toLowerCase()] = canonical;
  }
  return out;
})();

// Returns the canonical service city for a raw city string. Falls back to
// the trimmed input if no alias matches (so we don't drop unknown cities).
export const resolveServiceCity = (raw) => {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  return ALIAS_TO_CANONICAL[trimmed.toLowerCase()] || trimmed;
};

// Tier order — Google components most-specific first. We scan in this
// priority so a true locality match wins over a district fallback.
const COMPONENT_TIERS = [
  "locality",
  "administrative_area_level_2",
  "sublocality",
  "administrative_area_level_1",
];

// Picks the best canonical service city out of a Google
// address_components array.
//
// Algorithm:
//   1. For each tier (locality, district, sublocality, state) in order,
//      check if the component's name matches a known canonical alias.
//      Return the first match — this snaps Madivala / Indiranagar / BTM
//      Layout to "Bengaluru" because the locality is "Bengaluru" and the
//      district is "Bengaluru Urban", and it snaps Pimpri-Chinchwad to
//      "Pune" via the district "Pune".
//   2. If no tier matches any alias (user is in a metro we don't serve),
//      fall back to the legacy behaviour: return the locality long_name,
//      or admin_level_2, or sublocality, or admin_level_1, in that order.
//
// Returns "" only if the components array has no usable entry at all.
export const pickServiceCityFromComponents = (components = []) => {
  if (!Array.isArray(components) || components.length === 0) return "";

  // Pass 1: tier-by-tier alias match.
  for (const tier of COMPONENT_TIERS) {
    const comp = components.find((c) => c.types?.includes(tier));
    if (!comp) continue;
    const candidates = [comp.long_name, comp.short_name];
    for (const candidate of candidates) {
      const key = String(candidate || "").trim().toLowerCase();
      if (ALIAS_TO_CANONICAL[key]) return ALIAS_TO_CANONICAL[key];
    }
  }

  // Pass 2: no service city found — preserve the legacy fallback so we
  // don't break addresses in metros we haven't onboarded yet.
  const fallback =
    components.find((c) => c.types?.includes("locality")) ||
    components.find((c) => c.types?.includes("administrative_area_level_2")) ||
    components.find((c) => c.types?.includes("sublocality")) ||
    components.find((c) => c.types?.includes("administrative_area_level_1"));
  return fallback?.long_name || "";
};
