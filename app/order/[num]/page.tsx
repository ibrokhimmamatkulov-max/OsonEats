import type { Metadata } from "next";
import { OrderTracking } from "@/components/OrderTracking";

export const metadata: Metadata = { title: "Статус заказа | OsonEats" };

export default async function OrderPage({ params }: { params: Promise<{ num: string }> }) {
  return <OrderTracking num={Number((await params).num)} />;
}
