import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GroCode — Mentoría Técnica para Desarrolladores",
    template: "%s | GroCode",
  },
  description:
    "La plataforma social para desarrolladores que buscan mentoría de expertos, recursos curados y crecimiento profesional acelerado.",
  keywords: [
    "mentoría",
    "desarrolladores",
    "programación",
    "roadmap",
    "comunidad",
    "GroCode",
  ],
  openGraph: {
    title: "GroCode — Escala tu carrera con mentoría técnica",
    description:
      "Conecta con mentores Senior, accede a recursos curados y acelera tu crecimiento profesional.",
    siteName: "GroCode",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "GroCode — Mentoría Técnica para Desarrolladores",
    description:
      "La plataforma social para developers que buscan crecer con mentoría real.",
  },
};

import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`} suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
