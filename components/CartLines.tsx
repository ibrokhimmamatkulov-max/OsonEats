"use client";

import { findDish } from "@/lib/utils";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";

/** Cart rows with −/+ steppers; shared by the restaurant side panel and checkout summary. */
export function CartLines() {
  const { cart, bump } = useApp();
  return (
    <>
      {Object.entries(cart).map(([id, n]) => {
        const d = findDish(id);
        if (!d) return null;
        return (
          <div className="rc-l" key={id}>
            <img src={d.img} alt="" />
            <div className="rc-n">
              {d.name}
              <b>{d.price * n} с.</b>
            </div>
            <div className="rc-q">
              <button type="button" aria-label="Меньше" onClick={() => bump(id, -1)}><Icon name="minus" /></button>
              {n}
              <button type="button" aria-label="Больше" onClick={() => bump(id, 1)}><Icon name="plus" /></button>
            </div>
          </div>
        );
      })}
    </>
  );
}
