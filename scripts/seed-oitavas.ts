/**
 * scripts/seed-oitavas.ts
 * Adiciona os 16 jogos dos 16 avos de final da Copa 2026 ao banco
 * Rodar: npx tsx scripts/seed-oitavas.ts
 * 
 * NÃO altera nenhum dado existente (predictions, users, pontos).
 * Usa INSERT ... ON CONFLICT DO NOTHING para ser idempotente.
 */
import "dotenv/config"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function ensurePenaltyColumns() {
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_penalties INT`
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_penalties INT`
  console.log("✅ Colunas de pênaltis garantidas")
}

type MatchRow = {
  id: string
  group_name: string
  stage: string
  home_id: string
  away_id: string
  kickoff: string
}

// Todos os 16 jogos dos 16-avos da Copa 2026
// Horários em UTC (Brasília = UTC-3)
const OITAVAS: MatchRow[] = [
  // 28 jun (domingo)
  { id: "r16-rsa-can", group_name: "16 avos", stage: "Oitavas", home_id: "RSA", away_id: "CAN", kickoff: "2026-06-28T19:00:00Z" }, // 16h BRT
  // 29 jun (segunda)
  { id: "r16-bra-jpn", group_name: "16 avos", stage: "Oitavas", home_id: "BRA", away_id: "JPN", kickoff: "2026-06-29T17:00:00Z" }, // 14h BRT
  { id: "r16-ger-par", group_name: "16 avos", stage: "Oitavas", home_id: "GER", away_id: "PAR", kickoff: "2026-06-29T20:30:00Z" }, // 17h30 BRT
  { id: "r16-ned-mar", group_name: "16 avos", stage: "Oitavas", home_id: "NED", away_id: "MAR", kickoff: "2026-06-30T01:00:00Z" }, // 22h BRT
  // 30 jun (terça)
  { id: "r16-civ-nor", group_name: "16 avos", stage: "Oitavas", home_id: "CIV", away_id: "NOR", kickoff: "2026-06-30T17:00:00Z" }, // 14h BRT
  { id: "r16-fra-swe", group_name: "16 avos", stage: "Oitavas", home_id: "FRA", away_id: "SWE", kickoff: "2026-06-30T21:00:00Z" }, // 18h BRT
  { id: "r16-mex-ecu", group_name: "16 avos", stage: "Oitavas", home_id: "MEX", away_id: "ECU", kickoff: "2026-07-01T01:00:00Z" }, // 22h BRT
  // 1 jul (quarta)
  { id: "r16-eng-cod", group_name: "16 avos", stage: "Oitavas", home_id: "ENG", away_id: "COD", kickoff: "2026-07-01T16:00:00Z" }, // 13h BRT
  { id: "r16-bel-sen", group_name: "16 avos", stage: "Oitavas", home_id: "BEL", away_id: "SEN", kickoff: "2026-07-01T20:00:00Z" }, // 17h BRT
  { id: "r16-usa-bih", group_name: "16 avos", stage: "Oitavas", home_id: "USA", away_id: "BIH", kickoff: "2026-07-02T00:00:00Z" }, // 21h BRT
  // 2 jul (quinta)
  { id: "r16-esp-aut", group_name: "16 avos", stage: "Oitavas", home_id: "ESP", away_id: "AUT", kickoff: "2026-07-02T19:00:00Z" }, // 16h BRT
  { id: "r16-por-cro", group_name: "16 avos", stage: "Oitavas", home_id: "POR", away_id: "CRO", kickoff: "2026-07-02T23:00:00Z" }, // 20h BRT
  // 3 jul (sexta)
  { id: "r16-sui-alg", group_name: "16 avos", stage: "Oitavas", home_id: "SUI", away_id: "ALG", kickoff: "2026-07-03T03:00:00Z" }, // 0h BRT
  { id: "r16-aus-egy", group_name: "16 avos", stage: "Oitavas", home_id: "AUS", away_id: "EGY", kickoff: "2026-07-03T18:00:00Z" }, // 15h BRT
  { id: "r16-arg-cpv", group_name: "16 avos", stage: "Oitavas", home_id: "ARG", away_id: "CPV", kickoff: "2026-07-03T22:00:00Z" }, // 19h BRT
  { id: "r16-col-gha", group_name: "16 avos", stage: "Oitavas", home_id: "COL", away_id: "GHA", kickoff: "2026-07-04T01:30:00Z" }, // 22h30 BRT
]

async function seedOitavas() {
  let inserted = 0
  let skipped = 0

  for (const m of OITAVAS) {
    const result = await sql`
      INSERT INTO matches (id, group_name, stage, home_id, away_id, kickoff, home_score, away_score, finished)
      VALUES (
        ${m.id},
        ${m.group_name},
        ${m.stage},
        ${m.home_id},
        ${m.away_id},
        ${m.kickoff},
        NULL,
        NULL,
        FALSE
      )
      ON CONFLICT (id) DO NOTHING
    `
    if (result.count === 0) skipped++
    else inserted++
  }

  console.log(`✅ 16 avos: ${inserted} inseridos, ${skipped} já existiam`)
}

async function main() {
  console.log("🌱 Inserindo jogos dos 16 avos de final...")
  await ensurePenaltyColumns()
  await seedOitavas()
  console.log("🎉 Concluído! Nenhum dado existente foi alterado.")
  process.exit(0)
}

main().catch((e) => {
  console.error("❌ Erro:", e)
  process.exit(1)
})
