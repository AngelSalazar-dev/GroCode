import type { NextConfig } from "next";

/**
 * Content Security Policy.
 *
 * Kept deliberately explicit rather than maximally strict: this app needs
 * inline styles (Tailwind v4 + next-themes write a style tag at runtime),
 * inline scripts (Next hydration payloads), blob/data images (DiceBear SVG
 * avatars and next/image optimizations) and one third-party frame for the
 * YouTube embeds.
 *
 * `frame-ancestors 'none'` is the important one: without it /admin can be
 * iframed and its "Aprobar insignia" button clickjacked.
 */
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is required by Tailwind v4 and the Next.js runtime. A nonce
  // strategy would be stricter but needs a per-request middleware rewrite.
  "script-src 'self' 'unsafe-inline'" + (isDev ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https:",
  "font-src 'self' data:",
  // DiceBear is fetched as SVG data by the browser, api.dicebear.com is only
  // needed if an avatar were proxied server-side.
  "connect-src 'self'" + (isDev ? " ws: wss:" : ""),
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
  "media-src 'self' https: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // Sin `remotePatterns`. Todo lo que puede venir de fuera (`User.image`: GitHub
  // OAuth, DiceBear, lo que escriba el usuario) se renderiza con `unoptimized`,
  // y lo unico que si se optimiza son ficheros de `public/` escritos como
  // rutas literales. Enumerar hosts aqui solo serviria para volver a permitir
  // el optimizador sobre URLs arbitrarias.
  //
  // `src/tests/next-image-remote.test.ts` falla si alguien reintroduce un
  // `<Image>` con `src` dinamico y sin `unoptimized`.

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // The app needs no camera, mic, geolocation or payment.
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;