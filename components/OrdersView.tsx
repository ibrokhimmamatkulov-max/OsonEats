"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { STEPS, isLive, type Order } from "@/lib/orders";
import { findDish, venueById } from "@/lib/utils";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";
import { useBodyClass } from "./useBodyClass";

function dayLabel(ts: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const k = Math.round((today.getTime() - d.getTime()) / 864e5);
  if (k === 0) return "Сегодня";
  if (k === 1) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}
const time = (ts: number) => new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

function VenueLogo({ id }: { id: string }) {
  const v = venueById(id);
  return <span className="oc-lg">{v?.logo ? <img src={v.logo} alt="" /> : v?.name[0]}</span>;
}

export function OrdersView() {
  const { user, orders, openAuth } = useApp();
  useBodyClass("ol-view");

  const head = (
    <>
      <Link className="co-top" href="/"><Icon name="left" />На главную</Link>
      <h1 className="co-h1">Мои заказы</h1>
    </>
  );

  if (!user) {
    return (
      <main className="wrap">
        {head}
        <div className="olist ol-empty">
          <div className="ic0"><Icon name="receipt" /></div>
          <h2>Войдите, чтобы видеть заказы</h2>
          <p>Покажем историю и текущий заказ</p>
          <button className="btn btn-primary" onClick={() => openAuth()}>Войти</button>
        </div>
      </main>
    );
  }

  if (!orders.length) {
    return (
      <main className="wrap">
        {head}
        <div className="olist ol-empty">
          <div className="ic0"><Icon name="receipt" /></div>
          <h2>Здесь появятся ваши заказы</h2>
          <p>Пока вы ничего не заказывали</p>
          <Link className="btn btn-primary" href="/">Выбрать еду</Link>
        </div>
      </main>
    );
  }

  const live = orders.filter(isLive);
  const past = orders.filter((o) => !isLive(o));
  let lastDay = "";

  return (
    <main className="wrap">
      {head}
      <div className="olist">
        {live.length > 0 && <div className="oh">Сейчас</div>}
        {live.map((o) => <LiveCard key={o.num} o={o} />)}
        {past.map((o) => {
          const day = dayLabel(o.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={o.num}>
              {showDay && <div className="oh">{day}</div>}
              <PastCard o={o} />
            </div>
          );
        })}
      </div>
    </main>
  );
}

function LiveCard({ o }: { o: Order }) {
  const v = venueById(o.venueId);
  const steps = STEPS[o.how];
  return (
    <article className="oc live">
      <div className="oc-top">
        <VenueLogo id={o.venueId} />
        <div className="oc-nm"><b>{v?.name}</b><small>№{o.num} · {o.how === "pickup" ? "самовывоз" : "доставка"}</small></div>
        <span className="st-pill go">{steps[o.step].label}</span>
      </div>
      <div className="oc-eta">{o.how === "pickup" ? "Будет готово к" : "Привезём к"} <b>{o.eta}</b></div>
      <div className="bar">{steps.map((_, j) => <i key={j} className={j < o.step ? "on" : j === o.step ? "cur" : ""} />)}</div>
      <div className="oc-bot">
        <span className="sum">{o.sum + o.extra + o.fee} с.</span>
        <Link className="btn-s pri" href={`/order/${o.num}`}>Отследить</Link>
      </div>
    </article>
  );
}

function PastCard({ o }: { o: Order }) {
  const router = useRouter();
  const { repeatOrder } = useApp();
  const [open, setOpen] = useState(false);
  const v = venueById(o.venueId);
  const status = o.cancelled ? ["no", "Отменён"] : ["ok", o.how === "pickup" ? "Получен" : "Доставлен"];
  const ids = o.lines.map(([id]) => id);
  return (
    <article className="oc">
      <div className="oc-top">
        <VenueLogo id={o.venueId} />
        <div className="oc-nm"><b>{v?.name}</b><small>{time(o.createdAt)} · №{o.num} · {o.how === "pickup" ? "самовывоз" : "доставка"}</small></div>
        <span className={"st-pill " + status[0]}>{status[1]}</span>
      </div>
      <div className="oc-pics">
        {ids.slice(0, 4).map((id) => {
          const d = findDish(id);
          return d ? <img key={id} src={d.img} alt={d.name} /> : null;
        })}
        {ids.length > 4 && <span>+{ids.length - 4}</span>}
      </div>
      {open && (
        <div className="oc-det">
          {o.lines.map(([id, n]) => {
            const d = findDish(id);
            return d ? <div className="ln" key={id}><span>{d.name}{n > 1 ? ` × ${n}` : ""}</span><b>{d.price * n} с.</b></div> : null;
          })}
          {o.fee > 0 && <div className="ln"><span>Доставка</span><b>{o.fee} с.</b></div>}
          <div className="meta">{o.how === "pickup" ? "Самовывоз: " : "Доставка: "}{o.addr}<br />{o.pay}</div>
        </div>
      )}
      <div className="oc-bot">
        <span className="sum">{o.sum + o.extra + o.fee} с.</span>
        <button className="btn-s" aria-expanded={open} onClick={() => setOpen((x) => !x)}>Подробнее<Icon name="down" /></button>
        <button className="btn-s pri" onClick={() => repeatOrder(o, () => router.push("/checkout"))}>Повторить</button>
      </div>
    </article>
  );
}
