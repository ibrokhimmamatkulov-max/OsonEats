"use client";

import type { Dish } from "@/lib/data";
import { venueById } from "@/lib/utils";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";

/** Dish tile used on home, restaurant menu and search. `caption` defaults to the venue name. */
export function DishCard({ d, caption }: { d: Dish; caption?: string }) {
  const { cart, bump } = useApp();
  const n = cart[d.id] || 0;
  return (
    <div className="d">
      <div className="d-media">
        <img src={d.img} alt={d.name} loading="lazy" />
      </div>
      <div className="d-price">
        {d.price} <small>с.</small>
      </div>
      <div className="d-name">{d.name}</div>
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
