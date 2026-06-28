import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import bcrypt from "bcryptjs"

// GET /api/users — admin only
export async function GET(req: Request) {
  const session = await getSessionUser(req)
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const rows = await sql`
    SELECT id, name, email, role, avatar, provider, created_at AS "createdAt"
    FROM users
    ORDER BY created_at ASC
  `
  return NextResponse.json({ users: rows })
}

// PATCH /api/users — update own profile
export async function PATCH(req: Request) {
  const session = await getSessionUser(req)
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const { name, password, avatar } = await req.json()

  if (name !== undefined) {
    if (!name.trim()) return NextResponse.json({ error: "Nome inválido." }, { status: 400 })
    await sql`UPDATE users SET name = ${name.trim()} WHERE id = ${session.sub}`
  }

  if (password) {
    const hashed = await bcrypt.hash(password, 10)
    await sql`UPDATE users SET password = ${hashed} WHERE id = ${session.sub}`
  }

  if (avatar !== undefined) {
    await sql`UPDATE users SET avatar = ${avatar} WHERE id = ${session.sub}`
  }

  const rows = await sql`
    SELECT id, name, email, role, avatar, provider FROM users WHERE id = ${session.sub} LIMIT 1
  `
  return NextResponse.json({ user: rows[0] })
}
