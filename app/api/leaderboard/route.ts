import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  // Garante colunas novas existem
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_penalties INT`
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_penalties INT`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS home_penalties INT`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS away_penalties INT`

  // Pontuação:
  // Fase de grupos: exato=3, vencedor=1
  // Eliminatórias (sem pênaltis): exato=3, vencedor=1
  // Eliminatórias (com pênaltis): exato+pênaltis=4, exato=3, vencedor via pênaltis=2
  const rows = await sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.avatar,
      u.role,
      u.provider,
      COALESCE(u.bonus_points, 0) AS "bonusPoints",
      COALESCE(SUM(
        CASE
          -- Fase de grupos
          WHEN m.finished AND m.stage = 'Fase de Grupos' THEN
            CASE
              WHEN p.home = m.home_score AND p.away = m.away_score THEN 3
              WHEN SIGN(p.home - p.away) = SIGN(m.home_score - m.away_score) THEN 1
              ELSE 0
            END
          -- Eliminatórias com pênaltis (empate no tempo normal)
          WHEN m.finished AND m.stage != 'Fase de Grupos' AND m.home_score = m.away_score AND m.home_penalties IS NOT NULL THEN
            CASE
              -- Placar exato + pênaltis certos = 4
              WHEN p.home = m.home_score AND p.away = m.away_score
                AND p.home_penalties IS NOT NULL AND p.away_penalties IS NOT NULL
                AND (p.home_penalties > p.away_penalties) = (m.home_penalties > m.away_penalties)
              THEN 4
              -- Placar exato, pênaltis errado = 3
              WHEN p.home = m.home_score AND p.away = m.away_score THEN 3
              -- Apostou empate e acertou vencedor nos pênaltis = 2
              WHEN p.home = p.away
                AND p.home_penalties IS NOT NULL AND p.away_penalties IS NOT NULL
                AND (p.home_penalties > p.away_penalties) = (m.home_penalties > m.away_penalties)
              THEN 2
              ELSE 0
            END
          -- Eliminatórias sem pênaltis
          WHEN m.finished AND m.stage != 'Fase de Grupos' THEN
            CASE
              WHEN p.home = m.home_score AND p.away = m.away_score THEN 3
              WHEN SIGN(p.home - p.away) = SIGN(m.home_score - m.away_score) THEN 1
              ELSE 0
            END
          ELSE 0
        END
      ), 0) + COALESCE(u.bonus_points, 0) AS points,
      COALESCE(SUM(
        CASE
          WHEN m.finished AND p.home = m.home_score AND p.away = m.away_score THEN 1
          ELSE 0
        END
      ), 0) AS exact,
      COALESCE(SUM(
        CASE
          WHEN m.finished
            AND NOT (p.home = m.home_score AND p.away = m.away_score)
            AND SIGN(p.home - p.away) = SIGN(m.home_score - m.away_score) THEN 1
          ELSE 0
        END
      ), 0) AS correct,
      COALESCE(COUNT(p.id) FILTER (WHERE m.finished), 0) AS total
    FROM users u
    LEFT JOIN predictions p ON p.user_id = u.id
    LEFT JOIN matches m ON m.id = p.match_id
    WHERE u.role != 'admin'
    GROUP BY u.id, u.name, u.email, u.avatar, u.role, u.provider
    ORDER BY points DESC, exact DESC, u.name ASC
  `

  return NextResponse.json({ leaderboard: rows })
}
