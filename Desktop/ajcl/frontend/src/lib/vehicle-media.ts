/** Photo for a vehicle class (files live in /public). Falls back by keyword. */
const IMAGES: Record<string, string> = {
  bike: "/bike.jpeg",
  "mini-van": "/minivan.jpeg",
  "mini-truck": "/minitruck.jpeg",
  "cargo-van": "/vehicles/cargo-van.png",
};

export function vehicleImage(slug: string): string {
  if (IMAGES[slug]) return IMAGES[slug];
  const s = slug.toLowerCase();
  if (s.includes("cargo")) return IMAGES["cargo-van"];
  if (s.includes("truck")) return IMAGES["mini-truck"];
  if (s.includes("van")) return IMAGES["mini-van"];
  return IMAGES.bike;
}
