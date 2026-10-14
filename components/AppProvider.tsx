"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { findDish } from "@/lib/utils";

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
};

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
  const [ready, setReady] = useState(false);

  // hydrate persisted state after mount so server and client markup match
  useEffect(() => {
    setThemeState(load<Theme>("oe-theme", "system"));
    setCart(load("oe-cart", {}));
    setFavs(load("oe-favs", []));
    setReady(true);
  }, []);
  useEffect(() => { if (ready) save("oe-cart", cart); }, [cart, ready]);
  useEffect(() => { if (ready) save("oe-favs", favs); }, [favs, ready]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    save("oe-theme", t);
    if (t === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }, []);

  const bump = useCallback((id: string, delta: number) => {
    setCart((c) => {
      const n = (c[id] || 0) + delta;
      const next = { ...c };
      if (n > 0) next[id] = n;
      else delete next[id];
      return next;
    });
  }, []);

  const toggleFav = useCallback((id: string) => {
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  }, []);

  const value = useMemo<AppState>(() => {
    let cartCount = 0;
    let cartSum = 0;
    for (const [id, n] of Object.entries(cart)) {
      const d = findDish(id);
      if (!d) continue;
      cartCount += n;
      cartSum += d.price * n;
    }
    return {
      mode, setMode, theme, setTheme, cart, bump, clearCart: () => setCart({}),
      cartCount, cartSum, favs, toggleFav,
    };
  }, [mode, theme, setTheme, cart, bump, favs, toggleFav]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}
