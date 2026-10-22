/**
 * Photography for the public site, hosted on Unsplash (free to use). Each id was opened and checked.
 * `unsplash(id, width)` asks Unsplash for a resized, compressed copy so pages stay light.
 */
export function unsplash(id: string, width = 1920, quality = 72): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

const ID = {
  /* Dispatch */
  scooter: "photo-1648394794449-5dbe63f6a8b5", // a dispatch rider with a delivery box
  /* Logistics staff */
  workers: "photo-1759272548449-7b689a81c8fb", // port staff reviewing a shipment beside containers
  tablet: "photo-1781559818983-c32838ee3d55", // a warehouse coordinator checking a tablet
  packing: "photo-1786026632846-6d411011130f", // a team member taping a parcel closed
  handoff: "photo-1566576721346-d4a3b4eaeb55", // a parcel being handed over
  /* Places and cargo */
  truck: "photo-1601584115197-04ecc0da31d7",
  truckRoad: "photo-1519003722824-194d4455a60c",
  warehouse: "photo-1586528116311-ad8dd3c8310d",
  forklift: "photo-1645736315000-6f788915923b",
  aisle: "photo-1553413077-190dd305871c",
  port: "photo-1494412574643-ff11b0a5c1c3",
  ships: "photo-1578575437130-527eed3abbec",
  plane: "photo-1436491865332-7a61a109cc05",
  cargoPlane: "photo-1774698078446-59299e016718",
  containers: "photo-1590496793929-36417d3117de",
} as const;

export type MediaKey = keyof typeof ID;

export const photo = (key: MediaKey, width = 1920) => unsplash(ID[key], width);

/** The main picture beside each homepage slide (the Super Admin can upload their own). */
export const SLIDE_PHOTO: Record<string, MediaKey> = {
  local: "scooter",
  international: "ships",
  air: "cargoPlane",
  sea: "port",
  express: "warehouse",
};

/** The small round picture that overlaps the main one. */
export const SLIDE_INSET: Record<string, MediaKey> = {
  local: "truck",
  international: "plane",
  air: "truckRoad",
  sea: "ships",
  express: "forklift",
};
