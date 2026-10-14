"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CU, CUISINES } from "@/lib/data";
import { highlight, norm, search } from "@/lib/search";
import { plural } from "@/lib/utils";
import { Icon } from "./Icon";
import { DishCard } from "./DishCard";
import { useBodyClass } from "./useBodyClass";

const POPULAR = ["плов", "лагман", "шашлык", "манты", "суп", "рис", "салат", "десерт"];

function load(): string[] {
  try { return JSON.parse(localStorage.getItem("oe-srch") || "[]"); } catch { return []; }
}
export function saveQuery(t: string) {
  t = t.trim();
  if (t.length < 2) return;
  const next = [t, ...load().filter((x) => norm(x) !== norm(t))].slice(0, 6);
  try { localStorage.setItem("oe-srch", JSON.stringify(next)); } catch {}
}

function Hl({ text, terms }: { text: string; terms: string[] }) {
  return <>{highlight(text, terms).map((p, i) => (p.m ? <mark key={i}>{p.t}</mark> : <span key={i}>{p.t}</span>))}</>;
}

/** The query lives in the URL (?q=) and is typed in the header search field. */
export function SearchView() {
  useBodyClass("s-view");
  const router = useRouter();
  const q = useSearchParams().get("q") ?? "";
  const [tab, setTab] = useState<"all" | "dish" | "ven">("all");
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => setRecent(load()), [q]);

  const setQ = (t: string) => {
    saveQuery(t);
    router.replace("/search?q=" + encodeURIComponent(t));
    setTab("all");
  };

  const r = useMemo(() => (q.trim() ? search(q) : null), [q]);

  if (!r) {
    return (
      <main className="wrap">
        <div className="srch">
          {recent.length > 0 && (
            <>
              <div className="s-h"><h2>Недавние</h2><button onClick={() => { try { localStorage.removeItem("oe-srch"); } catch {} setRecent([]); }}>Очистить</button></div>
              <div className="s-chips">{recent.map((t) => <button key={t} className="chip" onClick={() => setQ(t)}><Icon name="clock" />{t}</button>)}</div>
            </>
          )}
          <div className="s-h"><h2>Часто ищут</h2></div>
          <div className="s-chips">{POPULAR.map((t) => <button key={t} className="chip" onClick={() => setQ(t)}>{t}</button>)}</div>
          <div className="s-h"><h2>Кухни</h2></div>
          <div className="s-cu">
            {CUISINES.slice(0, 10).map((c) => (
              <button key={c.id} className="cu" onClick={() => setQ(c.name)}>
                <span>{c.name}</span><img src={`${CU}${c.id}.webp`} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!r.dishes.length && !r.venues.length) {
    return (
      <main className="wrap">
        <div className="srch">
          <div className="s-none">
            <div className="ic0"><Icon name="search" /></div>
            <h2>По запросу «{q}» пока ничего</h2>
            <p>В Худжанде такого ещё нет. Попробуйте поискать</p>
            <div className="s-chips">{POPULAR.slice(0, 5).map((t) => <button key={t} className="chip" onClick={() => setQ(t)}>{t}</button>)}</div>
          </div>
        </div>
      </main>
    );
  }

  const t = (tab === "dish" && !r.dishes.length) || (tab === "ven" && !r.venues.length) ? "all" : tab;
  const tabBtn = (k: typeof tab, label: string, n?: number) => (
    <button className="chip" aria-pressed={t === k} onClick={() => setTab(k)}>{label}{n != null && <span className="n">{n}</span>}</button>
  );

  return (
    <main className="wrap">
      <div className="srch">
        {r.fuzzy && <div className="s-count">Показаны похожие результаты</div>}
        <div className="s-tabs" role="group" aria-label="Что показать">
          {tabBtn("all", "Всё")}
          {tabBtn("dish", "Блюда", r.dishes.length)}
          {tabBtn("ven", "Заведения", r.venues.length)}
        </div>
        {t !== "dish" && r.venues.length > 0 && (
          <>
            <div className="s-h"><h2>Заведения</h2></div>
            <div className="s-ven">
              {r.venues.map(({ v, n }) => (
                <Link key={v.id} className="sv" href={`/r/${v.id}`} onClick={() => saveQuery(q)}>
                  <img src={v.cover} alt="" />
                  <span className="t">
                    <b><Hl text={v.name} terms={r.terms} /></b>
                    <small>{v.meta} · до {v.hours[1]}</small>
                    {n > 0 && <span className="hit">{n} {plural(n, "блюдо", "блюда", "блюд")} по запросу</span>}
                  </span>
                  <Icon name="right" />
                </Link>
              ))}
            </div>
          </>
        )}
        {t !== "ven" && r.dishes.length > 0 && (
          <>
            <div className="s-h"><h2>Блюда</h2></div>
            <div className="dishes" onClick={() => saveQuery(q)}>
              {r.dishes.map((d) => <DishCard key={d.id} d={d} name={<Hl text={d.name} terms={r.terms} />} />)}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
