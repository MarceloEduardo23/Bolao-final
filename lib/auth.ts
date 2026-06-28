import { SignJWT, jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "bolao-copa-2026-dev-secret-change-in-production"
)

export interface JWTPayload {
  sub: string   // user id
  role: string
  name: string
  email: string
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("Authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7)
  const cookie = request.headers.get("Cookie")
  if (cookie) {
    const match = cookie.match(/bolao_token=([^;]+)/)
    if (match) return match[1]
  }
  return null
}

export async function getSessionUser(request: Request): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}
