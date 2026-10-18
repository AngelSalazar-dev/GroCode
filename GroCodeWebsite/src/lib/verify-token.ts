import jwt from "jsonwebtoken"

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.MOBILE_JWT_SECRET!) as {
      id: string
      email: string
      name: string
      role: string
    }
  } catch {
    return null
  }
}
