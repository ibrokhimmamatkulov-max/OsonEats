"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const TABS: [href: string, label: string, icon: IconName][] = [
  ["/", "Главная", "home"],
  ["/search", "Поиск", "search"],
  ["/orders", "Заказы", "receipt"],
  ["/profile", "Профиль", "user"],
];

/** Bottom navigation, visible on phones only (see .tabbar in globals.css) */
export function TabBar() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Навигация">
      {TABS.map(([href, label, icon]) => (
        <Link key={href} href={href} aria-current={path === href ? "page" : undefined}>
          <Icon name={icon} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
