import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser(req)
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const { id } = await params

  const rows = await sql`SELECT role FROM users WHERE id = ${id} LIMIT 1`
  if (rows.length === 0) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })
  if (rows[0].role === "admin") return NextResponse.json({ error: "Não é possível deletar um admin." }, { status: 403 })

  await sql`DELETE FROM users WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
