import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

/**
 * Sistema de pontos Mario Kart:
 * - Calcula automaticamente pontos bônus para balancear quem está atrás
 * - NUNCA altera bonus_points diretamente (esses são admin-controlados)
 * - Retorna apenas dados para exibição — o sistema não altera o banco
 *
 * Mecânicas:
 * 1. "Turbo do fim de fila" — quem está abaixo de 50% da média recebe badge
 * 2. "Super estrela" — quem tiver acertado pênaltis recebe destaque
 * 3. Pontos multiplicadores por fase (fase de grupos = 1x, oitavas = 1.5x) — visual only
 */
export async function GET(req: Request) {
  const session = await getSessionUser(req)

  const leaderboard = await sql`
    SELECT
      u.id,
      u.name,
      COALESCE(u.bonus_points, 0) + COALESCE(SUM(
        CASE
          WHEN m.finished AND m.stage = 'Fase de Grupos' THEN
            CASE
              WHEN p.home = m.home_score AND p.away = m.away_score THEN 3
              WHEN SIGN(p.home - p.away) = SIGN(m.home_score - m.away_score) THEN 1
              ELSE 0
            END
          WHEN m.finished AND m.stage != 'Fase de Grupos' AND m.home_score = m.away_score AND m.home_penalties IS NOT NULL THEN
            CASE
              WHEN p.home = m.home_score AND p.away = m.away_score
                AND p.home_penalties IS NOT NULL AND p.away_penalties IS NOT NULL
                AND (p.home_penalties > p.away_penalties) = (m.home_penalties > m.away_penalties)
              THEN 4
              WHEN p.home = m.home_score AND p.away = m.away_score THEN 3
              WHEN p.home = p.away
                AND p.home_penalties IS NOT NULL AND p.away_penalties IS NOT NULL
                AND (p.home_penalties > p.away_penalties) = (m.home_penalties > m.away_penalties)
              THEN 2
              ELSE 0
            END
          WHEN m.finished AND m.stage != 'Fase de Grupos' THEN
            CASE
              WHEN p.home = m.home_score AND p.away = m.away_score THEN 3
              WHEN SIGN(p.home - p.away) = SIGN(m.home_score - m.away_score) THEN 1
              ELSE 0
            END
          ELSE 0
        END
      ), 0) AS points,
      COALESCE(SUM(
        CASE
          WHEN m.finished AND p.home = m.home_score AND p.away = m.away_score
            AND m.stage != 'Fase de Grupos' AND m.home_score = m.away_score AND m.home_penalties IS NOT NULL
            AND p.home_penalties IS NOT NULL
            AND (p.home_penalties > p.away_penalties) = (m.home_penalties > m.away_penalties)
          THEN 1
          ELSE 0
        END
      ), 0) AS "penaltyHits",
      COUNT(p.id) FILTER (WHERE m.finished) AS "gamesPlayed"
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id
    LEFT JOIN matches m ON m.id = p.match_id
    WHERE u.role != 'admin'
    GROUP BY u.id, u.name
    ORDER BY points DESC
  `

  const total = leaderboard.length
  if (total === 0) return NextResponse.json({ bonusInfo: [] })

  const maxPts = Number(leaderboard[0]?.points ?? 0)
  const avgPts = leaderboard.reduce((s, r) => s + Number(r.points), 0) / total

  const bonusInfo = leaderboard.map((row, idx) => {
    const pts = Number(row.points)
    const rank = idx + 1
    const percentRank = rank / total // 0 = 1st, 1 = last

    // Boost visual (Mario Kart style):
    // - último lugar recebe "troféu de consolação"
    // - 80-100% do ranking: "turbo rocket"
    // - 50-80%: "boost leve"
    // - top 3: "estrela (sem boost)"
    let boostLabel: string | null = null
    let boostIcon = ""

    if (rank === total && total > 2) {
      boostLabel = "Turbo Foguete 🚀"
      boostIcon = "🚀"
    } else if (percentRank >= 0.8 && total > 3) {
      boostLabel = "Red Shell ⬆️"
      boostIcon = "🔴"
    } else if (percentRank >= 0.5) {
      boostLabel = "Boost Leve 💨"
      boostIcon = "💨"
    } else if (rank <= 3) {
      boostLabel = "Líder ⭐"
      boostIcon = "⭐"
    }

    return {
      id: row.id,
      name: row.name,
      rank,
      points: pts,
      penaltyHits: Number(row.penaltyHits ?? 0),
      isCurrentUser: session?.sub === row.id,
      boostLabel,
      boostIcon,
      // Quanto eles estão atrás do líder
      gapToLeader: maxPts - pts,
    }
  })

  return NextResponse.json({ bonusInfo, avgPoints: avgPts, maxPoints: maxPts })
}
