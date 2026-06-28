export type Stage = "Fase de Grupos" | "Oitavas" | "Quartas" | "Semifinal" | "Final"

export interface Match {
  id: string
  group: string // ex: "Grupo A" ou "Oitavas"
  stage: Stage
  homeId: string
  awayId: string
  // ISO datetime de início do jogo
  kickoff: string
  // Resultado nos 90 minutos
  homeScore: number | null
  awayScore: number | null
  finished: boolean
  // Prorrogação (apenas em jogos eliminatórios que foram para ET)
  homeET: number | null   // placar após prorrogação (inclui os 90')
  awayET: number | null
  // Pênaltis (apenas se ainda empatado após prorrogação)
  homePenalties: number | null
  awayPenalties: number | null
}
