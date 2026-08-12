import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://du-adega-production.up.railway.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Du Bebidas | Alfenas-MG — Aberto 24h",
    template: "%s | Du Bebidas",
  },
  description:
    "Destilados, vinhos e cerveja gelada, gelo, carvão e refrigerante com entrega em Alfenas-MG. Aberto 24 horas. Faça seu pedido online.",
  keywords: [
    "adega Alfenas",
    "bebidas Alfenas MG",
    "cerveja delivery Alfenas",
    "destilados Alfenas",
    "vinhos Alfenas",
    "gelo e carvão Alfenas",
    "entrega de bebidas 24 horas",
    "Du Bebidas",
  ],
  authors: [{ name: "Du Bebidas" }],
  openGraph: {
    title: "Du Bebidas | Alfenas-MG — Aberto 24h",
    description:
      "Destilados, vinhos e cerveja gelada, com entrega em Alfenas-MG. Aberto 24 horas.",
    url: siteUrl,
    siteName: "Du Bebidas",
    locale: "pt_BR",
    type: "website",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Du Bebidas",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0d0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
