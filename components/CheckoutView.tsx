"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DELIVERY_FEE, FREE_DELIVERY_FROM } from "@/lib/data";
import { hm, type OrderHow } from "@/lib/orders";
import { formatPhone, toMin, venueById } from "@/lib/utils";
import { createOrder } from "@/lib/api";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";
import { CartLines } from "./CartLines";
import { useOpen } from "./VenueCard";

/** Half-hour slots from (now + 1h, or opening time if closed) until 30 min before closing. */
function slots(hours: [string, string], closedNow: boolean) {
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  const close = hours[1] === "00:00" ? 1440 : toMin(hours[1]);
  let start = nowM + 60;
  let prefix = "";
  if (closedNow) {
    const opensSoon = nowM < toMin(hours[0]);
    start = toMin(hours[0]) + 30;
    if (!opensSoon) prefix = "завтра ";
  }
  const out: string[] = [];
  for (let t = Math.ceil(start / 30) * 30; t <= close - 30 && out.length < 8; t += 30)
    out.push(prefix + String(Math.floor(t / 60) % 24).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"));
  return out;
}

export function CheckoutView() {
  const router = useRouter();
  const { cartVenueId, cartCount, cartSum, placeOrder, user, openAuth, addr, openAddr, ask } = useApp();
  const v = cartVenueId ? venueById(cartVenueId) : undefined;

  const [how, setHow] = useState<OrderHow>("delivery");
  const [when, setWhen] = useState<"asap" | "later">("asap");
  const [slot, setSlot] = useState<string | null>(null);
  const [pay, setPay] = useState<"cash" | "card">("cash");
  const [change, setChange] = useState("");
  const [cutlery, setCutlery] = useState(1);
  const [f, setF] = useState({ addr: "", ent: "", flr: "", apt: "", cour: "", name: "", phone: "", note: "" });
  const [bad, setBad] = useState<string[]>([]);
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  const open = useOpen(v?.hours ?? ["00:00", "00:00"]);
  const sl = useMemo(() => (v ? slots(v.hours, !open) : []), [v, open]);
  useEffect(() => {
    if (!open) setWhen("later");
  }, [open]);
  useEffect(() => {
    if (when === "later" && (!slot || !sl.includes(slot))) setSlot(sl[0] ?? null);
  }, [when, sl, slot]);

  // the address comes from the picker (header or the field below)
  useEffect(() => {
    if (addr) {
      setF((s) => ({ ...s, addr: addr.label }));
      setBad((b) => b.filter((x) => x !== "addr"));
    }
  }, [addr]);

  // a logged-in user gets name and phone filled in
  useEffect(() => {
    if (user) setF((s) => ({ ...s, name: s.name || user.name, phone: s.phone || formatPhone(user.phone) }));
  }, [user]);

  useEffect(() => {
    document.body.classList.add("co-view");
    return () => document.body.classList.remove("co-view");
  }, []);

  if (!v || !cartCount) {
    return (
      <main className="wrap">
        <div className="co-empty">
          <h1>В корзине пусто</h1>
          <p>Выберите заведение и добавьте блюда</p>
          <Link className="btn btn-primary" href="/">На главную</Link>
        </div>
      </main>
    );
  }

  const fee = how === "delivery" ? (cartSum >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE) : 0;
  const total = cartSum + fee;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = k === "phone" ? formatPhone(e.target.value.replace(/\D/g, "").slice(0, 9)) : e.target.value;
    setF((s) => ({ ...s, [k]: value }));
    setBad((b) => b.filter((x) => x !== k));
  };

  const submit = () => {
    const errs: string[] = [];
    if (how === "delivery" && f.addr.trim().length < 3) errs.push("addr");
    if (!f.name.trim()) errs.push("name");
    if (f.phone.replace(/\D/g, "").length !== 9) errs.push("phone");
    setBad(errs);
    if (errs.length) {
      const el = refs.current[errs[0]];
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return;
    }
    // confirm the phone by SMS first; the order is placed right after a successful code
    const digits = f.phone.replace(/\D/g, "");
    if (!user || user.phone !== digits) {
      openAuth({ phone: digits, name: f.name.trim(), then: place });
      return;
    }
    place();
  };

  const place = async () => {
    if (!v) return;
    try {
      await createOrder({ venueId: v.id, how, cart: cartCount });
    } catch (e) {
      const offline = (e as Error).message === "offline";
      ask({
        title: "Не получилось оформить заказ",
        text: offline
          ? "Нет интернета. Заказ не отправлен, ничего не списано. Проверьте связь и попробуйте ещё раз"
          : "Заведение не ответило. Ничего не списано: оплата при получении. Попробуйте ещё раз",
        yes: "Повторить",
        onYes: () => void place(),
      });
      return;
    }
    const eta = when === "later" && slot ? slot.replace("завтра ", "") : hm(new Date(Date.now() + (how === "delivery" ? 40 : 20) * 60000));
    const changeFrom = change.replace(/\D/g, "");
    const order = placeOrder({
      venueId: v.id,
      how,
      eta,
      fee,
      pay: pay === "card" ? "Картой при получении" : "Наличными" + (changeFrom ? `, сдача с ${changeFrom} с.` : ""),
      addr: how === "delivery" ? [f.addr.trim(), f.apt.trim() && "кв. " + f.apt.trim()].filter(Boolean).join(", ") : v.pickupAddress,
      ll: how === "delivery" && addr ? addr.ll : undefined,
      cutlery,
    });
    router.push(`/order/${order.num}`);
  };

  const field = (k: keyof typeof f, label: string, opts: { placeholder?: string; err?: string; inputMode?: "numeric" | "tel"; autoComplete?: string } = {}) => (
    <div className={"fld" + (bad.includes(k) ? " bad" : "")}>
      <label htmlFor={`f-${k}`}>{label}</label>
      <input className="inp" id={`f-${k}`} ref={(el) => { refs.current[k] = el; }} value={f[k]} onChange={set(k)} placeholder={opts.placeholder} inputMode={opts.inputMode} autoComplete={opts.autoComplete} />
      {opts.err && <span className="err">{opts.err}</span>}
    </div>
  );

  return (
    <main className="wrap">
      <Link className="co-top" href={`/r/${v.id}`}><Icon name="left" />Назад в «{v.name}»</Link>
      <h1 className="co-h1">Оформление заказа</h1>
      <form className="co" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div>
          <section className="co-sec">
            <div className="tabs" role="group" aria-label="Способ получения">
              <button type="button" aria-pressed={how === "delivery"} onClick={() => setHow("delivery")}>Доставка</button>
              <button type="button" aria-pressed={how === "pickup"} onClick={() => setHow("pickup")}>Самовывоз</button>
            </div>
            {how === "delivery" ? (
              <div>
                <div className={"fld" + (bad.includes("addr") ? " bad" : "")}>
                  <label htmlFor="f-addr">Адрес</label>
                  <input
                    className="inp" id="f-addr" readOnly placeholder="Выберите улицу и дом" value={f.addr}
                    ref={(el) => { refs.current.addr = el; }}
                    onClick={() => openAddr()}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openAddr(); } }}
                  />
                  <span className="err">Укажите улицу и дом</span>
                </div>
                <div className="row3">
                  {field("ent", "Подъезд", { inputMode: "numeric" })}
                  {field("flr", "Этаж", { inputMode: "numeric" })}
                  {field("apt", "Квартира")}
                </div>
                {field("cour", "Комментарий курьеру", { placeholder: "Например: домофон не работает" })}
              </div>
            ) : (
              <div className="pick">
                {v.logo ? <img src={v.logo} alt="" /> : <b className="lg">{v.name[0]}</b>}
                <div>
                  <b>{v.name}</b>, {v.pickupAddress}
                  <small>{open ? `Открыто до ${v.hours[1]} · будет готово через ~20 мин` : `Откроется в ${v.hours[0]} · заберёте ко времени`}</small>
                </div>
              </div>
            )}
          </section>

          <section className="co-sec">
            <h2>Когда</h2>
            <div className="chips" role="group" aria-label="Когда">
              <button type="button" className="chip" aria-pressed={when === "asap"} disabled={!open} onClick={() => setWhen("asap")}>
                {open ? `Как можно скорее · ~${how === "delivery" ? 40 : 20} мин` : <>Сейчас закрыто <small>· откроется в {v.hours[0]}</small></>}
              </button>
              <button type="button" className="chip" aria-pressed={when === "later"} disabled={!sl.length} onClick={() => setWhen("later")}>Ко времени</button>
            </div>
            {when === "later" && (
              <div className="slots">
                {sl.map((t) => (
                  <button type="button" key={t} className="chip" aria-pressed={slot === t} onClick={() => setSlot(t)}>{t}</button>
                ))}
              </div>
            )}
          </section>

          <section className="co-sec">
            <h2>Контакты</h2>
            <div className="row2">
              {field("name", "Имя", { err: "Как к вам обращаться?", autoComplete: "given-name" })}
              <div className={"fld" + (bad.includes("phone") ? " bad" : "")}>
                <label htmlFor="f-phone">Телефон</label>
                <div className="inp-ph">
                  <span>+992</span>
                  <input id="f-phone" ref={(el) => { refs.current.phone = el; }} value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel-national" placeholder="90 123 45 67" />
                </div>
                <span className="err">Нужно 9 цифр</span>
              </div>
            </div>
          </section>

          <section className="co-sec">
            <h2>Оплата при получении</h2>
            <label className="opt">
              <input type="radio" name="pay" checked={pay === "cash"} onChange={() => setPay("cash")} />
              <span className="mark" /><span className="ol">Наличными</span>
            </label>
            {pay === "cash" && (
              <label className="inp-ph change">
                <span>Сдача с</span>
                <input inputMode="numeric" placeholder="без сдачи" value={change} onChange={(e) => setChange(e.target.value.replace(/D/g, "").slice(0, 5))} aria-label="Сдача с какой суммы" />
                {change && <span className="suf">с.</span>}
              </label>
            )}
            <label className="opt">
              <input type="radio" name="pay" checked={pay === "card"} onChange={() => setPay("card")} />
              <span className="mark" /><span className="ol">Картой</span>
            </label>
          </section>

          <section className="co-sec">
            <h2>Комментарий к заказу</h2>
            <textarea className="inp" placeholder="Например: без лука" value={f.note} onChange={set("note")} aria-label="Комментарий к заказу" />
          </section>
        </div>

        <aside className="co-sum" aria-label="Ваш заказ">
          <h3>{v.logo ? <img src={v.logo} alt="" /> : <b>{v.name[0]}</b>}{v.name}</h3>
          <CartLines />
          <div className="cut">
            <span>Приборы</span>
            <div className="rc-q">
              <button type="button" aria-label="Меньше" onClick={() => setCutlery((c) => Math.max(0, c - 1))}><Icon name="minus" /></button>
              {cutlery}
              <button type="button" aria-label="Больше" onClick={() => setCutlery((c) => c + 1)}><Icon name="plus" /></button>
            </div>
          </div>
          <div className="sum-row"><span>Блюда · {cartCount}</span><span>{cartSum} с.</span></div>
          {how === "delivery" && (
            <>
              <div className="sum-row"><span>Доставка</span><span>{fee ? `${fee} с.` : "бесплатно"}</span></div>
              {fee > 0 && <div className="free-hint">Бесплатно от {FREE_DELIVERY_FROM} с.</div>}
            </>
          )}
          <div className="sum-row tot"><span>Итого</span><span>{total} с.</span></div>
          <button type="submit" className="rc-go">Заказать · {total} с.</button>
        </aside>
      </form>
      <div className="co-bar">
        <div>Итого<b>{total} с.</b></div>
        <button type="button" onClick={submit}>Заказать</button>
      </div>
    </main>
  );
}
