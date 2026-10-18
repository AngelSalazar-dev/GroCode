"use server"

import { signOut } from "@/auth/auth"

export async function logoutAction() {
  await signOut({ redirectTo: "/" })
}
