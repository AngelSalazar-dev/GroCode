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

export const metadata: Metadata = {
  title: "GroCode - Plataforma de Mentoría para Desarrolladores",
  description: "La plataforma social definitiva para desarrolladores que buscan mentoría de expertos, recursos de alta calidad y un crecimiento profesional acelerado.",
  keywords: ["mentoría", "desarrollo", "programación", "senior", "junior", "tech community"],
  authors: [{ name: "GroCode Team" }],
}

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
}

import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
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
