export type Stage = "Fase de Grupos" | "Oitavas" | "Quartas" | "Semifinal" | "Final"

export interface Match {
  id: string
  group: string // ex: "Grupo A" ou "Oitavas"
  stage: Stage
  homeId: string
  awayId: string
  // ISO datetime de início do jogo
  kickoff: string
  // resultado oficial (preenchido pelo admin quando o jogo acaba)
  homeScore: number | null
  awayScore: number | null
  finished: boolean
  // Penaltis (apenas em caso de empate no tempo normal em jogos eliminatórios)
  homePenalties: number | null
  awayPenalties: number | null
}
