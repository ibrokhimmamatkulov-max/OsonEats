"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { findDish, venueById } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import type { Order } from "@/lib/orders";
import { MOCK_HISTORY } from "@/lib/history";

type Mode = "order" | "visit";
type Theme = "system" | "light" | "dark";

type AppState = {
  mode: Mode;
  setMode: (m: Mode) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  cart: Record<string, number>;
  /** add (+n) or remove (-n) units of a dish */
  bump: (id: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSum: number;
  favs: string[];
  toggleFav: (venueId: string) => void;
  /** add dishes respecting "one cart = one venue": asks before replacing another venue's cart */
  addToCart: (id: string, qty?: number, extraPerUnit?: number, after?: () => void) => void;
  cartVenueId: string | null;
  openDish: (id: string) => void;
  closeDish: () => void;
  dishId: string | null;
  ask: (q: Question) => void;
  extraSum: number;
  orders: Order[];
  /** places the current cart as an order, clears the cart, returns the order */
  placeOrder: (o: Omit<Order, "num" | "lines" | "sum" | "extra" | "createdAt" | "step" | "cancelled">) => Order;
  updateOrder: (num: number, patch: Partial<Order>) => void;
  /** puts an old order back into the cart (asks if another venue's cart is there) */
  repeatOrder: (o: Order, after?: () => void) => void;
};

export type Question = { title: string; text: string; yes: string; onYes: () => void };

const Ctx = createContext<AppState | null>(null);

// localStorage can throw (private mode, blocked storage): never let it break the page
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("order");
  const [theme, setThemeState] = useState<Theme>("system");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [favs, setFavs] = useState<string[]>([]);
  // option surcharges (portion size, add-ons) are summed per cart, not per line, as in the mockups
  const [extraSum, setExtraSum] = useState(0);
  const [dishId, setDishId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);

  // hydrate persisted state after mount so server and client markup match
  useEffect(() => {
    setThemeState(load<Theme>("oe-theme", "system"));
    setCart(load("oe-cart", {}));
    setFavs(load("oe-favs", []));
    setExtraSum(load("oe-extra", 0));
    setOrders(load("oe-orders", MOCK_HISTORY()));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) save("oe-orders", orders); }, [orders, ready]);
  useEffect(() => { if (ready) save("oe-cart", cart); }, [cart, ready]);
  useEffect(() => { if (ready) save("oe-extra", extraSum); }, [extraSum, ready]);
  useEffect(() => { if (ready) save("oe-favs", favs); }, [favs, ready]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    save("oe-theme", t);
    if (t === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }, []);

  const cartVenueId = useMemo(() => {
    const first = Object.keys(cart)[0];
    return first ? findDish(first)?.venueId ?? null : null;
  }, [cart]);

  const add = useCallback((id: string, qty: number, extra: number) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + qty }));
    if (extra) setExtraSum((s) => s + extra * qty);
  }, []);

  const addToCart = useCallback(
    (id: string, qty = 1, extraPerUnit = 0, after?: () => void) => {
      const target = findDish(id)?.venueId;
      if (!cartVenueId || cartVenueId === target) {
        add(id, qty, extraPerUnit);
        after?.();
        return;
      }
      const from = venueById(cartVenueId)?.name;
      const to = target ? venueById(target)?.name : "";
      setQuestion({
        title: "Начать новый заказ?",
        text: `В корзине блюда из «${from}». Очистить её и добавить блюдо из «${to}»?`,
        yes: "Начать новый",
        onYes: () => {
          setCart({});
          setExtraSum(0);
          add(id, qty, extraPerUnit);
          after?.();
        },
      });
    },
    [cartVenueId, add],
  );

  const bump = useCallback(
    (id: string, delta: number) => {
      if (delta > 0) return addToCart(id, delta);
      setCart((c) => {
        const n = (c[id] || 0) + delta;
        const next = { ...c };
        if (n > 0) next[id] = n;
        else delete next[id];
        if (!Object.keys(next).length) setExtraSum(0);
        return next;
      });
    },
    [addToCart],
  );

  const repeatOrder = useCallback(
    (o: Order, after?: () => void) => {
      const put = () => {
        setCart((c) => {
          const next = { ...c };
          for (const [id, n] of o.lines) next[id] = (next[id] || 0) + n;
          return next;
        });
        if (o.extra) setExtraSum((s) => s + o.extra);
        after?.();
      };
      if (!cartVenueId || cartVenueId === o.venueId) return put();
      setQuestion({
        title: "Начать новый заказ?",
        text: `В корзине блюда из «${venueById(cartVenueId)?.name}». Заменить их этим заказом?`,
        yes: "Заменить",
        onYes: () => { setCart({}); setExtraSum(0); put(); },
      });
    },
    [cartVenueId],
  );

  const updateOrder = useCallback((num: number, patch: Partial<Order>) => {
    setOrders((os) => os.map((o) => (o.num === num ? { ...o, ...patch } : o)));
  }, []);

  const toggleFav = useCallback((id: string) => {
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }, []);

  const value = useMemo<AppState>(() => {
    let cartCount = 0;
    let cartSum = extraSum;
    for (const [id, n] of Object.entries(cart)) {
      const d = findDish(id);
      if (!d) continue;
      cartCount += n;
      cartSum += d.price * n;
    }
    return {
      mode, setMode, theme, setTheme, cart, bump,
      clearCart: () => { setCart({}); setExtraSum(0); },
      cartCount, cartSum, favs, toggleFav, addToCart, cartVenueId,
      openDish: setDishId, closeDish: () => setDishId(null), dishId, ask: setQuestion,
      extraSum, orders, updateOrder, repeatOrder,
      placeOrder: (o) => {
        const order: Order = {
          ...o,
          num: 1000 + Math.floor(Math.random() * 9000),
          lines: Object.entries(cart),
          sum: cartSum - extraSum,
          extra: extraSum,
          createdAt: Date.now(),
          step: 0,
          cancelled: false,
        };
        setOrders((os) => [order, ...os]);
        setCart({});
        setExtraSum(0);
        return order;
      },
    };
  }, [mode, theme, setTheme, cart, extraSum, bump, favs, toggleFav, addToCart, cartVenueId, dishId, orders, updateOrder, repeatOrder]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <ConfirmDialog q={question} onClose={() => setQuestion(null)} />
    </Ctx.Provider>
  );
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}
