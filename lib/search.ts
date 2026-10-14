import { ALL_DISHES, CUISINES, VENUES, type Dish, type Venue } from "./data";

export const norm = (t: string) => t.toLowerCase().replace(/ё/g, "е");
// crude Russian stemming: шашлыки → шашлык, супы → суп
export const stem = (w: string) => {
  const x = w.replace(/(ами|ями|ов|ев|ей|ам|ям|ах|ях|ые|ий|ая|ое|ы|и|а|я|у|ю|е|о)$/, "");
  return x.length >= 3 ? x : w;
};
const hit = (text: string, w: string) => text.includes(w) || text.includes(stem(w));

export type SearchResult = { dishes: Dish[]; venues: { v: Venue; n: number }[]; terms: string[]; fuzzy: boolean };

function run(terms: string[]) {
  const has = (t: string) => {
    const n = norm(t);
    return terms.every((w) => hit(n, w));
  };
  const cuisineNames = (v: Venue) => v.cuisines.map((k) => CUISINES.find((c) => c.id === k)?.name ?? "").join(" ");
  const dishes = ALL_DISHES.filter((d) => has(d.name + " " + d.category));
  const venues = VENUES.map((v) => ({ v, n: dishes.filter((d) => d.venueId === v.id).length, self: has(v.name + " " + v.meta + " " + cuisineNames(v)) }))
    .filter((x) => x.self || x.n)
    .map(({ v, n }) => ({ v, n }));
  return { dishes, venues };
}

/** Client-side search over the mock catalogue. Move server-side once the menu grows (full-text in the DB). */
export function search(query: string): SearchResult {
  let terms = norm(query).split(/\s+/).filter(Boolean);
  let r = run(terms);
  let fuzzy = false;
  if (!r.dishes.length && !r.venues.length) {
    // typo tolerance: drop the last two letters of long words
    const loose = terms.map((t) => (t.length > 4 ? t.slice(0, -2) : t));
    const r2 = run(loose);
    if (r2.dishes.length || r2.venues.length) {
      r = r2;
      terms = loose;
      fuzzy = true;
    }
  }
  return { ...r, terms, fuzzy };
}

/** splits text into [plain, matched] parts for highlighting */
export function highlight(text: string, terms: string[]): { t: string; m: boolean }[] {
  const n = norm(text);
  const marks: [number, number][] = [];
  for (const t0 of terms) {
    const t = n.includes(t0) ? t0 : stem(t0);
    const i = n.indexOf(t);
    if (i >= 0) marks.push([i, i + t.length]);
  }
  marks.sort((a, b) => a[0] - b[0]);
  const out: { t: string; m: boolean }[] = [];
  let p = 0;
  for (const [a, b] of marks) {
    if (a < p) continue;
    if (a > p) out.push({ t: text.slice(p, a), m: false });
    out.push({ t: text.slice(a, b), m: true });
    p = b;
  }
  if (p < text.length) out.push({ t: text.slice(p), m: false });
  return out;
}
