import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

function calcScore(p: any, m: any): number {
  if (!m.finished || m.homeScore === null || m.awayScore === null) return 0

  const isKnockout = (m.stage ?? "").toLowerCase() !== "fase de grupos"

  if (!isKnockout) {
    if (p.home === m.homeScore && p.away === m.awayScore) return 3
    if (Math.sign(p.home - p.away) === Math.sign(m.homeScore - m.awayScore)) return 1
    return 0
  }

  let realWinner: "home" | "away"
  if (m.homeScore > m.awayScore) realWinner = "home"
  else if (m.awayScore > m.homeScore) realWinner = "away"
  else if (m.homeET !== null && m.homeET > m.awayET) realWinner = "home"
  else if (m.awayET !== null && m.awayET > m.homeET) realWinner = "away"
  else if (m.homePenalties !== null && m.homePenalties > m.awayPenalties) realWinner = "home"
  else if (m.awayPenalties !== null && m.awayPenalties > m.homePenalties) realWinner = "away"
  else return 0

  let predWinner: "home" | "away"
  const d90 = Math.sign(p.home - p.away)
  if (d90 > 0) predWinner = "home"
  else if (d90 < 0) predWinner = "away"
  else if (p.homeET !== null && p.homeET !== p.awayET) predWinner = p.homeET > p.awayET ? "home" : "away"
  else if (p.homePenalties !== null) predWinner = p.homePenalties > p.awayPenalties ? "home" : "away"
  else return 0

  if (predWinner !== realWinner) return 0

  const drewIn90 = m.homeScore === m.awayScore

  if (!drewIn90) {
    if (p.home === m.homeScore && p.away === m.awayScore) return 12
    return 5
  }

  const exact90 = p.home === m.homeScore && p.away === m.awayScore
  const exactET = p.homeET === m.homeET && p.awayET === m.awayET
  const exactPen = p.homePenalties === m.homePenalties && p.awayPenalties === m.awayPenalties
  const predDrew90 = p.home === p.away
  const predDrewET = p.homeET !== null && p.homeET === p.awayET

  if (exact90 && exactET && exactPen) return 22
  if (exact90 && exactET && !exactPen) return 18
  if (predDrew90 && exactET && exactPen) return 17
  if (predDrew90 && predDrewET && exactPen) return 12
  return 5
}

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getSessionUser(req)
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
  }

  const { userId } = await params

  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_et INT`
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_et INT`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS home_et INT`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS away_et INT`

  const [userRows, predRows, matchRows] = await Promise.all([
    sql`SELECT id, name, email, avatar FROM users WHERE id = ${userId} LIMIT 1`,
    sql`
      SELECT
        match_id        AS "matchId",
        home, away,
        home_et         AS "homeET",
        away_et         AS "awayET",
        home_penalties  AS "homePenalties",
        away_penalties  AS "awayPenalties"
      FROM predictions
      WHERE user_id = ${userId}
    `,
    sql`
      SELECT
        id, group_name AS "group", stage,
        home_id AS "homeId", away_id AS "awayId",
        kickoff,
        home_score AS "homeScore", away_score AS "awayScore",
        finished,
        home_et AS "homeET", away_et AS "awayET",
        home_penalties AS "homePenalties", away_penalties AS "awayPenalties"
      FROM matches
      ORDER BY kickoff ASC
    `,
  ])

  if (userRows.length === 0) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })
  }

  const predMap = new Map(predRows.map((p: any) => [p.matchId, p]))

  const items = matchRows.map((m: any) => {
    const p = predMap.get(m.id)
    const points = p ? calcScore(p, m) : null
    return {
      match: m,
      prediction: p ?? null,
      points,
    }
  })

  return NextResponse.json({ user: userRows[0], items })
}
