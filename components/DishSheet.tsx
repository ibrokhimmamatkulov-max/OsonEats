"use client";

import { useEffect, useRef, useState } from "react";
import { MENUS, OPTIONS, POPULAR_IDS } from "@/lib/data";
import { findDish, venueById } from "@/lib/utils";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";

/** Dish card: centered modal on desktop, bottom sheet on phones (see .sheet in globals.css). */
export function DishSheet() {
  const { dishId, closeDish, openDish, addToCart, cart } = useApp();
  const [visible, setVisible] = useState(false); // drives the enter/leave transition
  const [qty, setQty] = useState(1);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const sheet = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const dish = dishId ? findDish(dishId) : undefined;
  const venue = dish ? venueById(dish.venueId) : undefined;
  const groups = dish ? OPTIONS[dish.venueId] ?? [] : [];

  // reset choices whenever a different dish opens; first radio option is the default
  useEffect(() => {
    if (!dish) return;
    setQty(1);
    const init: Record<string, boolean> = {};
    groups.forEach((g, gi) => { if (g.type === "radio") init[`${gi}:0`] = true; });
    setPicked(init);
    scroller.current?.scrollTo(0, 0);
    sheet.current?.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dishId]);

  useEffect(() => {
    if (dishId) {
      lastFocus.current = document.activeElement as HTMLElement;
      document.body.classList.add("locked");
      requestAnimationFrame(() => setVisible(true));
      setTimeout(() => sheet.current?.focus({ preventScroll: true }), 50);
    } else {
      setVisible(false);
      document.body.classList.remove("locked");
      lastFocus.current?.focus({ preventScroll: true });
    }
  }, [dishId]);

  useEffect(() => {
    if (!dishId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDish();
      if (e.key !== "Tab" || !sheet.current) return;
      // keep keyboard focus inside the dialog
      const f = [...sheet.current.querySelectorAll<HTMLElement>("button,input,summary")].filter((x) => !(x as HTMLButtonElement).disabled && x.offsetParent);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dishId, closeDish]);

  const extras = groups.reduce((sum, g, gi) => sum + g.options.reduce((s, [, price], oi) => s + (picked[`${gi}:${oi}`] ? price : 0), 0), 0);

  const choose = (gi: number, oi: number, radio: boolean) =>
    setPicked((p) => {
      const next = { ...p };
      if (radio) groups[gi].options.forEach((_, j) => delete next[`${gi}:${j}`]);
      next[`${gi}:${oi}`] = radio ? true : !p[`${gi}:${oi}`];
      return next;
    });

  // "С этим берут": popular dishes of the same venue first
  const alsoTake = dish
    ? (MENUS[dish.venueId] ?? []).flatMap((c) => c.dishes).filter((x) => x.id !== dish.id && !x.soldOut)
        .sort((a, b) => Number(POPULAR_IDS.includes(b.id)) - Number(POPULAR_IDS.includes(a.id))).slice(0, 6)
    : [];

  return (
    <>
      <div className={"scrim" + (visible ? " open" : "")} onClick={closeDish} />
      <div className={"sheet" + (visible ? " open" : "")} ref={sheet} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="sTitle" hidden={!dish}>
        {dish && venue && (
          <>
            <div className="s-photo"><img src={dish.img} alt={dish.name} /></div>
            <button className="s-close" aria-label="Закрыть" onClick={closeDish}><Icon name="x" /></button>
            <div className="s-body">
              <div className="s-scroll" ref={scroller}>
                <h3 className="s-title" id="sTitle">{dish.name}</h3>
                <div className="s-weight"><b>{dish.price} с.</b>{dish.weight} · {venue.name}</div>
                {dish.desc && <p className="s-desc">{dish.desc}</p>}
                <details className="more" key={dish.id}>
                  <summary>Состав и КБЖУ<Icon name="down" /></summary>
                  <p>
                    {dish.nutrition
                      ? `На 100 г: ${dish.nutrition[0]} ккал, белки ${dish.nutrition[1]} г, жиры ${dish.nutrition[2]} г, углеводы ${dish.nutrition[3]} г.`
                      : "Заведение пока не указало состав и КБЖУ."}
                  </p>
                </details>
                {groups.map((g, gi) => (
                  <div className="og" key={g.title}>
                    <div className="og-h"><h4>{g.title}</h4></div>
                    {g.options.map(([label, price], oi) => (
                      <label className="opt" key={label}>
                        <input type={g.type === "radio" ? "radio" : "checkbox"} name={`g${gi}`} checked={!!picked[`${gi}:${oi}`]} onChange={() => choose(gi, oi, g.type === "radio")} />
                        <span className="mark" />
                        <span className="ol">{label}</span>
                        <span className="op">{price ? `+${price} с.` : ""}</span>
                      </label>
                    ))}
                  </div>
                ))}
                {alsoTake.length > 0 && (
                  <div className="also">
                    <h4>С этим берут</h4>
                    <div className="also-rail">
                      {alsoTake.map((x) => (
                        <div className="a" key={x.id} onClick={() => openDish(x.id)}>
                          <div className="a-media">
                            <img src={x.img} alt={x.name} loading="lazy" />
                            <button className={"a-plus" + (cart[x.id] ? " added" : "")} aria-label={`Добавить ${x.name}`} onClick={(e) => { e.stopPropagation(); addToCart(x.id); }}>
                              <Icon name="plus" />
                            </button>
                          </div>
                          <b>{x.price} с.</b>
                          <span>{x.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="s-foot">
                <div className="stepper" style={dish.soldOut ? { visibility: "hidden" } : undefined}>
                  <button aria-label="Меньше" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}><Icon name="minus" /></button>
                  <span>{qty}</span>
                  <button aria-label="Больше" onClick={() => setQty((q) => q + 1)}><Icon name="plus" /></button>
                </div>
                <button className="s-add" disabled={dish.soldOut} onClick={() => addToCart(dish.id, qty, extras, closeDish)}>
                  <span>{dish.soldOut ? "Сейчас нет в наличии" : "Добавить"}</span>
                  {!dish.soldOut && <span className="tot">{(dish.price + extras) * qty} с.</span>}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
