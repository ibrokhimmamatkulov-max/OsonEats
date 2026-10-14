import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { CartPill } from "@/components/CartPill";

const rubik = Rubik({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--font-rubik", display: "swap" });

export const metadata: Metadata = {
  title: "OsonEats Худжанд — доставка еды и куда сходить",
  description: "Закажите еду из заведений Худжанда: без звонка, оплата при получении.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// apply the saved theme before first paint to avoid a light flash in dark mode
const themeScript = `try{var t=JSON.parse(localStorage.getItem('oe-theme'));if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={rubik.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AppProvider>
          <Header />
          {children}
          <CartPill />
          <TabBar />
        </AppProvider>
      </body>
    </html>
  );
}
