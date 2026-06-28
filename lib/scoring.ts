import type { Match } from "./matches-data"
import { getTeam } from "./teams"

export interface Prediction {
  matchId: string
  userId: string
  home: number
  away: number
  // Palpite de pênaltis (para jogos eliminatórios em que ambos apostam empate)
  homePenalties: number | null
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

// Verifica se o jogo é eliminatório (pode ter pênaltis)
export function isKnockout(m: Match): boolean {
  return m.stage !== "Fase de Grupos"
}

// Verifica se o resultado real terminou empatado (tempo normal)
export function isDrawResult(m: Match): boolean {
  return m.homeScore !== null && m.awayScore !== null && m.homeScore === m.awayScore
}

// Retorna o vencedor real nos pênaltis (caso tenha)
export function penaltyWinner(m: Match): "home" | "away" | null {
  if (!isDrawResult(m) || m.homePenalties === null || m.awayPenalties === null) return null
  if (m.homePenalties > m.awayPenalties) return "home"
  if (m.awayPenalties > m.homePenalties) return "away"
  return null
}

/**
 * Pontuação:
 * - Fase de grupos: placar exato = 3, vencedor correto = 1, erro = 0
 * - Fase eliminatória (empate possível → pênaltis):
 *   - Placar exato no tempo normal + acertou o vencedor nos pênaltis = 4
 *   - Placar exato no tempo normal + errou o vencedor nos pênaltis = 3
 *   - Acertou só o vencedor nos pênaltis (placar errado) = 2
 *   - Acertou vencedor no tempo normal (sem pênaltis, placar errado) = 1
 *   - Errou = 0
 */
export function scorePrediction(p: Prediction, m: Match): number {
  if (!m.finished || m.homeScore === null || m.awayScore === null) return 0

  const exactScore = p.home === m.homeScore && p.away === m.awayScore
  const realResult = Math.sign(m.homeScore - m.awayScore)
  const predResult = Math.sign(p.home - p.away)
  const correctWinner = realResult === predResult

  if (!isKnockout(m)) {
    // Fase de grupos: sem pênaltis
    if (exactScore) return 3
    if (correctWinner) return 1
    return 0
  }

  // Fase eliminatória
  const winner = penaltyWinner(m)

  if (exactScore) {
    // Acertou o placar do tempo normal
    if (winner !== null) {
      // Jogo foi para pênaltis — verifica palpite de pênaltis
      if (p.homePenalties !== null && p.awayPenalties !== null) {
        const predPenWinner = p.homePenalties > p.awayPenalties ? "home" : "away"
        if (predPenWinner === winner) return 4 // Placar + pênaltis certos
      }
      return 3 // Placar certo, pênaltis errado
    }
    return 3 // Placar certo, sem pênaltis
  }

  if (winner !== null) {
    // Jogo foi para pênaltis — palpite pode acertar o vencedor via pênaltis
    if (p.home === m.homeScore && p.away === m.awayScore) {
      // já tratado acima
    }
    // Usuário apostou empate no tempo normal?
    if (predResult === 0 && p.homePenalties !== null && p.awayPenalties !== null) {
      const predPenWinner = p.homePenalties > p.awayPenalties ? "home" : "away"
      if (predPenWinner === winner) return 2 // Acertou vencedor via pênaltis
    }
    return 0
  }

  // Sem pênaltis (decidido no tempo normal)
  if (correctWinner) return 1
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
        if (s >= 3) exact++
        else if (s >= 1) correct++
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

// Estado de um jogo em relação ao horário atual
export function matchStatus(m: Match): "upcoming" | "live" | "finished" {
  if (m.finished) return "finished"
  const now = Date.now()
  const start = new Date(m.kickoff).getTime()
  if (now >= start) return "live"
  return "upcoming"
}

// O palpite só pode ser feito/editado antes do jogo começar
export function canPredict(m: Match): boolean {
  if (m.finished) return false
  const now = Date.now()
  const kickoff = new Date(m.kickoff).getTime()
  return now < kickoff
}
