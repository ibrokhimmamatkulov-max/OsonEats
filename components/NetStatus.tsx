"use client";

import { useEffect, useState } from "react";

/** Top banner when the device goes offline; turns green for a moment when the connection is back. */
export function NetStatus() {
  const [state, setState] = useState<"ok" | "off" | "back">("ok");
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const off = () => { clearTimeout(t); setState("off"); };
    const on = () => { setState("back"); t = setTimeout(() => setState("ok"), 2500); };
    if (!navigator.onLine) off();
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      clearTimeout(t);
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
    };
  }, []);
  // measure the header so the banner sits just below it
  useEffect(() => {
    const h = document.querySelector(".hdr") as HTMLElement | null;
    if (h) document.documentElement.style.setProperty("--hh", h.offsetHeight + "px");
  }, [state]);

  return (
    <div className={"net" + (state === "back" ? " ok" : "")} role="status" hidden={state === "ok"}>
      <span className="dot" />
      <span>{state === "back" ? "Связь восстановлена" : "Нет интернета. Показываем то, что уже загружено"}</span>
    </div>
  );
}
