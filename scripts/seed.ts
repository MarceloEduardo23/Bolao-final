/**
 * scripts/seed.ts
 * Popula o banco Neon com: admin user + todos os jogos reais da Copa 2026
 * Rodar: npx tsx scripts/seed.ts
 */
import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
async function ensureSchema() {
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
      id          TEXT PRIMARY KEY,
      group_name  TEXT NOT NULL,
      stage       TEXT NOT NULL DEFAULT 'Fase de Grupos',
      home_id     TEXT NOT NULL,
      away_id     TEXT NOT NULL,
      kickoff     TIMESTAMPTZ NOT NULL,
      home_score  INT,
      away_score  INT,
      finished    BOOLEAN NOT NULL DEFAULT FALSE
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS predictions (
      id          SERIAL PRIMARY KEY,
      match_id    TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      home        INT NOT NULL,
      away        INT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(match_id, user_id)
    )
  `
  console.log("✅ Schema OK")
}

// ---------------------------------------------------------------------------
// Admin user
// ---------------------------------------------------------------------------
async function seedAdmin() {
  const existing = await sql`SELECT id FROM users WHERE email = 'admin@bolao.com' LIMIT 1`
  if (existing.length > 0) {
    console.log("⏭  Admin já existe")
    return
  }
  const hashed = await bcrypt.hash("admin123", 10)
  await sql`
    INSERT INTO users (id, name, email, password, role, provider)
    VALUES ('admin', 'Administrador', 'admin@bolao.com', ${hashed}, 'admin', 'email')
  `
  console.log("✅ Admin criado (admin@bolao.com / admin123)")
}

// ---------------------------------------------------------------------------
// Matches data (todos os 48 jogos da fase de grupos da Copa 2026)
// Horários convertidos para UTC
// ---------------------------------------------------------------------------
type MatchRow = {
  id: string
  group_name: string
  home_id: string
  away_id: string
  kickoff: string
  home_score: number | null
  away_score: number | null
  finished: boolean
}

const MATCHES: MatchRow[] = [
  // ========== GROUP A ==========
  {
    id: "ga-mex-rsa",
    group_name: "Grupo A",
    home_id: "MEX",
    away_id: "RSA",
    kickoff: "2025-06-11T19:00:00Z", // 13:00 UTC-6 Mexico City
    home_score: 2,
    away_score: 0,
    finished: true,
  },
  {
    id: "ga-kor-cze",
    group_name: "Grupo A",
    home_id: "KOR",
    away_id: "CZE",
    kickoff: "2025-06-12T02:00:00Z", // 20:00 UTC-6 Guadalajara
    home_score: 2,
    away_score: 1,
    finished: true,
  },
  {
    id: "ga-cze-rsa",
    group_name: "Grupo A",
    home_id: "CZE",
    away_id: "RSA",
    kickoff: "2025-06-18T16:00:00Z", // 12:00 UTC-4 Atlanta
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "ga-mex-kor",
    group_name: "Grupo A",
    home_id: "MEX",
    away_id: "KOR",
    kickoff: "2025-06-19T01:00:00Z", // 19:00 UTC-6 Guadalajara
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "ga-cze-mex",
    group_name: "Grupo A",
    home_id: "CZE",
    away_id: "MEX",
    kickoff: "2025-06-25T01:00:00Z", // 19:00 UTC-6 Mexico City
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "ga-rsa-kor",
    group_name: "Grupo A",
    home_id: "RSA",
    away_id: "KOR",
    kickoff: "2025-06-25T01:00:00Z", // 19:00 UTC-6 Monterrey
    home_score: null,
    away_score: null,
    finished: false,
  },

  // ========== GROUP B ==========
  {
    id: "gb-can-bih",
    group_name: "Grupo B",
    home_id: "CAN",
    away_id: "BIH",
    kickoff: "2025-06-12T19:00:00Z", // 15:00 UTC-4 Toronto
    home_score: 1,
    away_score: 1,
    finished: true,
  },
  {
    id: "gb-qat-sui",
    group_name: "Grupo B",
    home_id: "QAT",
    away_id: "SUI",
    kickoff: "2025-06-13T19:00:00Z", // 12:00 UTC-7 San Francisco
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gb-sui-bih",
    group_name: "Grupo B",
    home_id: "SUI",
    away_id: "BIH",
    kickoff: "2025-06-18T19:00:00Z", // 12:00 UTC-7 Los Angeles
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gb-can-qat",
    group_name: "Grupo B",
    home_id: "CAN",
    away_id: "QAT",
    kickoff: "2025-06-18T22:00:00Z", // 15:00 UTC-7 Vancouver
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gb-sui-can",
    group_name: "Grupo B",
    home_id: "SUI",
    away_id: "CAN",
    kickoff: "2025-06-24T19:00:00Z", // 12:00 UTC-7 Vancouver
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gb-bih-qat",
    group_name: "Grupo B",
    home_id: "BIH",
    away_id: "QAT",
    kickoff: "2025-06-24T19:00:00Z", // 12:00 UTC-7 Seattle
    home_score: null,
    away_score: null,
    finished: false,
  },

  // ========== GROUP C ==========
  {
    id: "gc-bra-mar",
    group_name: "Grupo C",
    home_id: "BRA",
    away_id: "MAR",
    kickoff: "2025-06-13T22:00:00Z", // 18:00 UTC-4 New York/NJ
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gc-hai-sco",
    group_name: "Grupo C",
    home_id: "HAI",
    away_id: "SCO",
    kickoff: "2025-06-14T01:00:00Z", // 21:00 UTC-4 Boston
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gc-sco-mar",
    group_name: "Grupo C",
    home_id: "SCO",
    away_id: "MAR",
    kickoff: "2025-06-19T22:00:00Z", // 18:00 UTC-4 Boston
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gc-bra-hai",
    group_name: "Grupo C",
    home_id: "BRA",
    away_id: "HAI",
    kickoff: "2025-06-20T00:30:00Z", // 20:30 UTC-4 Philadelphia
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gc-sco-bra",
    group_name: "Grupo C",
    home_id: "SCO",
    away_id: "BRA",
    kickoff: "2025-06-24T22:00:00Z", // 18:00 UTC-4 Miami
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gc-mar-hai",
    group_name: "Grupo C",
    home_id: "MAR",
    away_id: "HAI",
    kickoff: "2025-06-24T22:00:00Z", // 18:00 UTC-4 Atlanta
    home_score: null,
    away_score: null,
    finished: false,
  },

  // ========== GROUP D ==========
  {
    id: "gd-usa-par",
    group_name: "Grupo D",
    home_id: "USA",
    away_id: "PAR",
    kickoff: "2025-06-13T01:00:00Z", // 18:00 UTC-7 Los Angeles
    home_score: 4,
    away_score: 1,
    finished: true,
  },
  {
    id: "gd-aus-tur",
    group_name: "Grupo D",
    home_id: "AUS",
    away_id: "TUR",
    kickoff: "2025-06-14T04:00:00Z", // 21:00 UTC-7 Vancouver
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gd-usa-aus",
    group_name: "Grupo D",
    home_id: "USA",
    away_id: "AUS",
    kickoff: "2025-06-19T19:00:00Z", // 12:00 UTC-7 Seattle
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gd-tur-par",
    group_name: "Grupo D",
    home_id: "TUR",
    away_id: "PAR",
    kickoff: "2025-06-20T03:00:00Z", // 20:00 UTC-7 San Francisco
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gd-tur-usa",
    group_name: "Grupo D",
    home_id: "TUR",
    away_id: "USA",
    kickoff: "2025-06-26T02:00:00Z", // 19:00 UTC-7 Los Angeles
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gd-par-aus",
    group_name: "Grupo D",
    home_id: "PAR",
    away_id: "AUS",
    kickoff: "2025-06-26T02:00:00Z", // 19:00 UTC-7 San Francisco
    home_score: null,
    away_score: null,
    finished: false,
  },

  // ========== GROUP E ==========
  {
    id: "ge-ger-cur",
    group_name: "Grupo E",
    home_id: "GER",
    away_id: "CUR",
    kickoff: "2025-06-14T17:00:00Z", // 12:00 UTC-5 Houston
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "ge-civ-ecu",
    group_name: "Grupo E",
    home_id: "CIV",
    away_id: "ECU",
    kickoff: "2025-06-14T23:00:00Z", // 19:00 UTC-4 Philadelphia
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "ge-ger-civ",
    group_name: "Grupo E",
    home_id: "GER",
    away_id: "CIV",
    kickoff: "2025-06-20T20:00:00Z", // 16:00 UTC-4 Toronto
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "ge-ecu-cur",
    group_name: "Grupo E",
    home_id: "ECU",
    away_id: "CUR",
    kickoff: "2025-06-21T00:00:00Z", // 19:00 UTC-5 Kansas City
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "ge-cur-civ",
    group_name: "Grupo E",
    home_id: "CUR",
    away_id: "CIV",
    kickoff: "2025-06-25T20:00:00Z", // 16:00 UTC-4 Philadelphia
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "ge-ecu-ger",
    group_name: "Grupo E",
    home_id: "ECU",
    away_id: "GER",
    kickoff: "2025-06-25T20:00:00Z", // 16:00 UTC-4 New York/NJ
    home_score: null,
    away_score: null,
    finished: false,
  },

  // ========== GROUP F ==========
  {
    id: "gf-ned-jpn",
    group_name: "Grupo F",
    home_id: "NED",
    away_id: "JPN",
    kickoff: "2025-06-14T20:00:00Z", // 15:00 UTC-5 Dallas
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gf-swe-tun",
    group_name: "Grupo F",
    home_id: "SWE",
    away_id: "TUN",
    kickoff: "2025-06-15T02:00:00Z", // 20:00 UTC-6 Monterrey
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gf-ned-swe",
    group_name: "Grupo F",
    home_id: "NED",
    away_id: "SWE",
    kickoff: "2025-06-20T17:00:00Z", // 12:00 UTC-5 Houston
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gf-tun-jpn",
    group_name: "Grupo F",
    home_id: "TUN",
    away_id: "JPN",
    kickoff: "2025-06-21T04:00:00Z", // 22:00 UTC-6 Monterrey
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gf-jpn-swe",
    group_name: "Grupo F",
    home_id: "JPN",
    away_id: "SWE",
    kickoff: "2025-06-25T23:00:00Z", // 18:00 UTC-5 Dallas
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gf-tun-ned",
    group_name: "Grupo F",
    home_id: "TUN",
    away_id: "NED",
    kickoff: "2025-06-25T23:00:00Z", // 18:00 UTC-5 Kansas City
    home_score: null,
    away_score: null,
    finished: false,
  },

  // ========== GROUP G ==========
  {
    id: "gg-bel-egy",
    group_name: "Grupo G",
    home_id: "BEL",
    away_id: "EGY",
    kickoff: "2025-06-15T19:00:00Z", // 12:00 UTC-7 Seattle
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gg-irn-nzl",
    group_name: "Grupo G",
    home_id: "IRN",
    away_id: "NZL",
    kickoff: "2025-06-16T01:00:00Z", // 18:00 UTC-7 Los Angeles
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gg-bel-irn",
    group_name: "Grupo G",
    home_id: "BEL",
    away_id: "IRN",
    kickoff: "2025-06-21T19:00:00Z", // 12:00 UTC-7 Los Angeles
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gg-nzl-egy",
    group_name: "Grupo G",
    home_id: "NZL",
    away_id: "EGY",
    kickoff: "2025-06-22T01:00:00Z", // 18:00 UTC-7 Vancouver
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gg-egy-irn",
    group_name: "Grupo G",
    home_id: "EGY",
    away_id: "IRN",
    kickoff: "2025-06-27T03:00:00Z", // 20:00 UTC-7 Seattle
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gg-nzl-bel",
    group_name: "Grupo G",
    home_id: "NZL",
    away_id: "BEL",
    kickoff: "2025-06-27T03:00:00Z", // 20:00 UTC-7 Vancouver
    home_score: null,
    away_score: null,
    finished: false,
  },

  // ========== GROUP H ==========
  {
    id: "gh-esp-cpv",
    group_name: "Grupo H",
    home_id: "ESP",
    away_id: "CPV",
    kickoff: "2025-06-15T16:00:00Z", // 12:00 UTC-4 Atlanta
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gh-ksa-uru",
    group_name: "Grupo H",
    home_id: "KSA",
    away_id: "URU",
    kickoff: "2025-06-15T22:00:00Z", // 18:00 UTC-4 Miami
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gh-esp-ksa",
    group_name: "Grupo H",
    home_id: "ESP",
    away_id: "KSA",
    kickoff: "2025-06-21T16:00:00Z", // 12:00 UTC-4 Atlanta
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gh-uru-cpv",
    group_name: "Grupo H",
    home_id: "URU",
    away_id: "CPV",
    kickoff: "2025-06-21T22:00:00Z", // 18:00 UTC-4 Miami
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gh-cpv-ksa",
    group_name: "Grupo H",
    home_id: "CPV",
    away_id: "KSA",
    kickoff: "2025-06-27T00:00:00Z", // 19:00 UTC-5 Houston
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gh-uru-esp",
    group_name: "Grupo H",
    home_id: "URU",
    away_id: "ESP",
    kickoff: "2025-06-27T00:00:00Z", // 18:00 UTC-6 Guadalajara
    home_score: null,
    away_score: null,
    finished: false,
  },

  // ========== GROUP I ==========
  {
    id: "gi-fra-sen",
    group_name: "Grupo I",
    home_id: "FRA",
    away_id: "SEN",
    kickoff: "2025-06-16T19:00:00Z", // 15:00 UTC-4 New York/NJ
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gi-irq-nor",
    group_name: "Grupo I",
    home_id: "IRQ",
    away_id: "NOR",
    kickoff: "2025-06-16T22:00:00Z", // 18:00 UTC-4 Boston
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gi-fra-irq",
    group_name: "Grupo I",
    home_id: "FRA",
    away_id: "IRQ",
    kickoff: "2025-06-22T21:00:00Z", // 17:00 UTC-4 Philadelphia
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gi-nor-sen",
    group_name: "Grupo I",
    home_id: "NOR",
    away_id: "SEN",
    kickoff: "2025-06-23T00:00:00Z", // 20:00 UTC-4 New York/NJ
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gi-nor-fra",
    group_name: "Grupo I",
    home_id: "NOR",
    away_id: "FRA",
    kickoff: "2025-06-26T19:00:00Z", // 15:00 UTC-4 Boston
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gi-sen-irq",
    group_name: "Grupo I",
    home_id: "SEN",
    away_id: "IRQ",
    kickoff: "2025-06-26T19:00:00Z", // 15:00 UTC-4 Toronto
    home_score: null,
    away_score: null,
    finished: false,
  },

  // ========== GROUP J ==========
  {
    id: "gj-arg-alg",
    group_name: "Grupo J",
    home_id: "ARG",
    away_id: "ALG",
    kickoff: "2025-06-17T01:00:00Z", // 20:00 UTC-5 Kansas City
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gj-aut-jor",
    group_name: "Grupo J",
    home_id: "AUT",
    away_id: "JOR",
    kickoff: "2025-06-17T04:00:00Z", // 21:00 UTC-7 San Francisco
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gj-arg-aut",
    group_name: "Grupo J",
    home_id: "ARG",
    away_id: "AUT",
    kickoff: "2025-06-22T17:00:00Z", // 12:00 UTC-5 Dallas
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gj-jor-alg",
    group_name: "Grupo J",
    home_id: "JOR",
    away_id: "ALG",
    kickoff: "2025-06-23T03:00:00Z", // 20:00 UTC-7 San Francisco
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gj-alg-aut",
    group_name: "Grupo J",
    home_id: "ALG",
    away_id: "AUT",
    kickoff: "2025-06-28T02:00:00Z", // 21:00 UTC-5 Kansas City
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gj-jor-arg",
    group_name: "Grupo J",
    home_id: "JOR",
    away_id: "ARG",
    kickoff: "2025-06-28T02:00:00Z", // 21:00 UTC-5 Dallas
    home_score: null,
    away_score: null,
    finished: false,
  },

  // ========== GROUP K ==========
  {
    id: "gk-por-cod",
    group_name: "Grupo K",
    home_id: "POR",
    away_id: "COD",
    kickoff: "2025-06-17T17:00:00Z", // 12:00 UTC-5 Houston
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gk-uzb-col",
    group_name: "Grupo K",
    home_id: "UZB",
    away_id: "COL",
    kickoff: "2025-06-18T02:00:00Z", // 20:00 UTC-6 Mexico City
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gk-por-uzb",
    group_name: "Grupo K",
    home_id: "POR",
    away_id: "UZB",
    kickoff: "2025-06-23T17:00:00Z", // 12:00 UTC-5 Houston
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gk-col-cod",
    group_name: "Grupo K",
    home_id: "COL",
    away_id: "COD",
    kickoff: "2025-06-24T02:00:00Z", // 20:00 UTC-6 Guadalajara
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gk-col-por",
    group_name: "Grupo K",
    home_id: "COL",
    away_id: "POR",
    kickoff: "2025-06-27T23:30:00Z", // 19:30 UTC-4 Miami
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gk-cod-uzb",
    group_name: "Grupo K",
    home_id: "COD",
    away_id: "UZB",
    kickoff: "2025-06-27T23:30:00Z", // 19:30 UTC-4 Atlanta
    home_score: null,
    away_score: null,
    finished: false,
  },

  // ========== GROUP L ==========
  {
    id: "gl-eng-cro",
    group_name: "Grupo L",
    home_id: "ENG",
    away_id: "CRO",
    kickoff: "2025-06-17T20:00:00Z", // 15:00 UTC-5 Dallas
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gl-gha-pan",
    group_name: "Grupo L",
    home_id: "GHA",
    away_id: "PAN",
    kickoff: "2025-06-17T23:00:00Z", // 19:00 UTC-4 Toronto
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gl-eng-gha",
    group_name: "Grupo L",
    home_id: "ENG",
    away_id: "GHA",
    kickoff: "2025-06-23T20:00:00Z", // 16:00 UTC-4 Boston
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gl-pan-cro",
    group_name: "Grupo L",
    home_id: "PAN",
    away_id: "CRO",
    kickoff: "2025-06-23T23:00:00Z", // 19:00 UTC-4 Toronto
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gl-pan-eng",
    group_name: "Grupo L",
    home_id: "PAN",
    away_id: "ENG",
    kickoff: "2025-06-27T21:00:00Z", // 17:00 UTC-4 New York/NJ
    home_score: null,
    away_score: null,
    finished: false,
  },
  {
    id: "gl-cro-gha",
    group_name: "Grupo L",
    home_id: "CRO",
    away_id: "GHA",
    kickoff: "2025-06-27T21:00:00Z", // 17:00 UTC-4 Philadelphia
    home_score: null,
    away_score: null,
    finished: false,
  },
]

async function seedMatches() {
  let inserted = 0
  let skipped = 0

  for (const m of MATCHES) {
    const existing = await sql`SELECT id FROM matches WHERE id = ${m.id} LIMIT 1`
    if (existing.length > 0) {
      skipped++
      continue
    }
    await sql`
      INSERT INTO matches (id, group_name, home_id, away_id, kickoff, home_score, away_score, finished)
      VALUES (
        ${m.id},
        ${m.group_name},
        ${m.home_id},
        ${m.away_id},
        ${m.kickoff},
        ${m.home_score},
        ${m.away_score},
        ${m.finished}
      )
    `
    inserted++
  }

  console.log(`✅ Matches: ${inserted} inseridos, ${skipped} já existiam`)
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
async function main() {
  console.log("🌱 Iniciando seed...")
  await ensureSchema()
  await seedAdmin()
  await seedMatches()
  console.log("🎉 Seed concluído!")
  process.exit(0)
}

main().catch((e) => {
  console.error("❌ Erro no seed:", e)
  process.exit(1)
})
