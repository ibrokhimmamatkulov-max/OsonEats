"use client";

import { useEffect, useRef } from "react";
import type { Question } from "./AppProvider";

/** Small yes/no dialog (bottom sheet on phones). Used for "start a new order?", cancel order, log out. */
export function ConfirmDialog({ q, onClose }: { q: Question | null; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!q) return;
    box.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, onClose]);

  return (
    <div className={"cfm-bg" + (q ? " open" : "")} role="dialog" aria-modal="true" aria-labelledby="cfmH" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {q && (
        <div className="cfm" tabIndex={-1} ref={box}>
          <h3 id="cfmH">{q.title}</h3>
          <p>{q.text}</p>
          <div className="cfm-b">
            <button className="no" onClick={onClose}>Отмена</button>
            <button className="yes" onClick={() => { onClose(); q.onYes(); }}>{q.yes}</button>
          </div>
        </div>
      )}
    </div>
  );
}
