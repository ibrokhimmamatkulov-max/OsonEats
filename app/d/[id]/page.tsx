import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_DISHES } from "@/lib/data";
import { findDish, venueById } from "@/lib/utils";
import { DishPage } from "@/components/DishSheet";

export function generateStaticParams() {
  return ALL_DISHES.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const d = findDish((await params).id);
  if (!d) return {};
  return { title: `${d.name} — ${venueById(d.venueId)?.name} | OsonEats`, description: d.desc, openGraph: { images: [d.img] } };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!findDish(id)) notFound();
  return <DishPage id={id} />;
}
