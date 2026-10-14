import type { Metadata } from "next";
import { CheckoutView } from "@/components/CheckoutView";

export const metadata: Metadata = { title: "Оформление заказа | OsonEats" };

export default function CheckoutPage() {
  return <CheckoutView />;
}
