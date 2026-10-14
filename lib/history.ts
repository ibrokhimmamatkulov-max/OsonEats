import { findDish, venueById } from "./utils";
import type { Order, OrderHow } from "./orders";
import { DELIVERY_FEE, FREE_DELIVERY_FROM } from "./data";

// Mock past orders shown in "Мои заказы" until the orders API exists.
export function MOCK_HISTORY(): Order[] {
  const ago = (days: number, h: number, m: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };
  const mk = (num: number, venueId: string, how: OrderHow, createdAt: number, cancelled: boolean, lines: [string, number][], pay: string, addr?: string): Order => {
    const sum = lines.reduce((a, [id, n]) => a + (findDish(id)?.price ?? 0) * n, 0);
    const steps = how === "pickup" ? 3 : 4;
    return {
      num, venueId, how, createdAt, cancelled, lines, sum, extra: 0, pay, cutlery: 1,
      fee: how === "delivery" && sum < FREE_DELIVERY_FROM ? DELIVERY_FEE : 0,
      addr: addr ?? venueById(venueId)?.pickupAddress ?? "",
      eta: "", step: cancelled ? 0 : steps - 1,
    };
  };
  return [
    mk(6512, "panda", "pickup", ago(2, 19, 40), false, [["p-lag1", 2], ["p-z2", 1]], "Наличными"),
    mk(6398, "yoron", "delivery", ago(4, 13, 5), false, [["plov", 2], ["y-4", 2], ["salad", 1]], "Картой при получении", "ул. Гагарина, 12"),
    mk(6211, "panda", "delivery", ago(7, 20, 15), true, [["p-r1", 1], ["sticky", 1], ["eggsoup", 1]], "Наличными", "ул. Гагарина, 12"),
    mk(5987, "yoron", "pickup", ago(15, 12, 30), false, [["kebab", 1], ["shurpa", 2], ["y-4", 1]], "Наличными"),
  ];
}
