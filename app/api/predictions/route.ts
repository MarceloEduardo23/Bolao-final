import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

// GET /api/predictions — returns all predictions for current user
export async function GET(req: Request) {
  const session = await getSessionUser(req)
  if (!session) return NextResponse.json({ predictions: [] })

  // Garante colunas de pênaltis existem
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS home_penalties INT`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS away_penalties INT`

  const rows = await sql`
    SELECT
      match_id          AS "matchId",
      user_id           AS "userId",
      home,
      away,
      home_penalties    AS "homePenalties",
      away_penalties    AS "awayPenalties",
      created_at        AS "createdAt"
    FROM predictions
    WHERE user_id = ${session.sub}
    ORDER BY created_at DESC
  `
  return NextResponse.json({ predictions: rows })
}

// POST /api/predictions — submit a prediction
export async function POST(req: Request) {
  const session = await getSessionUser(req)
  if (!session) {
    return NextResponse.json({ error: "Você precisa estar logado." }, { status: 401 })
  }

  const { matchId, home, away, homePenalties, awayPenalties } = await req.json()

  if (!matchId || home === undefined || away === undefined) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }

  // Garante colunas de pênaltis existem
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS home_penalties INT`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS away_penalties INT`

  const matches = await sql`
    SELECT id, kickoff, finished, stage FROM matches WHERE id = ${matchId} LIMIT 1
  `
  if (matches.length === 0) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 })
  }

  const match = matches[0]
  if (match.finished) {
    return NextResponse.json({ error: "O jogo já foi encerrado. Palpites encerrados." }, { status: 409 })
  }

  await sql`
    INSERT INTO predictions (match_id, user_id, home, away, home_penalties, away_penalties)
    VALUES (${matchId}, ${session.sub}, ${home}, ${away}, ${homePenalties ?? null}, ${awayPenalties ?? null})
    ON CONFLICT (match_id, user_id)
    DO UPDATE SET
      home = EXCLUDED.home,
      away = EXCLUDED.away,
      home_penalties = EXCLUDED.home_penalties,
      away_penalties = EXCLUDED.away_penalties,
      created_at = NOW()
  `

  return NextResponse.json({ ok: true })
}
