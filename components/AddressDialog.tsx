"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { CITIES, type City } from "@/lib/data";
import { addTiles, isDarkNow, km } from "@/lib/map";
import { STREETS, ZONE_KM } from "@/lib/streets";
import { Icon } from "./Icon";
import { useApp, type Address } from "./AppProvider";

/** name the point under the pin with the nearest mock street + a stable pseudo house number */
function reverseGeocode(city: City, ll: [number, number]): string {
  let best = STREETS[city][0], d = Infinity;
  for (const s of STREETS[city]) {
    const k = km(ll, [s[1], s[2]]);
    if (k < d) { d = k; best = s; }
  }
  const house = 1 + (Math.abs(Math.round((ll[0] - best[1]) * 4e4 + (ll[1] - best[2]) * 3e4)) % 120);
  return `${best[0]}, ${house}`;
}

const hasHouse = (label: string) => /\d/.test(label);

export function AddressDialog() {
  const { addrPicker, closeAddr, addr, recent, chooseAddr } = useApp();
  const open = !!addrPicker;
  const [city, setCity] = useState<City>("Худжанд");
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Address | null>(null);
  const [moving, setMoving] = useState(false);
  const [note, setNote] = useState("");
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const input = useRef<HTMLInputElement>(null);
  // a programmatic move (list click) keeps its own label instead of reverse-geocoding
  const lockLabel = useRef<string | null>(null);
  const pickRef = useRef<Address | null>(null);
  pickRef.current = pick;
  const cityRef = useRef(city);
  cityRef.current = city;

  useEffect(() => {
    if (!open) return;
    const c = addr?.city ?? "Худжанд";
    setCity(c);
    setPick(addr);
    setQ(addr?.label ?? "");
    setNote("");
    document.body.classList.add("locked");
    setTimeout(() => input.current?.focus(), 60);

    let alive = true;
    import("leaflet").then((mod) => {
      if (!alive || !mapEl.current) return;
      const L = mod.default ?? mod;
      if (!map.current) {
        const m = (map.current = L.map(mapEl.current, { zoomControl: false, maxZoom: 16, attributionControl: false }));
        addTiles(L, m, isDarkNow());
        m.on("movestart", () => setMoving(true));
        m.on("moveend", () => {
          setMoving(false);
          const ctr = m.getCenter();
          const ll: [number, number] = [+ctr.lat.toFixed(5), +ctr.lng.toFixed(5)];
          const cur = pickRef.current;
          // ignore settle/resize jitter: keep the label if the map barely moved
          if (lockLabel.current) {
            setPick({ city: cityRef.current, label: lockLabel.current, ll });
            lockLabel.current = null;
          } else if (!cur || cur.city !== cityRef.current || km(ll, cur.ll) > 0.03) {
            const label = reverseGeocode(cityRef.current, ll);
            setPick({ city: cityRef.current, label, ll });
            setQ(label);
          }
        });
      }
      lockLabel.current = addr?.label ?? null;
      map.current.setView(addr?.ll ?? (CITIES[c] as [number, number]), addr ? 16 : 14, { animate: false });
      setTimeout(() => map.current?.invalidateSize(), 0);
    }).catch(() => setNote("Карта не загрузилась, выберите адрес из списка"));

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAddr();
    window.addEventListener("keydown", onKey);
    return () => {
      alive = false;
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("locked");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const outOfZone = !!pick && km(pick.ll, CITIES[city] as [number, number]) > ZONE_KM;
  const canSave = !!pick && !outOfZone && hasHouse(pick.label);

  const suggestions = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t || (pick && q === pick.label)) return null;
    const num = (t.match(/\d+\s*[а-я]?$/) ?? [""])[0].replace(/\s/g, "");
    const words = t.replace(/\d+\s*[а-я]?$/, "").replace(/[,.]/g, " ").trim().split(/\s+/).filter(Boolean);
    return STREETS[city]
      .filter(([n]) => words.every((w) => n.toLowerCase().includes(w)))
      .slice(0, 6)
      .map(([n, la, lo]) => ({ label: n + (num ? ", " + num : ""), ll: [la + (parseInt(num) || 0) * 0.00003, lo] as [number, number], needsHouse: !num }));
  }, [q, city, pick]);

  const goTo = (label: string, ll: [number, number]) => {
    setPick({ city, label, ll });
    setQ(label);
    lockLabel.current = label;
    map.current?.setView(ll, 16);
  };

  const switchCity = (c: City) => {
    if (c === city) return;
    setCity(c);
    setPick(null);
    setQ("");
    lockLabel.current = null;
    map.current?.setView(CITIES[c] as [number, number], 14);
  };

  const locate = () => {
    if (!navigator.geolocation) return setNote("Геолокация недоступна в этом браузере");
    navigator.geolocation.getCurrentPosition(
      (p) => map.current?.setView([p.coords.latitude, p.coords.longitude], 16),
      () => setNote("Не удалось определить местоположение. Разрешите доступ или выберите на карте"),
      { timeout: 8000 },
    );
  };

  const save = () => {
    if (!pick || !canSave) return;
    const a = { ...pick, city };
    chooseAddr(a);
    const then = addrPicker?.then;
    closeAddr();
    then?.(a);
  };

  const recentHere = recent.filter((r) => r.city === city);

  return (
    <div className={"ad-bg" + (open ? " open" : "")} onClick={(e) => e.target === e.currentTarget && closeAddr()}>
      <div className="ad" role="dialog" aria-modal="true" aria-labelledby="adH" tabIndex={-1}>
        <div className="ad-side">
          <h2 id="adH">Адрес доставки</h2>
          <div className="tabs" role="group" aria-label="Город">
            {(Object.keys(CITIES) as City[]).map((c) => (
              <button key={c} type="button" aria-pressed={city === c} onClick={() => switchCity(c)}>{c}</button>
            ))}
          </div>
          <label className="ad-q">
            <Icon name="search" />
            <input ref={input} placeholder="Улица и дом" autoComplete="off" aria-label="Улица и дом" value={q} onChange={(e) => { setQ(e.target.value); setPick(null); }} />
            {q && (
              <button type="button" className="clr" aria-label="Очистить" onClick={(e) => { e.preventDefault(); setQ(""); setPick(null); input.current?.focus(); }}>
                <Icon name="x" />
              </button>
            )}
          </label>
          <div className="ad-list" role="listbox" aria-label="Подсказки">
            {suggestions ? (
              suggestions.length ? (
                suggestions.map((s) => (
                  <button key={s.label} className="ad-it" onClick={() => {
                    if (s.needsHouse) { setQ(s.label + ", "); map.current?.setView(s.ll, 16); input.current?.focus(); return; }
                    goTo(s.label, s.ll);
                  }}>
                    <span className="ic"><Icon name="pin" /></span>
                    <span><b>{s.label}</b><small>{city}{s.needsHouse ? " · укажите номер дома" : ""}</small></span>
                  </button>
                ))
              ) : (
                <div className="ad-empty">Такой улицы не нашли. Передвиньте карту под булавку</div>
              )
            ) : (
              <>
                {recentHere.length > 0 && <div className="ad-h">Недавние</div>}
                {recentHere.map((r) => (
                  <button key={r.label} className="ad-it" onClick={() => goTo(r.label, r.ll)}>
                    <span className="ic"><Icon name="clock" /></span>
                    <span><b>{r.label}</b><small>{r.city}</small></span>
                  </button>
                ))}
                <div className="ad-h">Подсказка</div>
                <div className="ad-empty">Начните вводить улицу или передвиньте карту под булавку</div>
              </>
            )}
          </div>
          <div className="ad-note" role="status">{outOfZone ? "Сюда пока не доставляем: адрес вне зоны доставки" : note}</div>
          <button className="ad-go" disabled={!canSave} onClick={save}>Доставить сюда</button>
        </div>
        <div className="ad-map">
          <div id="adMap" ref={mapEl} aria-label="Карта: передвиньте карту, чтобы выбрать точку" />
          <div className="ad-shadow" />
          <div className={"ad-pin" + (moving ? " up" : "")}>
            <svg width="40" height="52" viewBox="0 0 40 52" aria-hidden="true">
              <path d="M20 0C9 0 0 9 0 20c0 14 20 32 20 32s20-18 20-32C40 9 31 0 20 0z" style={{ fill: "var(--primary)" }} />
              <circle cx="20" cy="20" r="7" fill="#fff" />
            </svg>
          </div>
          <div className="ad-tip">{!moving && pick ? pick.label : ""}</div>
          <button className="ad-loc" aria-label="Моё местоположение" onClick={locate}><Icon name="nav" /></button>
        </div>
        <button className="ad-x" aria-label="Закрыть" onClick={closeAddr}><Icon name="x" /></button>
      </div>
    </div>
  );
}
