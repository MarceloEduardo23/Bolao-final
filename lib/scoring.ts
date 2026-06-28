import type { Match } from "./matches-data"
import { getTeam } from "./teams"

export interface Prediction {
  matchId: string
  userId: string
  home: number        // palpite placar 90'
  away: number
  homeET: number | null   // palpite prorrogação
  awayET: number | null
  homePenalties: number | null  // palpite pênaltis
  awayPenalties: number | null
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  avatar: string | null
  role: "user" | "admin"
  provider: "email" | "google"
}

export function isKnockout(m: Match): boolean {
  return m.stage !== "Fase de Grupos"
}

export function isDrawResult(m: Match): boolean {
  return m.homeScore !== null && m.awayScore !== null && m.homeScore === m.awayScore
}

export function penaltyWinner(m: Match): "home" | "away" | null {
  if (m.homePenalties === null || m.awayPenalties === null) return null
  if (m.homePenalties > m.awayPenalties) return "home"
  if (m.awayPenalties > m.homePenalties) return "away"
  return null
}

export function etWinner(m: Match): "home" | "away" | null {
  if (m.homeET === null || m.awayET === null) return null
  if (m.homeET > m.awayET) return "home"
  if (m.awayET > m.homeET) return "away"
  return null // empatou na ET → foi para pênaltis
}

/**
 * NOVO SISTEMA DE PONTUAÇÃO
 *
 * FASE DE GRUPOS (sem prorrogação):
 *   - Placar exato nos 90' = 3 pts
 *   - Acertou só o vencedor/empate = 1 pt
 *   - Errou = 0 pts
 *
 * FASE ELIMINATÓRIA — 5 cenários:
 *
 * 1. GABARITO SUPREMO (22 pts)
 *    Placar 90' exato + prorrogação exata + pênaltis exatos + classificado certo
 *
 * 2. O EMPATE PERFEITO (17 pts)
 *    Errou o placar dos 90' (mas previu empate) + cravou prorrogação + pênaltis exatos + classificado certo
 *
 * 3. DECISÃO NOS PÊNALTIS (12 pts)
 *    Errou 90' (previu empate) + errou prorrogação (previu empate) + pênaltis exatos + classificado certo
 *
 * 4. CRAVOU NO TEMPO NORMAL (12 pts)
 *    Placar exato em jogo resolvido nos 90' + classificado certo
 *
 * 5. ACERTOU SÓ O CLASSIFICADO (5 pts)
 *    Errou todos os placares, mas o time que o usuário apostou para passar passou
 */
export function scorePrediction(p: Prediction, m: Match): number {
  if (!m.finished || m.homeScore === null || m.awayScore === null) return 0

  // ── FASE DE GRUPOS ──────────────────────────────────────────────────────────
  if (!isKnockout(m)) {
    const exactScore = p.home === m.homeScore && p.away === m.awayScore
    const realResult = Math.sign(m.homeScore - m.awayScore)
    const predResult = Math.sign(p.home - p.away)
    if (exactScore) return 3
    if (realResult === predResult) return 1
    return 0
  }

  // ── FASE ELIMINATÓRIA ───────────────────────────────────────────────────────
  // Determinar classificado real
  const penWinner = penaltyWinner(m)
  const etWin = etWinner(m)

  // Quem passou de verdade?
  let realWinner: "home" | "away"
  if (m.homeScore > m.awayScore!) {
    realWinner = "home"                        // ganhou nos 90'
  } else if (m.awayScore! > m.homeScore) {
    realWinner = "away"                        // ganhou nos 90'
  } else if (etWin !== null) {
    realWinner = etWin                         // ganhou na prorrogação
  } else if (penWinner !== null) {
    realWinner = penWinner                     // ganhou nos pênaltis
  } else {
    return 0 // jogo ainda sem resultado completo
  }

  // Quem o usuário apostou que passaria?
  let predWinner: "home" | "away"
  const predResult90 = Math.sign(p.home - p.away)
  if (predResult90 > 0) {
    predWinner = "home"
  } else if (predResult90 < 0) {
    predWinner = "away"
  } else {
    // usuário apostou empate nos 90' → depende do palpite de ET/pênaltis
    if (p.homeET !== null && p.awayET !== null) {
      const predETResult = Math.sign(p.homeET - p.awayET)
      if (predETResult > 0) predWinner = "home"
      else if (predETResult < 0) predWinner = "away"
      else {
        // apostou empate na ET também → decide pelos pênaltis
        if (p.homePenalties !== null && p.awayPenalties !== null) {
          predWinner = p.homePenalties > p.awayPenalties ? "home" : "away"
        } else {
          return 0
        }
      }
    } else if (p.homePenalties !== null && p.awayPenalties !== null) {
      predWinner = p.homePenalties > p.awayPenalties ? "home" : "away"
    } else {
      return 0
    }
  }

  const correctWinner = predWinner === realWinner

  // ── Verificar cada cenário ──────────────────────────────────────────────────

  const exact90 = p.home === m.homeScore && p.away === m.awayScore
  const drewIn90 = m.homeScore === m.awayScore  // jogo foi para ET
  const resolvedIn90 = !drewIn90                // resolvido nos 90'

  // CENÁRIO 4: Cravou no Tempo Normal (12 pts)
  // Jogo decidido nos 90', placar exato
  if (resolvedIn90 && exact90 && correctWinner) {
    return 12
  }

  // CENÁRIO 5: Acertou só o classificado (5 pts) — jogo resolvido nos 90'
  if (resolvedIn90 && !exact90 && correctWinner) {
    return 5
  }

  // A partir daqui: jogo foi para ET/pênaltis
  if (!drewIn90) return 0  // salvaguarda

  const exactET = m.homeET !== null && m.awayET !== null &&
    p.homeET === m.homeET && p.awayET === m.awayET

  const drewInET = m.homeET !== null && m.awayET !== null && m.homeET === m.awayET
  const exactPen = m.homePenalties !== null && m.awayPenalties !== null &&
    p.homePenalties === m.homePenalties && p.awayPenalties === m.awayPenalties

  // Usuário previu empate nos 90' (ou seja, chegou à ET no palpite)
  const predDrewIn90 = p.home === p.away

  if (!predDrewIn90) {
    // Errou o 90' (não previu empate) — só pode ganhar "acertou classificado"
    if (correctWinner) return 5
    return 0
  }

  // Usuário previu empate nos 90' ✓
  const predDrewInET = p.homeET !== null && p.awayET !== null && p.homeET === p.awayET

  // CENÁRIO 1: Gabarito Supremo (22 pts)
  // Placar 90' exato + ET exata + pênaltis exatos + classificado
  if (exact90 && exactET && exactPen && correctWinner) {
    return 22
  }

  // CENÁRIO 2: O Empate Perfeito (17 pts)
  // Errou 90' (mas previu empate) + cravou ET + pênaltis exatos + classificado
  if (!exact90 && predDrewIn90 && exactET && exactPen && correctWinner) {
    return 17
  }

  // CENÁRIO 3: Decisão nos Pênaltis (12 pts)
  // Errou 90' (mas previu empate) + errou ET (mas previu empate na ET) + pênaltis exatos + classificado
  if (!exact90 && predDrewIn90 && !exactET && predDrewInET && exactPen && correctWinner) {
    return 12
  }

  // Acertou só o classificado
  if (correctWinner) return 5

  return 0
}

export interface LeaderRow {
  user: User
  points: number
  exact: number
  correct: number
  total: number
  bonusPoints?: number
}

export function buildLeaderboard(
  users: User[],
  predictions: Prediction[],
  matches: Match[],
): LeaderRow[] {
  const matchMap = new Map(matches.map((m) => [m.id, m]))
  const rows: LeaderRow[] = users
    .filter((u) => u.role !== "admin")
    .map((user) => {
      let points = 0
      let exact = 0
      let correct = 0
      let total = 0
      for (const p of predictions.filter((pr) => pr.userId === user.id)) {
        const m = matchMap.get(p.matchId)
        if (!m || !m.finished) continue
        const s = scorePrediction(p, m)
        points += s
        if (s >= 12) exact++
        else if (s >= 5) correct++
        total++
      }
      return { user, points, exact, correct, total }
    })

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.exact !== a.exact) return b.exact - a.exact
    return a.user.name.localeCompare(b.user.name)
  })

  return rows
}

export function matchLabel(m: Match): string {
  return `${getTeam(m.homeId).name} x ${getTeam(m.awayId).name}`
}

export function matchStatus(m: Match): "upcoming" | "live" | "finished" {
  if (m.finished) return "finished"
  const now = Date.now()
  const start = new Date(m.kickoff).getTime()
  if (now >= start) return "live"
  return "upcoming"
}

export function canPredict(m: Match): boolean {
  if (m.finished) return false
  const now = Date.now()
  const kickoff = new Date(m.kickoff).getTime()
  return now < kickoff
}
