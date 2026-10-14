"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";

/** Floating cart button: only where people shop (home in delivery mode, restaurant, search). */
export function CartPill() {
  const { cartCount, cartSum, mode } = useApp();
  const path = usePathname();
  const shopping = (path === "/" && mode === "order") || path.startsWith("/r/") || path === "/search";
  const show = cartCount > 0 && shopping;
  return (
    <Link href="/checkout" className={"cart" + (show ? " show" : "")} aria-hidden={!show} tabIndex={show ? 0 : -1}>
      <Icon name="bag" />
      <span>Корзина · {cartCount}</span>
      <span className="sum">{cartSum} с.</span>
    </Link>
  );
}
