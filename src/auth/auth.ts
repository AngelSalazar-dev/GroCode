import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { headers } from "next/headers"
import { z } from "zod"
import { getClientIp, limit } from "@/lib/rate-limit"

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido").max(254),
  password: z.string().min(1, "Contraseña requerida").max(128),
})

const MAX_ATTEMPTS = 10
const WINDOW_MS = 15 * 60 * 1000

/**
 * NextAuth v5 reads AUTH_SECRET, not the v4 NEXTAUTH_SECRET. With a mismatched
 * env every `auth()` call throws MissingSecret, so the whole signed-in surface
 * breaks while the app still returns 200. Fail on the first render instead of
 * three days later.
 */
function assertAuthSecretConfigured() {
  if (process.env.AUTH_SECRET) return

  const legacy = process.env.NEXTAUTH_SECRET
  if (legacy) {
    console.warn(
      "[auth] NEXTAUTH_SECRET is set but NextAuth v5 ignores it. " +
        "Rename it to AUTH_SECRET (generate with: npx auth secret)."
    )
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is not configured. Generate one with `npx auth secret`."
    )
  }
}

assertAuthSecretConfigured()

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Rate limit per IP + per account so neither credential stuffing nor
        // a targeted brute force on one user gets a free pass.
        const ip = getClientIp(await headers())
        const parsed = LoginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        })

        if (!parsed.success) return null

        const { email, password } = parsed.data

        for (const bucket of [`login:ip:${ip}`, `login:user:${email}`]) {
          const gate = limit(bucket, MAX_ATTEMPTS, WINDOW_MS)
          if (!gate.ok) return null
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, role: true, password: true },
        })

        if (!user?.password) return null

        const isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (!isPasswordCorrect) return null

        // Never let the hash or the full row reach the session.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
})
