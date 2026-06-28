import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { signToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 })
    }

    const existing = await sql`SELECT id FROM users WHERE lower(email) = lower(${email}) LIMIT 1`
    if (existing.length > 0) {
      return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const id = "u-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

    await sql`
      INSERT INTO users (id, name, email, password, role, provider)
      VALUES (${id}, ${name.trim()}, ${email.toLowerCase().trim()}, ${hashed}, 'user', 'email')
    `

    const token = await signToken({ sub: id, role: "user", name: name.trim(), email: email.toLowerCase().trim() })

    const res = NextResponse.json({
      id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: "user",
      avatar: null,
      provider: "email",
      token,
    })
    res.cookies.set("bolao_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}
