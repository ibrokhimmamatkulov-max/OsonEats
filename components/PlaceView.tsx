"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { M, MENUS, type Place } from "@/lib/data";
import { addTiles, isDarkNow } from "@/lib/map";
import { formatPhone, isOpenNow, toMin } from "@/lib/utils";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";
import { useBodyClass } from "./useBodyClass";

const DAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const SHORT = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const todayIdx = () => (new Date().getDay() + 6) % 7; // 0 = Monday
const hoursFor = (p: Place, day: number) => (day >= 5 ? p.hours[1] : p.hours[0]);

export function PlaceView({ p, phone }: { p: Place; phone: string }) {
  const { setMode } = useApp();
  useBodyClass("pl-view");
  const [today, setToday] = useState(0);
  const [open, setOpen] = useState(true);
  const [booking, setBooking] = useState(false);
  const [toast, setToast] = useState("");
  useEffect(() => {
    setMode("visit");
    const d = todayIdx();
    setToday(d);
    setOpen(isOpenNow(hoursFor(p, d)));
  }, [p, setMode]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const [o, c] = hoursFor(p, today);
  const menu: [string, number, string][] = MENUS[p.id]
    ? MENUS[p.id].flatMap((cat) => cat.dishes).slice(0, 4).map((d) => [d.name, d.price, d.img])
    : (p.menu ?? []).map(([n, pr, img]) => [n, pr, M + img + ".jpg"]);
  const tel = "tel:" + phone.replace(/\s/g, "");

  return (
    <main className="wrap">
      <Link className="co-top" href="/"><Icon name="left" />Куда сходить</Link>
      <div className="pl-gal">
        {p.photos.map((u, i) => <img key={u} src={u} alt={`${p.name}, фото ${i + 1}`} loading={i ? "lazy" : "eager"} />)}
      </div>
      <div className="pl-grid">
        <div>
          <div className="pl-h">
            <h1>{p.name}</h1>
            <div className="pl-meta">{p.meta}</div>
            <div className={"pl-st" + (open ? "" : " off")}>{open ? `Открыто до ${c}` : `Закрыто · откроется в ${o}`}</div>
          </div>
          <div className="pl-feat">{p.features.map((f) => <span key={f}>{f}</span>)}</div>
          <p className="pl-desc">{p.desc}</p>

          <section className="pl-sec">
            <div className="h2r">
              <h2>Меню</h2>
              {MENUS[p.id] && <Link className="btn-s pri" href={`/r/${p.id}`}>Заказать доставку</Link>}
            </div>
            <div className="pl-menu">
              {menu.map(([n, pr, img]) => (
                <div className="pm" key={n}><img src={img} alt={n} loading="lazy" /><b>{pr} с.</b><span>{n}</span></div>
              ))}
            </div>
            <div className="pl-note">Цены для ознакомления, в заведении могут отличаться</div>
          </section>

          <section className="pl-sec">
            <div className="h2r"><h2>Часы работы</h2></div>
            <div className="hours">
              {DAYS.map((dn, i) => {
                const [a, b] = hoursFor(p, i);
                return (
                  <div key={dn} className={i === today ? "today" : undefined}>
                    <span>{dn}{i === today ? " · сегодня" : ""}</span><span>{a}–{b}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="pl-card">
          <PlaceMap p={p} />
          <div className="in">
            <div className="ad1">{p.addr}</div>
            <div className="ad2">Худжанд · {phone}</div>
            <div className="pl-act">
              <button className="pri" onClick={() => setBooking(true)}>Забронировать стол</button>
              <a href={tel}><Icon name="phone" />Позвонить</a>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.ll.join(",")}`} target="_blank" rel="noopener"><Icon name="nav" />Маршрут</a>
            </div>
          </div>
        </aside>
      </div>
      <div className="pl-bar">
        <a href={tel}><Icon name="phone" />Позвонить</a>
        <button className="pri" onClick={() => setBooking(true)}>Забронировать</button>
      </div>
      {booking && <BookingDialog p={p} onClose={() => setBooking(false)} onDone={setToast} />}
      <div className="toast" role="alert" hidden={!toast}>{toast}</div>
    </main>
  );
}

function PlaceMap({ p }: { p: Place }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let m: Leaflet.Map | null = null;
    let alive = true;
    import("leaflet").then((mod) => {
      if (!alive || !el.current) return;
      const L = mod.default ?? mod;
      m = L.map(el.current, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, keyboard: false, maxZoom: 16 }).setView(p.ll, 15);
      addTiles(L, m, isDarkNow());
      L.marker(p.ll, { icon: L.divIcon({ className: "", html: `<div class="mk">${p.logo ? `<img src="${p.logo}" alt="">` : p.name[0]}</div>`, iconSize: [44, 44], iconAnchor: [22, 22] }), keyboard: false }).addTo(m);
    });
    return () => { alive = false; m?.remove(); };
  }, [p]);
  return <div id="plMap" ref={el} aria-label="Карта" />;
}

function BookingDialog({ p, onClose, onDone }: { p: Place; onClose: () => void; onDone: (msg: string) => void }) {
  const { user } = useApp();
  const [guests, setGuests] = useState(2);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [err, setErr] = useState("");

  const times = (d: number) => {
    const [o, c] = hoursFor(p, (todayIdx() + d) % 7);
    const close = c === "00:00" ? 1440 : toMin(c);
    const now = new Date();
    const start = d ? toMin(o) : Math.max(toMin(o), now.getHours() * 60 + now.getMinutes() + 60);
    const out: string[] = [];
    for (let t = Math.ceil(start / 30) * 30; t <= close - 60 && out.length < 12; t += 30)
      out.push(String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"));
    return out;
  };
  const todayFull = times(0).length === 0;
  const d = todayFull && day === 0 ? 1 : day;
  const ts = times(d);
  const t = slot && ts.includes(slot) ? slot : ts[Math.min(2, ts.length - 1)];
  const dayName = (i: number) => (i === 0 ? "Сегодня" : i === 1 ? "Завтра" : `${SHORT[(todayIdx() + i) % 7]}, ${new Date(Date.now() + i * 864e5).getDate()}`);

  useEffect(() => {
    document.body.classList.add("locked");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { document.body.classList.remove("locked"); window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const submit = () => {
    if (!name.trim()) return setErr("Укажите имя");
    if (phone.length !== 9) return setErr("Нужен номер из 9 цифр");
    onClose();
    onDone(`Заявка отправлена: ${dayName(d).toLowerCase()} в ${t}, гостей: ${guests}. «${p.name}» перезвонит`);
  };

  return (
    <div className="au-bg open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="au bk" role="dialog" aria-modal="true" aria-labelledby="bkH">
        <button className="au-x" aria-label="Закрыть" onClick={onClose}><Icon name="x" /></button>
        <h2 id="bkH">Бронь столика</h2>
        <p>{p.name} · {p.addr}</p>
        <div className="bk-row">
          <b>Гостей</b>
          <div className="stepper">
            <button aria-label="Меньше" disabled={guests <= 1} onClick={() => setGuests((g) => g - 1)}><Icon name="minus" /></button>
            <span>{guests}</span>
            <button aria-label="Больше" disabled={guests >= 12} onClick={() => setGuests((g) => g + 1)}><Icon name="plus" /></button>
          </div>
        </div>
        <div className="bk-lbl">День</div>
        <div className="s-chips">
          {[0, 1, 2, 3].map((i) => (
            <button key={i} className="chip" aria-pressed={d === i} disabled={i === 0 && todayFull} onClick={() => setDay(i)}>{dayName(i)}</button>
          ))}
        </div>
        <div className="bk-lbl">Время</div>
        <div className="s-chips">
          {ts.map((x) => <button key={x} className="chip" aria-pressed={t === x} onClick={() => setSlot(x)}>{x}</button>)}
        </div>
        <div className="bk-two">
          <input className="inp" placeholder="Имя" aria-label="Имя" value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} />
          <div className="inp-ph">
            <span>+992</span>
            <input inputMode="tel" placeholder="90 123 45 67" aria-label="Телефон" value={formatPhone(phone)} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 9)); setErr(""); }} />
          </div>
        </div>
        <div className="au-err" role="alert">{err}</div>
        <button className="au-go" onClick={submit}>Забронировать{t ? ` на ${t}` : ""}</button>
        <div className="au-legal">Заведение перезвонит, чтобы подтвердить бронь</div>
      </div>
    </div>
  );
}
