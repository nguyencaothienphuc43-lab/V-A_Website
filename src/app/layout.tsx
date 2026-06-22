import type { Metadata } from "next";
import { Inter, Syne, JetBrains_Mono, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

// Vietnamese-capable family used site-wide when locale === "vi".
// Syne (display) has no Vietnamese glyphs, so accents break in vi mode —
// Be Vietnam Pro covers the full Vietnamese diacritic set with no tofu.
const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { template: "%s | V&A Express", default: "V&A Express — Global Logistics" },
  description: "International logistics solutions — air freight, sea freight, road freight from Vietnam to the world.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} ${jetbrains.variable} ${beVietnam.variable}`}>
      <body className="font-body bg-white text-navy-800 antialiased">
        {children}
      </body>
    </html>
  );
}
