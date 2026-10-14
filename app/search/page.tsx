import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/SearchView";

export const metadata: Metadata = { title: "Поиск | OsonEats" };

export default function SearchPage() {
  // useSearchParams needs a Suspense boundary for static rendering
  return (
    <Suspense>
      <SearchView />
    </Suspense>
  );
}
