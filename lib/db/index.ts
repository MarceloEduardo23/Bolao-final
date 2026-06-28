import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

export const sql = neon(process.env.DATABASE_URL)

export async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT,
      avatar      TEXT,
      role        TEXT NOT NULL DEFAULT 'user',
      provider    TEXT NOT NULL DEFAULT 'email',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS matches (
      id              TEXT PRIMARY KEY,
      group_name      TEXT NOT NULL,
      stage           TEXT NOT NULL DEFAULT 'Fase de Grupos',
      home_id         TEXT NOT NULL,
      away_id         TEXT NOT NULL,
      kickoff         TIMESTAMPTZ NOT NULL,
      home_score      INT,
      away_score      INT,
      finished        BOOLEAN NOT NULL DEFAULT FALSE,
      home_penalties  INT,
      away_penalties  INT
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS predictions (
      id              SERIAL PRIMARY KEY,
      match_id        TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      home            INT NOT NULL,
      away            INT NOT NULL,
      home_penalties  INT,
      away_penalties  INT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(match_id, user_id)
    )
  `

  // Migrations para colunas adicionadas depois
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_penalties INT`
  await sql`ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_penalties INT`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS home_penalties INT`
  await sql`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS away_penalties INT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_points INTEGER NOT NULL DEFAULT 0`
}
