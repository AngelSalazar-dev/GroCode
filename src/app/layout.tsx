import type { Metadata } from "next";
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

// Required for absolute URLs in Open Graph / Twitter cards.
const siteUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GroCode - Plataforma de Mentoría para Desarrolladores",
    template: "%s | GroCode",
  },
  description: "La plataforma social definitiva para desarrolladores que buscan mentoría de expertos, recursos de alta calidad y un crecimiento profesional acelerado.",
  keywords: ["mentoría", "desarrollo", "programación", "senior", "junior", "tech community"],
  authors: [{ name: "GroCode Team" }],
  creator: "GroCode",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    siteName: "GroCode",
    title: "GroCode - Escala tu carrera con mentoría técnica",
    description:
      "Conecta con desarrolladores Senior verificados, comparte recursos y crece con la comunidad.",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "GroCode",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GroCode - Escala tu carrera con mentoría técnica",
    description:
      "Conecta con desarrolladores Senior verificados y crece con la comunidad.",
    images: ["/og.jpg"],
  },
  // NOTE: deliberately no global `robots` here.
  // Pinning `index, follow` on every page emitted a conflicting
  // `<meta name="robots" content="index, follow">` alongside the `noindex`
  // that Next injects for notFound() responses, leaving crawlers to guess.
  // Routes that must stay out of the index declare their own `robots`.
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
  // The browser chrome has to match the page it is painted behind, so these are
  // the `--background` tokens from `globals.css` (`#ffffff` / `#020202`), not
  // the card colours. `#0a0a0a` is `--card` in dark mode and left a visible
  // seam between the address bar and the page.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020202" },
  ],
};

import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col`}>
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-full focus:bg-accent-gro focus:text-background focus:text-sm focus:font-bold"
          >
            Saltar al contenido
          </a>
          <Navbar />
          <main id="main" className="flex-1 flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}