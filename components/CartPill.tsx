"use client";

import Link from "next/link";
import { Icon } from "./Icon";
import { useApp } from "./AppProvider";

export function CartPill() {
  const { cartCount, cartSum } = useApp();
  return (
    <Link href="/checkout" className={"cart" + (cartCount ? " show" : "")} aria-hidden={!cartCount}>
      <Icon name="bag" />
      <span>Корзина · {cartCount}</span>
      <span className="sum">{cartSum} с.</span>
    </Link>
  );
}
