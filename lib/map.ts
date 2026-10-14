import type * as Leaflet from "leaflet";

// Esri gray canvas: free, no API key, works for Khujand. Replace with the production map
// provider (2GIS / Yandex / Mahal) when one is chosen.
export function addTiles(L: typeof Leaflet, map: Leaflet.Map, dark: boolean) {
  const style = dark ? "Dark" : "Light";
  const base = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_";
  L.tileLayer(`${base}${style}_Gray_Base/MapServer/tile/{z}/{y}/{x}`, { maxNativeZoom: 16, maxZoom: 16, attribution: "Esri, HERE, Garmin, © OpenStreetMap" }).addTo(map);
  L.tileLayer(`${base}${style}_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, { maxNativeZoom: 16, maxZoom: 16 }).addTo(map);
}

export const isDarkNow = () =>
  document.documentElement.dataset.theme === "dark" ||
  (!document.documentElement.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);

/** distance in km between two [lat, lng] points */
export function km(a: [number, number], b: [number, number]) {
  const r = Math.PI / 180;
  const x = (b[1] - a[1]) * r * Math.cos(((a[0] + b[0]) / 2) * r);
  const y = (b[0] - a[0]) * r;
  return Math.hypot(x, y) * 6371;
}

/** point at fraction t (0..1) along a polyline */
export function along(pts: [number, number][], t: number): [number, number] {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = t * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const k = d / seg[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= seg[i];
  }
  return pts[pts.length - 1];
}

/** simple L-shaped mock route venue → customer until a routing API is plugged in */
export function mockRoute(from: [number, number], to: [number, number]): [number, number][] {
  const midLat = (from[0] + to[0]) / 2;
  return [from, [midLat, from[1]], [midLat, to[1]], to];
}
