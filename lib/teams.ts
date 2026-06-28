export interface Team {
  code: string // ISO 3166-1 alpha-2 (para bandeira)
  name: string
}

// Todas as seleções da Copa do Mundo 2026
export const TEAMS: Record<string, Team> = {
  // Group A
  MEX: { code: "mx", name: "México" },
  RSA: { code: "za", name: "África do Sul" },
  KOR: { code: "kr", name: "Coreia do Sul" },
  CZE: { code: "cz", name: "Tchéquia" },
  // Group B
  CAN: { code: "ca", name: "Canadá" },
  BIH: { code: "ba", name: "Bósnia e Herz." },
  QAT: { code: "qa", name: "Catar" },
  SUI: { code: "ch", name: "Suíça" },
  // Group C
  BRA: { code: "br", name: "Brasil" },
  MAR: { code: "ma", name: "Marrocos" },
  HAI: { code: "ht", name: "Haiti" },
  SCO: { code: "gb-sct", name: "Escócia" },
  // Group D
  USA: { code: "us", name: "EUA" },
  PAR: { code: "py", name: "Paraguai" },
  AUS: { code: "au", name: "Austrália" },
  TUR: { code: "tr", name: "Turquia" },
  // Group E
  GER: { code: "de", name: "Alemanha" },
  CUR: { code: "cw", name: "Curaçao" },
  CIV: { code: "ci", name: "Costa do Marfim" },
  ECU: { code: "ec", name: "Equador" },
  // Group F
  NED: { code: "nl", name: "Holanda" },
  JPN: { code: "jp", name: "Japão" },
  SWE: { code: "se", name: "Suécia" },
  TUN: { code: "tn", name: "Tunísia" },
  // Group G
  BEL: { code: "be", name: "Bélgica" },
  EGY: { code: "eg", name: "Egito" },
  IRN: { code: "ir", name: "Irã" },
  NZL: { code: "nz", name: "Nova Zelândia" },
  // Group H
  ESP: { code: "es", name: "Espanha" },
  CPV: { code: "cv", name: "Cabo Verde" },
  KSA: { code: "sa", name: "Arábia Saudita" },
  URU: { code: "uy", name: "Uruguai" },
  // Group I
  FRA: { code: "fr", name: "França" },
  SEN: { code: "sn", name: "Senegal" },
  IRQ: { code: "iq", name: "Iraque" },
  NOR: { code: "no", name: "Noruega" },
  // Group J
  ARG: { code: "ar", name: "Argentina" },
  ALG: { code: "dz", name: "Argélia" },
  AUT: { code: "at", name: "Áustria" },
  JOR: { code: "jo", name: "Jordânia" },
  // Group K
  POR: { code: "pt", name: "Portugal" },
  COD: { code: "cd", name: "Congo DR" },
  UZB: { code: "uz", name: "Uzbequistão" },
  COL: { code: "co", name: "Colômbia" },
  // Group L
  ENG: { code: "gb-eng", name: "Inglaterra" },
  CRO: { code: "hr", name: "Croácia" },
  GHA: { code: "gh", name: "Gana" },
  PAN: { code: "pa", name: "Panamá" },
}

export function getTeam(id: string): Team {
  return TEAMS[id] ?? { code: "un", name: id }
}

export function flagUrl(code: string): string {
  return `https://flagcdn.com/w160/${code}.png`
}
