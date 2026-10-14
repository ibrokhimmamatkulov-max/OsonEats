import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PLACES } from "@/lib/data";
import { PlaceView } from "@/components/PlaceView";

export function generateStaticParams() {
  return PLACES.map((p) => ({ id: p.id }));
}

const place = (id: string) => PLACES.find((p) => p.id === id);
// mock phone numbers until venues provide real ones
const phoneOf = (id: string) => "+992 92 700 00 0" + (PLACES.findIndex((p) => p.id === id) + 1);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = place((await params).id);
  return p ? { title: `${p.name} — куда сходить | OsonEats`, description: p.desc } : {};
}

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = place(id);
  if (!p) notFound();
  return <PlaceView p={p} phone={phoneOf(id)} />;
}
