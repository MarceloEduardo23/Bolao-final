import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_penalties INT`
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_penalties INT`
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_et INT`
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_et INT`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS home_penalties INT`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS away_penalties INT`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS home_et INT`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS away_et INT`

  // Busca todos os dados e calcula no JS (mesma lógica do scoring.ts)
  const [usersRes, predsRes, matchesRes] = await Promise.all([
    sql`SELECT id, name, email, avatar, role, provider, COALESCE(bonus_points, 0) AS "bonusPoints" FROM users WHERE role != 'admin'`,
    sql`SELECT match_id AS "matchId", user_id AS "userId", home, away, home_et AS "homeET", away_et AS "awayET", home_penalties AS "homePenalties", away_penalties AS "awayPenalties" FROM predictions`,
    sql`SELECT id, stage, home_score AS "homeScore", away_score AS "awayScore", home_et AS "homeET", away_et AS "awayET", home_penalties AS "homePenalties", away_penalties AS "awayPenalties", finished FROM matches WHERE finished = true`,
  ])

  const matchMap = new Map(matchesRes.map((m: any) => [m.id, m]))

  function calcScore(p: any, m: any): number {
    if (!m.finished || m.homeScore === null || m.awayScore === null) return 0

    const isKnockout = (m.stage ?? "").toLowerCase() !== "fase de grupos"

    if (!isKnockout) {
      if (p.home === m.homeScore && p.away === m.awayScore) return 3
      if (Math.sign(p.home - p.away) === Math.sign(m.homeScore - m.awayScore)) return 1
      return 0
    }

    // Quem passou de verdade
    let realWinner: "home" | "away"
    if (m.homeScore > m.awayScore) realWinner = "home"
    else if (m.awayScore > m.homeScore) realWinner = "away"
    else if (m.homeET !== null && m.homeET > m.awayET) realWinner = "home"
    else if (m.awayET !== null && m.awayET > m.homeET) realWinner = "away"
    else if (m.homePenalties !== null && m.homePenalties > m.awayPenalties) realWinner = "home"
    else if (m.awayPenalties !== null && m.awayPenalties > m.homePenalties) realWinner = "away"
    else return 0

    // Quem o usuário apostou
    let predWinner: "home" | "away"
    const d90 = Math.sign(p.home - p.away)
    if (d90 > 0) predWinner = "home"
    else if (d90 < 0) predWinner = "away"
    else if (p.homeET !== null && p.homeET !== p.awayET) predWinner = p.homeET > p.awayET ? "home" : "away"
    else if (p.homePenalties !== null) predWinner = p.homePenalties > p.awayPenalties ? "home" : "away"
    else return 0

    if (predWinner !== realWinner) return 0

    const drewIn90 = m.homeScore === m.awayScore

    // Jogo decidido nos 90'
    if (!drewIn90) {
      if (p.home === m.homeScore && p.away === m.awayScore) return 12
      return 5
    }

    // Jogo foi para ET/Pênaltis
    const exact90 = p.home === m.homeScore && p.away === m.awayScore
    const exactET = p.homeET === m.homeET && p.awayET === m.awayET
    const exactPen = p.homePenalties === m.homePenalties && p.awayPenalties === m.awayPenalties
    const predDrew90 = p.home === p.away
    const predDrewET = p.homeET !== null && p.homeET === p.awayET

    if (exact90 && exactET && exactPen) return 22
    if (predDrew90 && exactET && exactPen) return 17
    if (predDrew90 && predDrewET && exactPen) return 12
    return 5
  }

  const leaderboard = usersRes.map((u: any) => {
    const preds = predsRes.filter((p: any) => p.userId === u.id)
    let points = Number(u.bonusPoints)
    let exact = 0, correct = 0, total = 0

    for (const p of preds) {
      const m = matchMap.get(p.matchId)
      if (!m) continue
      const s = calcScore(p, m)
      points += s
      if (s > 0 && p.home === m.homeScore && p.away === m.awayScore) exact++
      else if (s > 0) correct++
      total++
    }

    return { ...u, points, exact, correct, total }
  })

  leaderboard.sort((a: any, b: any) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.exact !== a.exact) return b.exact - a.exact
    return a.name.localeCompare(b.name)
  })

  return NextResponse.json({ leaderboard })
}
