import type { Dish } from "./data";

export type OrderHow = "delivery" | "pickup";
export type OrderStep = { label: string; icon: "receipt" | "flame" | "bag" | "bike" | "check"; title: string };

export const STEPS: Record<OrderHow, OrderStep[]> = {
  pickup: [
    { label: "Принят", icon: "receipt", title: "Заказ принят" },
    { label: "Готовится", icon: "flame", title: "Готовим ваш заказ" },
    { label: "Готов", icon: "bag", title: "Готов, можно забирать" },
  ],
  delivery: [
    { label: "Принят", icon: "receipt", title: "Заказ принят" },
    { label: "Готовится", icon: "flame", title: "Готовим ваш заказ" },
    { label: "Курьер в пути", icon: "bike", title: "Курьер в пути" },
    { label: "Доставлен", icon: "check", title: "Доставлен" },
  ],
};

export type Order = {
  num: number;
  venueId: string;
  how: OrderHow;
  /** "HH:MM" promised time */
  eta: string;
  lines: [dishId: string, qty: number][];
  sum: number;
  fee: number;
  extra: number;
  pay: string;
  addr: string;
  /** delivery point, if picked on the map */
  ll?: [number, number];
  cutlery: number;
  createdAt: number;
  step: number;
  cancelled: boolean;
};

export const hm = (d: Date) => String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");

export const isLive = (o: Order) => !o.cancelled && o.step < STEPS[o.how].length - 1;

export const lineTotal = (d: Dish, n: number) => d.price * n;
