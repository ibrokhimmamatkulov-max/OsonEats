"use client";

import type { Dish } from "@/lib/data";
import { venueById } from "@/lib/utils";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";

/** Dish tile used on home, restaurant menu and search. `caption` defaults to the venue name. */
export function DishCard({ d, caption, name }: { d: Dish; caption?: string; name?: React.ReactNode }) {
  const { cart, bump, openDish } = useApp();
  const n = cart[d.id] || 0;
  return (
    <div className="d">
      <div className="d-media" onClick={() => openDish(d.id)}>
        <img src={d.img} alt={d.name} loading="lazy" />
      </div>
      <div className="d-price">
        {d.price} <small>с.</small>
      </div>
      <button className="d-name" style={{ textAlign: "left" }} onClick={() => openDish(d.id)}>{name ?? d.name}</button>
      <div className="d-venue">{caption ?? venueById(d.venueId)?.name}</div>
      <div className="d-spacer" />
      {n ? (
        <div className="qty">
          <button aria-label="Убрать" onClick={() => bump(d.id, -1)}><Icon name="minus" /></button>
          {n}
          <button aria-label="Добавить" onClick={() => bump(d.id, 1)}><Icon name="plus" /></button>
        </div>
      ) : (
        <button className="add" onClick={() => bump(d.id, 1)}>
          <Icon name="plus" />Добавить
        </button>
      )}
    </div>
  );
}
