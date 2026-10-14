import Link from "next/link";
import { VENUES } from "@/lib/data";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <main className="wrap">
      <div className="nf">
        <div className="code">404</div>
        <h1>Такой страницы нет</h1>
        <p>Возможно, ссылка устарела или заведение больше не работает с нами</p>
        <Link className="btn btn-primary" href="/">На главную</Link>
        <div className="s-ven">
          {VENUES.map((v) => (
            <Link key={v.id} className="sv" href={`/r/${v.id}`}>
              <img src={v.cover} alt="" />
              <span className="t"><b>{v.name}</b><small>{v.meta}</small></span>
              <Icon name="right" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
