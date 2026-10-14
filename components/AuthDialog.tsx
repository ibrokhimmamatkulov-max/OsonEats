"use client";

import { useEffect, useRef, useState } from "react";
import { formatPhone } from "@/lib/utils";
import { sendCode, verifyCode } from "@/lib/api";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";

type Step = "phone" | "code" | "name";

/** Phone login: number → 4-digit SMS code → name (new users only). */
export function AuthDialog() {
  const { auth, closeAuth, user, setUser } = useApp();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLInputElement | null)[]>([]);
  const lastFocus = useRef<HTMLElement | null>(null);

  // (re)start on open: skip straight to the code if the phone is already known
  useEffect(() => {
    if (!auth) return;
    lastFocus.current = document.activeElement as HTMLElement;
    document.body.classList.add("locked");
    const p = auth.phone ?? "";
    setPhone(p);
    setName(auth.name ?? "");
    setErr("");
    if (auth.step === "name") setStep("name");
    else if (p.length === 9) void requestCode(p);
    else setStep("phone");
    return () => {
      document.body.classList.remove("locked");
      lastFocus.current?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  useEffect(() => {
    if (step !== "code" || left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, left]);

  useEffect(() => {
    if (!auth) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAuth();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [auth, closeAuth]);

  useEffect(() => {
    if (!auth) return;
    const t = setTimeout(() => {
      if (step === "code") cells.current[0]?.focus();
      else box.current?.querySelector<HTMLInputElement>("input")?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [step, auth]);

  async function requestCode(p = phone) {
    setBusy(true);
    try {
      await sendCode(p);
      setCode(["", "", "", ""]);
      setErr("");
      setLeft(59);
      setStep("code");
    } catch {
      setErr("Не удалось отправить SMS. Попробуйте ещё раз");
    } finally {
      setBusy(false);
    }
  }

  function finish(n = name) {
    setUser({ phone: phone || user?.phone || "", name: n || user?.name || "" });
    const then = auth?.then;
    closeAuth();
    then?.();
  }

  async function submitCode(c: string[]) {
    const joined = c.join("");
    if (joined.length < 4) return;
    const ok = await verifyCode(phone, joined);
    if (!ok) {
      setErr("Неверный код, попробуйте ещё раз");
      setShake(false);
      requestAnimationFrame(() => setShake(true));
      setCode(["", "", "", ""]);
      cells.current[0]?.focus();
      return;
    }
    if (name || user?.name) finish();
    else setStep("name");
  }

  function onCell(i: number, raw: string) {
    setErr("");
    setShake(false);
    const digits = raw.replace(/\D/g, "");
    const next = [...code];
    if (digits.length > 1) {
      // pasted or autofilled the whole code
      digits.slice(0, 4).split("").forEach((d, j) => (next[j] = d));
      setCode(next);
      cells.current[Math.min(3, digits.length - 1)]?.focus();
      return void submitCode(next);
    }
    next[i] = digits;
    setCode(next);
    if (digits && i < 3) cells.current[i + 1]?.focus();
    void submitCode(next);
  }

  if (!auth) return <div className="au-bg" />;

  const close = <button className="au-x" aria-label="Закрыть" onClick={closeAuth}><Icon name="x" /></button>;

  return (
    <div className="au-bg open" onClick={(e) => e.target === e.currentTarget && closeAuth()}>
      <div className="au" ref={box} role="dialog" aria-modal="true" aria-labelledby="auH" tabIndex={-1}>
        {close}
        {step === "phone" && (
          <>
            <h2 id="auH">Вход по номеру</h2>
            <p>Пришлём код в SMS</p>
            <div className="inp-ph">
              <span>+992</span>
              <input
                inputMode="tel" autoComplete="tel-national" placeholder="90 123 45 67" aria-label="Номер телефона"
                value={formatPhone(phone)}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                onKeyDown={(e) => e.key === "Enter" && phone.length === 9 && requestCode()}
              />
            </div>
            <div className="au-err" role="alert">{err}</div>
            <button className="au-go" disabled={phone.length !== 9 || busy} onClick={() => requestCode()}>Получить код</button>
            <button className="au-alt" onClick={() => setStep("name")}><Icon name="tg" />Войти через Telegram</button>
            <div className="au-legal">Продолжая, вы соглашаетесь с условиями сервиса</div>
          </>
        )}
        {step === "code" && (
          <>
            <h2 id="auH">Код из SMS</h2>
            <p>Отправили на +992 {formatPhone(phone)} · <button className="link" onClick={() => setStep("phone")}>Изменить</button></p>
            <div className={"otp" + (shake ? " bad" : "")}>
              {code.map((c, i) => (
                <input
                  key={i}
                  ref={(el) => { cells.current[i] = el; }}
                  inputMode="numeric"
                  maxLength={i === 0 ? 4 : 1}
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Цифра ${i + 1}`}
                  value={c}
                  onChange={(e) => onCell(i, e.target.value)}
                  onKeyDown={(e) => e.key === "Backspace" && !code[i] && i > 0 && cells.current[i - 1]?.focus()}
                />
              ))}
            </div>
            <div className="au-err" role="alert">{err}</div>
            <div className="au-timer">
              {left > 0 ? `Отправить ещё раз через 0:${String(left).padStart(2, "0")}` : <button className="link" onClick={() => requestCode()}>Отправить код ещё раз</button>}
            </div>
            {!process.env.NEXT_PUBLIC_API_URL && <div className="au-demo">Демо: подойдёт любой код, кроме 0000</div>}
          </>
        )}
        {step === "name" && (
          <>
            <h2 id="auH">Как вас зовут?</h2>
            <p>Имя увидят заведение и курьер</p>
            <input className="inp" autoComplete="given-name" aria-label="Имя" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && finish(name.trim())} />
            <button className="au-go" disabled={!name.trim()} onClick={() => finish(name.trim())}>Готово</button>
          </>
        )}
      </div>
    </div>
  );
}
