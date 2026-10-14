import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VENUES } from "@/lib/data";
import { venueById } from "@/lib/utils";
import { RestaurantView } from "@/components/RestaurantView";

export function generateStaticParams() {
  return VENUES.map((v) => ({ id: v.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const v = venueById((await params).id);
  return v ? { title: `${v.name} — меню и заказ | OsonEats`, description: `${v.name}: ${v.meta}. Заказ без звонка.` } : {};
}

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const v = venueById((await params).id);
  if (!v) notFound();
  return <RestaurantView v={v} />;
}
