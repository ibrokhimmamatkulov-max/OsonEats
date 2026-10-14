"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { STEPS, type Order } from "@/lib/orders";
import { addTiles, along, isDarkNow, mockRoute } from "@/lib/map";
import { findDish, venueById } from "@/lib/utils";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";

// mock customer point until the address picker supplies one
const DEFAULT_HOME: [number, number] = [40.279, 69.646];
// demo: advance the order one step every few seconds (real status comes from the backend)
const DEMO_STEP_MS = 6000;

export function OrderTracking({ num }: { num: number }) {
  const { orders, updateOrder, ask, repeatOrder } = useApp();
  const router = useRouter();
  const o = orders.find((x) => x.num === num);

  useEffect(() => {
    document.body.classList.add("ord-view");
    return () => document.body.classList.remove("ord-view");
  }, []);

  // demo progression
  useEffect(() => {
    if (!o || o.cancelled) return;
    const last = STEPS[o.how].length - 1;
    if (o.step >= last) return;
    const t = setTimeout(() => updateOrder(o.num, { step: o.step + 1 }), DEMO_STEP_MS);
    return () => clearTimeout(t);
  }, [o, updateOrder]);

  if (!o) {
    return (
      <main className="wrap">
        <div className="nf">
          <h1>Заказ не найден</h1>
          <p>Возможно, он оформлен на другом устройстве</p>
          <Link className="btn btn-primary" href="/orders">Мои заказы</Link>
        </div>
      </main>
    );
  }

  const v = venueById(o.venueId)!;
  const steps = STEPS[o.how];
  const last = steps.length - 1;
  const fin = o.step === last;
  const pick = o.how === "pickup";
  const big = o.cancelled ? "Заказ отменён" : fin ? (pick ? "Готов, можно забирать" : "Доставлен") : pick ? `Будет готово к ${o.eta}` : `Привезём к ${o.eta}`;
  const sub = o.cancelled
    ? "Ничего не списано: оплата при получении"
    : fin ? (pick ? `${o.addr} · ждём до ${v.hours[1]}` : "Приятного аппетита!") : `${steps[o.step].title} · ${v.name}`;

  return (
    <main id="ordView">
      <div className="trk">
        <TrackMap o={o} />
        <Link className="trk-back-m" href="/" aria-label="На главную"><Icon name="left" /></Link>
        <section className={"trk-card" + (o.cancelled ? " off" : "")} aria-live="polite">
          <Link className="co-top" href="/"><Icon name="left" />На главную</Link>
          <div className="trk-num">Заказ №{o.num} · {pick ? "самовывоз" : "доставка"}</div>
          <div className="trk-eta">{big}</div>
          <div className="trk-st">{sub}</div>
          {!o.cancelled && (
            <div className="bar" aria-hidden="true">
              {steps.map((_, i) => <i key={i} className={i < o.step || fin ? "on" : i === o.step ? "cur" : ""} />)}
            </div>
          )}
          <div className="acts">
            {fin || o.cancelled ? (
              <button className="pri" onClick={() => repeatOrder(o, () => router.push("/checkout"))}>Повторить заказ</button>
            ) : (
              <>
                {pick && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${v.ll.join(",")}`} target="_blank" rel="noopener">
                    <Icon name="nav" />Маршрут
                  </a>
                )}
                <a href="tel:+992000000000"><Icon name="phone" />{!pick && o.step === 2 ? "Курьеру" : "Позвонить"}</a>
              </>
            )}
          </div>
          <details className="more">
            <summary>Подробнее о заказе<Icon name="down" /></summary>
            <div className="trk-addr"><b>{pick ? v.name : "Адрес доставки"}</b>{o.addr}</div>
            {o.lines.map(([id, n]) => {
              const d = findDish(id);
              return d ? (
                <div className="ln" key={id}>
                  <img src={d.img} alt="" />
                  <span>{d.name}{n > 1 ? ` × ${n}` : ""}</span>
                  <b>{d.price * n} с.</b>
                </div>
              ) : null;
            })}
            <div className="sum-row"><span>Блюда</span><span>{o.sum + o.extra} с.</span></div>
            {!pick && <div className="sum-row"><span>Доставка</span><span>{o.fee ? `${o.fee} с.` : "бесплатно"}</span></div>}
            <div className="sum-row tot"><span>Итого</span><span>{o.sum + o.extra + o.fee} с.</span></div>
            <div className="trk-pay">{o.pay} · приборов: {o.cutlery || "не нужны"}</div>
            {o.step === 0 && !o.cancelled && (
              <button
                className="cancel"
                onClick={() => ask({ title: "Отменить заказ?", text: "Заведение ещё не начало готовить, отмена бесплатная.", yes: "Отменить заказ", onYes: () => updateOrder(o.num, { cancelled: true }) })}
              >
                Отменить заказ
              </button>
            )}
          </details>
        </section>
      </div>
    </main>
  );
}

function TrackMap({ o }: { o: Order }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const courier = useRef<Leaflet.Marker | null>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const [ready, setReady] = useState(false);
  const v = venueById(o.venueId)!;
  const home = o.ll ?? DEFAULT_HOME;
  const route = mockRoute(v.ll, home);

  // create the map once (Leaflet touches window, so it is imported on the client only)
  useEffect(() => {
    let alive = true;
    import("leaflet").then((mod) => {
      if (!alive || !el.current || map.current) return;
      const Lf = (L.current = mod.default ?? mod);
      const m = (map.current = Lf.map(el.current, { zoomControl: false, maxZoom: 16 }));
      addTiles(Lf, m, isDarkNow());
      const icon = (cls: string, html: string) => Lf.divIcon({ className: "", html: `<div class="mk ${cls}">${html}</div>`, iconSize: [44, 44], iconAnchor: [22, 22] });
      const svg = (path: string) => `<svg viewBox="0 0 24 24">${path}</svg>`;
      Lf.marker(v.ll, { icon: icon("", v.logo ? `<img src="${v.logo}" alt="">` : v.name[0]), keyboard: false }).addTo(m);
      if (o.how === "delivery") {
        const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "#F2541B";
        Lf.polyline(route, { color: primary, weight: 5, opacity: 0.85, dashArray: "1 10", lineCap: "round" }).addTo(m);
        Lf.marker(home, { icon: icon("mk-home", svg('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>')), keyboard: false }).addTo(m);
        courier.current = Lf.marker(v.ll, { icon: icon("mk-cour", svg('<circle cx="5.5" cy="17" r="2.5"/><circle cx="18.5" cy="17" r="2.5"/><path d="M8 17h6l3.5-7H14M15 6h3l.5 4"/>')), keyboard: false });
      }
      fit();
      setReady(true);
    });
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.removeEventListener("resize", onResize);
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.num]);

  // keep the route visible next to / above the card
  function fit() {
    const m = map.current, Lf = L.current;
    if (!m || !Lf) return;
    m.invalidateSize();
    const mobile = window.innerWidth <= 768;
    const card = document.querySelector(".trk-card") as HTMLElement | null;
    const ch = card?.offsetHeight ?? 0;
    if (o.how === "delivery") {
      m.fitBounds(Lf.latLngBounds(route), mobile ? { paddingTopLeft: [40, 80], paddingBottomRight: [40, ch + 30] } : { paddingTopLeft: [500, 60], paddingBottomRight: [60, 60] });
    } else {
      m.setView(v.ll, 15);
      m.panBy(mobile ? [0, ch / 2 - 20] : [-230, 0], { animate: false });
    }
  }

  // courier marker follows the order step
  useEffect(() => {
    const m = map.current, c = courier.current;
    if (!ready || !m || !c) return;
    if (o.step === 2 && !o.cancelled) {
      c.addTo(m);
      let raf = 0;
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / DEMO_STEP_MS);
        c.setLatLng(along(route, 0.08 + t * 0.8));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    if (o.step === 3) c.addTo(m).setLatLng(home);
    else c.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, o.step, o.cancelled]);

  return <div id="trkMap" ref={el} aria-label="Карта" />;
}
