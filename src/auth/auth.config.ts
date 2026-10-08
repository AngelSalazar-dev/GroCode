import type { NextAuthConfig } from "next-auth"
import { Role } from "@/generated-v2/client"
import { prisma } from "@/lib/prisma"

/**
 * Accepts every member of the Role enum.
 *
 * Written as a list of comparisons this was missing ADMIN, so `token.role` was
 * never written for staff and the session silently fell back to JUNIOR — which
 * made /admin unreachable for real admins. Deriving it from `Object.values`
 * means a future enum member cannot be forgotten.
 */
const isRole = (value: unknown): value is Role =>
  Object.values(Role).includes(value as Role)

/**
 * How long a token's role is trusted before being re-read from the database.
 *
 * With `strategy: "jwt"` the role is copied at sign-in, so demoting an admin
 * left them privileged until the token expired, and approving a Senior had no
 * effect until their next sign-in. Five minutes bounds that window.
 */
const ROLE_REFRESH_MS = 5 * 60 * 1000

export default {
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        if (isRole(user.role)) token.role = user.role
        token.roleCheckedAt = Date.now()
        return token
      }

      // Existing token: refresh the role once it is older than the TTL.
      const checkedAt = typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : 0
      if (typeof token.id !== "string" || Date.now() - checkedAt < ROLE_REFRESH_MS) {
        return token
      }

      try {
        const current = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        })

        token.roleCheckedAt = Date.now()

        // A deleted account must not keep the role it had.
        if (!current) {
          delete token.role
          token.role = Role.JUNIOR
          return token
        }

        if (isRole(current.role)) token.role = current.role
      } catch (error) {
        // Fail closed on the refresh path: keep whatever the token already had
        // rather than silently demoting a legitimate admin during a DB blip.
        console.error("No se pudo refrescar el rol desde la base de datos:", error)
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        // A JWT is signed but its contents can predate a schema change, so the
        // value is validated rather than cast.
        session.user.role = isRole(token.role) ? token.role : Role.JUNIOR
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
} satisfies NextAuthConfig