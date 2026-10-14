"use client";

import { useEffect } from "react";

/** Adds a class to <body> while the page is mounted (screen-specific header/tab bar tweaks in globals.css). */
export function useBodyClass(cls: string) {
  useEffect(() => {
    document.body.classList.add(cls);
    return () => document.body.classList.remove(cls);
  }, [cls]);
}
