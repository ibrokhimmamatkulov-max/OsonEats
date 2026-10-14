"use client";

import { useState } from "react";
import { ALL_DISHES, CU, CUISINES, PLACES, POPULAR_IDS, VENUES, type Place, type Venue } from "@/lib/data";
import { isOpenNow } from "@/lib/utils";
import { useApp } from "./AppProvider";
import { DishCard } from "./DishCard";
import { PlaceCard, VenueCard } from "./VenueCard";

type Filter<T> = [key: string, label: string, test: (x: T) => boolean];
const VENUE_FILTERS: Filter<Venue>[] = [
  ["all", "Все", () => true],
  ["open", "Открыто", (v) => isOpenNow(v.hours)],
  ["pickup", "Самовывоз", (v) => v.mode === "pickup"],
  ["delivery", "Доставка", (v) => v.mode === "delivery"],
];
const PLACE_FILTERS: Filter<Place>[] = [
  ["all", "Все", () => true],
  ["open", "Открыто", (p) => isOpenNow(p.hours[0])],
  ["cafe", "Кафе", (p) => p.kind === "cafe"],
  ["rest", "Рестораны", (p) => p.kind === "rest"],
  ["coffee", "Кофейни", (p) => p.kind === "coffee"],
];

export function HomeView() {
  const { mode } = useApp();
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const visit = mode === "visit";

  const cuName = cuisine && CUISINES.find((c) => c.id === cuisine)?.name;
  const byCuisine = <T extends { cuisines: string[] }>(x: T) => !cuisine || x.cuisines.includes(cuisine);

  const filters = (visit ? PLACE_FILTERS : VENUE_FILTERS) as Filter<Venue | Place>[];
  const source: (Venue | Place)[] = visit ? PLACES : VENUES;
  const test = (filters.find((f) => f[0] === filter) ?? filters[0])[2];
  const list = source.filter(test).filter(byCuisine);

  const venueIds = new Set(VENUES.filter(byCuisine).map((v) => v.id));
  const dishes = POPULAR_IDS.map((id) => ALL_DISHES.find((d) => d.id === id)!).filter((d) => venueIds.has(d.venueId));

  const reset = () => {
    setCuisine(null);
    setFilter("all");
  };

  return (
    <main className="wrap">
      <section aria-label="Кухни">
        <div className="rail">
          {CUISINES.map((c) => (
            <button key={c.id} className="cu" aria-pressed={cuisine === c.id} onClick={() => setCuisine(cuisine === c.id ? null : c.id)}>
              <span>{c.name}</span>
              <img src={`${CU}${c.id}.webp`} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="vH">
        <div className="h"><h2 id="vH">{visit ? "Куда сходить" : "Заведения"}</h2></div>
        <div className="chips" role="group" aria-label="Фильтры">
          {filters.map(([key, label, f]) => (
            <button key={key} className="chip" aria-pressed={filter === key} disabled={key !== "open" && !source.some(f)} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="venues" aria-live="polite">
          {list.length ? (
            list.map((x) => (visit ? <PlaceCard key={x.id} p={x as Place} /> : <VenueCard key={x.id} v={x as Venue} />))
          ) : (
            <div className="empty">
              {cuName ? `${cuName} — пока нет заведений` : "Ничего не нашли"}
              <br />
              <button className="btn btn-primary" onClick={reset}>Показать все</button>
            </div>
          )}
        </div>
      </section>

      {!visit && dishes.length > 0 && (
        <section aria-labelledby="dH">
          <div className="h"><h2 id="dH">Популярные блюда</h2></div>
          <div className="dishes">
            {dishes.map((d) => <DishCard key={d.id} d={d} />)}
          </div>
        </section>
      )}

      <footer className="foot">© OsonEats · Худжанд</footer>
    </main>
  );
}
