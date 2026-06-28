import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getSessionUser(req)
  if (!session) {
    return NextResponse.json({ user: null })
  }

  const rows = await sql`
    SELECT id, name, email, role, avatar, provider
    FROM users WHERE id = ${session.sub} LIMIT 1
  `
  if (rows.length === 0) return NextResponse.json({ user: null })

  return NextResponse.json({ user: rows[0] })
}
