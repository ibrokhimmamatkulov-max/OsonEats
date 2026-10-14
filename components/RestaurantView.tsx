"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MENUS, type Venue } from "@/lib/data";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";
import { CartLines } from "./CartLines";
import { DishCard } from "./DishCard";
import { useOpen } from "./VenueCard";

export function RestaurantView({ v }: { v: Venue }) {
  const { cartCount, cartSum, cartVenueId } = useApp();
  const cats = MENUS[v.id] ?? [];
  const open = useOpen(v.hours);
  const [active, setActive] = useState(0);
  const nav = useRef<HTMLElement>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);

  // highlight the category currently under the header
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number(e.target.id.slice(1)))),
      { rootMargin: "-140px 0px -65% 0px" },
    );
    document.querySelectorAll(".rv-sec").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [v.id]);

  // on phones the category strip scrolls horizontally: keep the active chip in view
  useEffect(() => {
    const n = nav.current, a = links.current[active];
    if (n && a && n.scrollWidth > n.clientWidth) n.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" });
  }, [active]);

  // r-view: hides search/mode in the phone header and the floating cart on desktop (side panel instead)
  useEffect(() => {
    document.body.classList.add("r-view");
    return () => document.body.classList.remove("r-view");
  }, []);

  // sticky offsets depend on the header height (it wraps on phones)
  useEffect(() => {
    const set = () => {
      const h = document.querySelector(".hdr") as HTMLElement | null;
      if (h) document.documentElement.style.setProperty("--hh", h.offsetHeight + "px");
    };
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  const modeLabel = v.mode === "pickup" ? "Самовывоз" : v.mode === "menu" ? "Только меню" : "Доставка";
  const check = v.meta.split(" · ").pop();
  const ownCart = cartVenueId === v.id && cartCount > 0;

  return (
    <main className="wrap" id="rest">
      <Link className="rv-back" href="/"><Icon name="left" />Все заведения</Link>
      <div className="rv-hero">
        <img src={v.cover} alt="" />
        <Link className="rv-back-m" href="/" aria-label="Назад"><Icon name="left" /></Link>
        <div className="rv-head">
          <div className="rv-logo">{v.logo ? <img src={v.logo} alt="" /> : v.name[0]}</div>
          <div>
            <h1 className="rv-name">{v.name}</h1>
            <div className="rv-pills">
              <span><Icon name="clock" />{open ? `до ${v.hours[1]}` : `закрыто до ${v.hours[0]}`}</span>
              <span><Icon name={v.mode === "menu" ? "book" : "bag"} />{modeLabel}</span>
              <span>{check}</span>
            </div>
          </div>
        </div>
      </div>

      {!open && (
        <div className="closed-bn">
          <span className="ic"><Icon name="clock" /></span>
          <div>
            <b>Сейчас закрыто, откроется в {v.hours[0]}</b>
            <span>Можно собрать заказ сейчас и получить его ко времени</span>
          </div>
        </div>
      )}

      <div className="rv-grid">
        <nav className="rv-nav" ref={nav} aria-label="Разделы меню">
          {cats.map((c, i) => (
            <a
              key={c.category}
              href={`#c${i}`}
              ref={(el) => { links.current[i] = el; }}
              className={i === active ? "on" : undefined}
              onClick={(e) => {
                e.preventDefault();
                setActive(i);
                document.getElementById(`c${i}`)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {c.category}
              <span>{c.dishes.length}</span>
            </a>
          ))}
        </nav>

        <div className="rv-main">
          {cats.map((c, i) => (
            <section className="rv-sec" id={`c${i}`} key={c.category} aria-label={c.category}>
              <h2>{c.category}</h2>
              <div className="dishes rv-dishes">
                {c.dishes.map((d) => <DishCard key={d.id} d={d} caption={d.weight} />)}
              </div>
            </section>
          ))}
        </div>

        <aside className="rv-cart" aria-label="Корзина">
          <h3>Корзина</h3>
          {ownCart ? (
            <>
              <CartLines />
              <div className="rc-tot"><span>Итого</span><b>{cartSum} с.</b></div>
              <Link className="rc-go" href="/checkout" style={{ display: "grid", placeItems: "center" }}>Оформить заказ</Link>
            </>
          ) : (
            <p className="rc-empty">{cartCount ? "В корзине блюда из другого заведения" : "Добавьте блюда из меню"}</p>
          )}
        </aside>
      </div>
    </main>
  );
}
