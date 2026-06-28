import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

export async function GET() {
  // Garante que as colunas de pênaltis existem
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_penalties INT`
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_penalties INT`

  const rows = await sql`
    SELECT
      id,
      group_name        AS "group",
      stage,
      home_id           AS "homeId",
      away_id           AS "awayId",
      kickoff,
      home_score        AS "homeScore",
      away_score        AS "awayScore",
      finished,
      home_penalties    AS "homePenalties",
      away_penalties    AS "awayPenalties"
    FROM matches
    ORDER BY kickoff ASC
  `
  return NextResponse.json({ matches: rows })
}

// PATCH /api/matches — admin only
export async function PATCH(req: Request) {
  const session = await getSessionUser(req)
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const body = await req.json()
  const { id, homeScore, awayScore, finished, kickoff, homePenalties, awayPenalties } = body

  if (!id) return NextResponse.json({ error: "id obrigatório." }, { status: 400 })

  await sql`
    UPDATE matches SET
      home_score      = ${homeScore ?? null},
      away_score      = ${awayScore ?? null},
      finished        = ${!!finished},
      kickoff         = ${kickoff},
      home_penalties  = ${homePenalties ?? null},
      away_penalties  = ${awayPenalties ?? null}
    WHERE id = ${id}
  `

  return NextResponse.json({ ok: true })
}
