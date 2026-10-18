import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rateLimit"

export function withRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const { allowed, remaining } = checkRateLimit(ip)

    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Intenta de nuevo en un minuto." },
        { status: 429 }
      )
    }

    const response = await handler(req)
    response.headers.set("X-RateLimit-Remaining", remaining.toString())
    return response
  }
}
