import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { signToken } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Preencha e-mail e senha." }, { status: 400 })
    }

    const rows = await sql`
      SELECT id, name, email, password, role, avatar, provider
      FROM users
      WHERE lower(email) = lower(${email})
      LIMIT 1
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "E-mail não encontrado." }, { status: 401 })
    }

    const user = rows[0]

    if (!user.password) {
      return NextResponse.json({ error: "Esta conta usa outro método de login." }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Senha incorreta." }, { status: 401 })
    }

    const token = await signToken({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    })

    const res = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      provider: user.provider,
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
