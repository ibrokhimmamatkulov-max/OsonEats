"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";

export function Header() {
  const { mode, setMode, theme, setTheme, user, openAuth } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // resolve "system" to the actual scheme so the icon matches what the user sees
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setDark(theme === "dark" || (theme === "system" && mq.matches));
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [theme]);

  return (
    <header className={"hdr" + (scrolled ? " scrolled" : "")}>
      <div className="wrap hdr-in">
        <Link className="logo" href="/" aria-label="OsonEats, главная">
          <span className="logo-mark">O</span>
          <span className="t">OsonEats</span>
        </Link>
        <div className="mode" role="group" aria-label="Режим">
          <button aria-pressed={mode === "order"} onClick={() => setMode("order")}>
            <Icon name="bag" />Доставка
          </button>
          <button aria-pressed={mode === "visit"} onClick={() => setMode("visit")}>
            <Icon name="map" />Куда сходить
          </button>
        </div>
        <button className="addr" aria-label="Адрес доставки">
          <Icon name="pin" />
          <span>Худжанд</span>
          <Icon name="down" style={{ width: 16, height: 16, color: "var(--muted)" }} />
        </button>
        <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
          <Icon name="search" />
          <label className="sr" htmlFor="q">Поиск</label>
          <input id="q" type="search" placeholder="Найти блюдо или заведение" autoComplete="off" />
        </form>
        <button className="icon-btn" aria-label="Сменить тему" onClick={() => setTheme(dark ? "light" : "dark")}>
          <Icon name={dark ? "sun" : "moon"} />
        </button>
        <Link className="icon-btn only-d" href="/orders" aria-label="Мои заказы"><Icon name="receipt" /></Link>
        {user ? (
          <Link className="who only-d" href="/profile">
            <span className="av">{(user.name || "?")[0].toUpperCase()}</span>
            {user.name || "Профиль"}
          </Link>
        ) : (
          <button className="btn btn-primary only-d" onClick={() => openAuth()}>Войти</button>
        )}
      </div>
    </header>
  );
}
