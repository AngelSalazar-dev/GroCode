import type { DefaultSession } from "next-auth"
import type { Role } from "@/generated-v2/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      /** Enum, not string: role comparisons should be checked by the compiler. */
      role: Role
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: Role
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    /** Timestamp of the last database role check. */
    roleCheckedAt?: number
  }
}