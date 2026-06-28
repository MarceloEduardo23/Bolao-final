import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

// Garante que a coluna bonus_points existe (migração automática)
async function ensureBonusColumn() {
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_points INTEGER NOT NULL DEFAULT 0
  `
}

// PATCH /api/users/[id]/bonus — admin ajusta pontos bônus de um usuário
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser(req)
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const { id } = await params
  const { delta } = await req.json() // delta = +1 / -1 / qualquer inteiro

  if (typeof delta !== "number" || !Number.isInteger(delta)) {
    return NextResponse.json({ error: "Delta inválido." }, { status: 400 })
  }

  await ensureBonusColumn()

  const rows = await sql`
    UPDATE users
    SET bonus_points = GREATEST(bonus_points + ${delta}, 0)
    WHERE id = ${id} AND role != 'admin'
    RETURNING id, bonus_points AS "bonusPoints"
  `

  if (rows.length === 0) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })
  }

  return NextResponse.json({ ok: true, bonusPoints: rows[0].bonusPoints })
}
