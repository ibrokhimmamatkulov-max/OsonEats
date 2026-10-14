"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PLACES, VENUES } from "@/lib/data";
import { STEPS, isLive } from "@/lib/orders";
import { formatPhone, plural } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";
import { useApp } from "./AppProvider";
import { useBodyClass } from "./useBodyClass";

function Row({ icon, title, sub, tail, href, onClick, danger }: {
  icon: IconName; title: React.ReactNode; sub?: string; tail?: React.ReactNode; href?: string; onClick?: () => void; danger?: boolean;
}) {
  const body = (
    <>
      <span className="ic"><Icon name={icon} /></span>
      <span className="t"><b>{title}</b>{sub && <small>{sub}</small>}</span>
      {tail}
    </>
  );
  const cls = "row" + (danger ? " danger" : "");
  if (href) return <Link className={cls} href={href}>{body}</Link>;
  if (onClick) return <button className={cls} onClick={onClick}>{body}</button>;
  return <div className={cls}>{body}</div>;
}

const chevron = <Icon name="right" />;

export function ProfileView() {
  const app = useApp();
  const { user, setUser, openAuth, orders, addr, recent, chooseAddr, removeRecent, openAddr, favs, theme, setTheme, ask } = app;
  useBodyClass("pf-view");
  const [sms, setSms] = useState(true);
  const [langNote, setLangNote] = useState("Русский");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try { setSms(localStorage.getItem("oe-sms") !== "0"); } catch {}
  }, []);
  useEffect(() => {
    setDark(theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches));
  }, [theme]);

  const live = orders.find(isLive);
  const favVenues = [...VENUES.filter((v) => favs.includes(v.id)), ...PLACES.filter((p) => favs.includes("p:" + p.id))];

  return (
    <main className="wrap">
      <Link className="co-top" href="/"><Icon name="left" />На главную</Link>
      <div className="pf">
        {user ? (
          <div className="pf-me">
            <div className="pf-av">{(user.name || "?")[0].toUpperCase()}</div>
            <div>
              <h1>{user.name || "Без имени"}</h1>
              <small>{user.phone ? "+992 " + formatPhone(user.phone) : "Вход через Telegram"}</small>
            </div>
            <button className="btn-s" onClick={() => openAuth({ phone: user.phone, name: user.name, step: "name" })}>Изменить</button>
          </div>
        ) : (
          <div className="pf-me">
            <div className="pf-av ghost"><Icon name="user" /></div>
            <div><h1>Войдите</h1><small>Чтобы видеть заказы, адреса и избранное</small></div>
            <button className="btn-s pri" onClick={() => openAuth()}>Войти</button>
          </div>
        )}

        {user && (
          <>
            <div className="grp-h">Заказы</div>
            <div className="grp">
              <Row icon="receipt" title="Мои заказы" href="/orders" tail={chevron}
                sub={live ? `Сейчас: заказ №${live.num} · ${STEPS[live.how][live.step].label.toLowerCase()}` : `${orders.length} ${plural(orders.length, "заказ", "заказа", "заказов")}`} />
            </div>

            <div className="grp-h">Адреса</div>
            <div className="grp">
              {recent.map((r) => (
                <div className="row" key={r.label} onClick={() => chooseAddr(r)} style={{ cursor: "pointer" }}>
                  <span className="ic"><Icon name="pin" /></span>
                  <span className="t"><b>{r.label}{addr?.label === r.label && <span className="cur-tag">текущий</span>}</b><small>{r.city}</small></span>
                  <button className="del" aria-label="Удалить адрес" onClick={(e) => { e.stopPropagation(); removeRecent(r.label); }}><Icon name="trash" /></button>
                </div>
              ))}
              <Row icon="plus" title="Добавить адрес" onClick={() => openAddr()} />
            </div>

            <div className="grp-h">Избранное</div>
            <div className="grp">
              {favVenues.length ? (
                <div className="favs">
                  {favVenues.map((v) => (
                    <Link className="fv" key={v.id + v.name} href={("mode" in v ? "/r/" : "/p/") + v.id}>
                      <div className="m"><img src={v.cover} alt="" /></div>
                      <b>{v.name}</b><small>{v.meta}</small>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="fav-empty">Нажмите ♡ на карточке заведения, и оно появится здесь</div>
              )}
            </div>
          </>
        )}

        <div className="grp-h">Настройки</div>
        <div className="grp">
          <div className="row wrap">
            <span className="ic"><Icon name="globe" /></span>
            <span className="t"><b>Язык</b><small>{langNote}</small></span>
            <div className="tabs">
              <button aria-pressed="true" onClick={() => setLangNote("Русский")}>Рус</button>
              <button aria-pressed="false" onClick={() => setLangNote("Тоҷикӣ и English скоро появятся")}>Тоҷ</button>
              <button aria-pressed="false" onClick={() => setLangNote("Тоҷикӣ и English скоро появятся")}>Eng</button>
            </div>
          </div>
          <div className="row wrap">
            <span className="ic"><Icon name={dark ? "moon" : "sun"} /></span>
            <span className="t"><b>Тема</b><small>{theme === "system" ? "Как в системе" : theme === "dark" ? "Тёмная" : "Светлая"}</small></span>
            <div className="tabs">
              {([["system", "Авто"], ["light", "Светлая"], ["dark", "Тёмная"]] as const).map(([k, l]) => (
                <button key={k} aria-pressed={theme === k} onClick={() => setTheme(k)}>{l}</button>
              ))}
            </div>
          </div>
          <Row icon="bell" title="SMS о статусе заказа" sub="Когда заказ готов или курьер выехал"
            tail={<button className="sw" role="switch" aria-checked={sms} aria-label="SMS о статусе заказа"
              onClick={() => { const n = !sms; setSms(n); try { localStorage.setItem("oe-sms", n ? "1" : "0"); } catch {} }} />} />
        </div>

        <div className="grp-h">Помощь</div>
        <div className="grp">
          <Row icon="tg" title="Поддержка в Telegram" sub="Ответим в течение 10 минут" href="#" tail={chevron} />
          <Row icon="doc" title="Условия сервиса" href="#" tail={chevron} />
          <Row icon="doc" title="Политика конфиденциальности" href="#" tail={chevron} />
        </div>

        {user && (
          <>
            <div className="grp" style={{ marginTop: 24 }}>
              <Row icon="out" title="Выйти" danger onClick={() => ask({ title: "Выйти из аккаунта?", text: "Корзина и избранное останутся на этом устройстве", yes: "Выйти", onYes: () => setUser(null) })} />
            </div>
            <button className="pf-del" onClick={() => ask({
              title: "Удалить аккаунт?", text: "Удалим имя, телефон, адреса и историю заказов. Это нельзя отменить", yes: "Удалить",
              onYes: () => { recent.forEach((r) => removeRecent(r.label)); setUser(null); },
            })}>Удалить аккаунт</button>
          </>
        )}
      </div>
    </main>
  );
}
