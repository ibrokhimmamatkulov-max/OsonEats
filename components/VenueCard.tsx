"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Place, Venue } from "@/lib/data";
import { isOpenNow } from "@/lib/utils";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";

function FavButton({ id }: { id: string }) {
  const { favs, toggleFav } = useApp();
  return (
    <button
      className="fav"
      aria-label="В избранное"
      aria-pressed={favs.includes(id)}
      onClick={(e) => {
        e.preventDefault();
        toggleFav(id);
      }}
    >
      <Icon name="heart" />
    </button>
  );
}

function Logo({ name, logo }: { name: string; logo?: string }) {
  return <div className="v-logo">{logo ? <img src={logo} alt="" /> : name[0]}</div>;
}

/** Open/closed depends on the viewer's clock, so it is decided after mount (server renders "open"). */
export function useOpen(hours: [string, string]) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    setOpen(isOpenNow(hours));
    const t = setInterval(() => setOpen(isOpenNow(hours)), 60_000);
    return () => clearInterval(t);
  }, [hours]);
  return open;
}

export function VenueCard({ v }: { v: Venue }) {
  const open = useOpen(v.hours);
  return (
    <Link className={"v" + (open ? "" : " is-closed")} href={`/r/${v.id}`}>
      <div className="v-media">
        <img src={v.cover} alt={v.name} loading="lazy" />
        <FavButton id={v.id} />
        <div className="badge">
          {open ? (
            <>
              {v.isNew && <span className="new">Новое</span>}
              <span><Icon name="clock" />до {v.hours[1]}</span>
              {v.mode === "pickup" && <span><Icon name="bag" />Самовывоз</span>}
              {v.mode === "menu" && <span><Icon name="book" />Только меню</span>}
            </>
          ) : (
            <span className="closed"><Icon name="clock" />Закрыто · откроется в {v.hours[0]}</span>
          )}
        </div>
      </div>
      <div className="v-body">
        <Logo name={v.name} logo={v.logo} />
        <div>
          <div className="v-name">{v.name}</div>
          <div className="v-meta">{v.meta}</div>
        </div>
      </div>
    </Link>
  );
}

export function PlaceCard({ p }: { p: Place }) {
  return (
    <Link className="v" href={`/p/${p.id}`}>
      <div className="v-media">
        <img src={p.cover} alt={p.name} loading="lazy" />
        <FavButton id={"p:" + p.id} />
        <div className="badge">
          <span><Icon name="clock" />до {p.hours[0][1]}</span>
          <span>{p.tag}</span>
        </div>
      </div>
      <div className="v-body">
        <Logo name={p.name} logo={p.logo} />
        <div>
          <div className="v-name">{p.name}</div>
          <div className="v-meta">{p.meta}</div>
        </div>
      </div>
    </Link>
  );
}
