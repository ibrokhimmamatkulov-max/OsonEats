import { ALL_DISHES, VENUES, type Dish, type Venue } from "./data";

export const findDish = (id: string): Dish | undefined => ALL_DISHES.find((d) => d.id === id);
export const venueById = (id: string): Venue | undefined => VENUES.find((v) => v.id === id);

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function isOpenNow(hours: [string, string], now = new Date()) {
  const m = now.getHours() * 60 + now.getMinutes();
  const close = hours[1] === "00:00" ? 1440 : toMin(hours[1]);
  return m >= toMin(hours[0]) && m < close;
}

export function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

/** "901234567" -> "90 123 45 67" */
export const formatPhone = (digits: string) =>
  [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean).join(" ");
