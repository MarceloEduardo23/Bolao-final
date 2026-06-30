"use client"

import { useMemo } from "react"
import { useStore } from "@/lib/store"
import { getTeam, flagUrl } from "@/lib/teams"
import { penaltyWinner } from "@/lib/scoring"
import type { Match } from "@/lib/matches-data"
import { Trophy, Star } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

// ───────────────────────────────────────────────────────────────────────────
// Estrutura oficial do chaveamento da Copa 2026 (caminho até a final)
// Cada "slot" do lado esquerdo/direito segue exatamente a árvore oficial.
// ───────────────────────────────────────────────────────────────────────────

type Side = "left" | "right"

interface BracketLeaf {
  matchId: string
}

// LADO ESQUERDO — de cima para baixo: 4 confrontos de oitavas → 2 de quartas → 1 semi
const LEFT_R16: BracketLeaf[] = [
  { matchId: "r16-ger-par" },  // 1E x 3
  { matchId: "r16-fra-swe" },  // 1I x 3
  { matchId: "r16-rsa-can" },  // 2A x 2B
  { matchId: "r16-ned-mar" },  // 1F x 2C
]
const LEFT_R16_B: BracketLeaf[] = [
  { matchId: "r16-por-cro" },  // 2K x 2L
  { matchId: "r16-esp-aut" },  // 1H x 2J
  { matchId: "r16-usa-bih" },  // 1D x 3
  { matchId: "r16-bel-sen" },  // 1G x 3
]

// LADO DIREITO
const RIGHT_R16: BracketLeaf[] = [
  { matchId: "r16-bra-jpn" },  // 1C x 2F
  { matchId: "r16-civ-nor" },  // 2E x 2I
  { matchId: "r16-mex-ecu" },  // 1A x 3
  { matchId: "r16-eng-cod" },  // 1L x 3
]
const RIGHT_R16_B: BracketLeaf[] = [
  { matchId: "r16-arg-cpv" },  // 1J x 2H
  { matchId: "r16-aus-egy" },  // 2D x 2G
  { matchId: "r16-sui-alg" },  // 1B x 3
  { matchId: "r16-col-gha" },  // 1K x 3
]

function getWinner(match: Match | undefined): string | null {
  if (!match || !match.finished) return null
  if (match.homeScore === null || match.awayScore === null) return null
  if (match.homeScore > match.awayScore) return match.homeId
  if (match.awayScore > match.homeScore) return match.awayId
  if (match.homeET !== null && match.awayET !== null) {
    if (match.homeET > match.awayET) return match.homeId
    if (match.awayET > match.homeET) return match.awayId
  }
  const winner = penaltyWinner(match)
  if (winner === "home") return match.homeId
  if (winner === "away") return match.awayId
  return null
}

function FlagBox({ teamId, isWinner, isLoser }: { teamId: string | null; isWinner?: boolean; isLoser?: boolean }) {
  const team = teamId ? getTeam(teamId) : null
  return (
    <div className={cn(
      "flex h-9 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-bold transition-all",
      isWinner
        ? "border-primary bg-primary/15 text-primary"
        : isLoser
          ? "border-border bg-muted/50 text-muted-foreground/50 line-through"
          : "border-border bg-card text-foreground"
    )}>
      {team ? (
        <>
          <Image src={flagUrl(team.code)} alt={team.name} width={18} height={13} className="rounded-sm shrink-0 object-cover" unoptimized />
          <span className="truncate">{team.name}</span>
          {isWinner && <Star className="ml-auto size-3 shrink-0 fill-primary" />}
        </>
      ) : (
        <span className="text-muted-foreground/60">A definir</span>
      )}
    </div>
  )
}

function R16Card({ match, reverse = false }: { match: Match | undefined; reverse?: boolean }) {
  const winner = getWinner(match)
  const homeW = winner === match?.homeId
  const awayW = winner === match?.awayId
  const homeL = winner !== null && !homeW
  const awayL = winner !== null && !awayW

  return (
    <div className={cn("flex flex-col gap-1 w-full", reverse && "items-end")}>
      <FlagBox teamId={match?.homeId ?? null} isWinner={homeW} isLoser={homeL} />
      <FlagBox teamId={match?.awayId ?? null} isWinner={awayW} isLoser={awayL} />
    </div>
  )
}

function ProjSlot({ teamId, reverse = false }: { teamId: string | null; reverse?: boolean }) {
  return (
    <div className={cn("w-full", reverse && "flex justify-end")}>
      <div className="w-full max-w-[150px]">
        <FlagBox teamId={teamId} isWinner={!!teamId} />
      </div>
    </div>
  )
}

// Conector visual entre colunas (linha em L)
function Connector({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className={cn("flex w-4 shrink-0 flex-col justify-center sm:w-6", reverse && "scale-x-[-1]")}>
      <div className="h-px w-full bg-border" />
    </div>
  )
}

export default function ChaveamentoPage() {
  const { matches } = useStore()

  const matchMap = useMemo(() => {
    const m = new Map<string, Match>()
    for (const match of matches) m.set(match.id, match)
    return m
  }, [matches])

  const getM = (id: string) => matchMap.get(id)
  const w = (id: string) => getWinner(getM(id))

  // Quartas (projeção): par a par dentro de cada bloco de 4
  function quarterPair(leaves: BracketLeaf[]): [string | null, string | null][] {
    return [
      [w(leaves[0].matchId), w(leaves[1].matchId)],
      [w(leaves[2].matchId), w(leaves[3].matchId)],
    ]
  }

  const leftTopQF = quarterPair(LEFT_R16)
  const leftBotQF = quarterPair(LEFT_R16_B)
  const rightTopQF = quarterPair(RIGHT_R16)
  const rightBotQF = quarterPair(RIGHT_R16_B)

  // Semis (projeção): vencedor das duas quartas de cada bloco — ainda não há jogo cadastrado,
  // então mostramos "A definir" até implementarmos os jogos de quartas/semi no banco.
  const allR16 = [...LEFT_R16, ...LEFT_R16_B, ...RIGHT_R16, ...RIGHT_R16_B]
  const hasAnyMatch = allR16.some(l => getM(l.matchId))

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Header */}
      <section
        className="animate-slide-up overflow-hidden rounded-3xl p-5 text-white"
        style={{
          background: "linear-gradient(135deg, #6B22CC 0%, #9333EA 30%, #0891B2 65%, #E62E2E 100%)",
        }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
          <Trophy className="size-4" />
          Fase Mata-Mata
        </div>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight">Chaveamento Oficial</h1>
        <p className="mt-1 text-sm text-white/85">
          O caminho oficial de cada seleção até a final, igual à tabela da FIFA. Atualiza sozinho conforme os jogos terminam.
        </p>
      </section>

      {!hasAnyMatch && (
        <div className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Os jogos das oitavas ainda não foram carregados no banco de dados.
        </div>
      )}

      {hasAnyMatch && (
        <>
          {/* ── BRACKET DESKTOP/TABLET: lado a lado ── */}
          <div className="hidden md:block overflow-x-auto">
            <div className="flex items-center justify-center gap-3 min-w-[900px] px-2">
              {/* LADO ESQUERDO */}
              <BracketColumnGroup
                r16Top={LEFT_R16} r16Bot={LEFT_R16_B}
                qfTop={leftTopQF} qfBot={leftBotQF}
                getM={getM}
                side="left"
              />

              {/* TROFÉU / FINAL */}
              <div className="flex flex-col items-center justify-center gap-2 px-4 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Final</span>
                <Trophy className="size-12 text-yellow-500 drop-shadow" />
                <div className="w-28 rounded-xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 p-2 text-center">
                  <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400">🏆 Campeão</span>
                </div>
              </div>

              {/* LADO DIREITO */}
              <BracketColumnGroup
                r16Top={RIGHT_R16} r16Bot={RIGHT_R16_B}
                qfTop={rightTopQF} qfBot={rightBotQF}
                getM={getM}
                side="right"
              />
            </div>
          </div>

          {/* ── BRACKET MOBILE: lista vertical agrupada ── */}
          <div className="flex flex-col gap-5 md:hidden">
            <MobileGroup title="Lado Esquerdo · Oitavas" leaves={[...LEFT_R16, ...LEFT_R16_B]} getM={getM} />
            <MobileGroup title="Lado Esquerdo · Quartas (projeção)" pairs={[...leftTopQF, ...leftBotQF]} />
            <MobileGroup title="Lado Direito · Oitavas" leaves={[...RIGHT_R16, ...RIGHT_R16_B]} getM={getM} />
            <MobileGroup title="Lado Direito · Quartas (projeção)" pairs={[...rightTopQF, ...rightBotQF]} />
          </div>
        </>
      )}

      {/* Info */}
      <div className="rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground leading-relaxed">
        <p className="font-semibold text-foreground mb-1">ℹ️ Sobre o chaveamento</p>
        Este é o caminho oficial até a final, conforme a tabela da FIFA. Os confrontos de oitavas são fixos; vencedores avançam automaticamente para as quartas assim que o admin registrar o resultado. Times eliminados aparecem riscados e os classificados ficam destacados em roxo.
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────
// Coluna de um lado do bracket (4 jogos de oitavas → 2 quartas, repetido 2x = 8 jogos)
// ───────────────────────────────────────────────────────────────────────────
function BracketColumnGroup({
  r16Top, r16Bot, qfTop, qfBot, getM, side,
}: {
  r16Top: BracketLeaf[]
  r16Bot: BracketLeaf[]
  qfTop: [string | null, string | null][]
  qfBot: [string | null, string | null][]
  getM: (id: string) => Match | undefined
  side: Side
}) {
  const reverse = side === "right"
  return (
    <div className={cn("flex flex-col gap-6 shrink-0", reverse && "flex-row-reverse")}>
      <div className={cn("flex items-center gap-2", reverse && "flex-row-reverse")}>
        {/* Coluna Oitavas */}
        <div className="flex flex-col gap-3 w-[170px]">
          <span className="text-center text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">Oitavas</span>
          {[...r16Top, ...r16Bot].map((leaf) => (
            <R16Card key={leaf.matchId} match={getM(leaf.matchId)} reverse={reverse} />
          ))}
        </div>

        {/* Coluna Quartas */}
        <div className="flex flex-col gap-3 w-[150px]">
          <span className="text-center text-[10px] font-bold uppercase tracking-wide text-yellow-600 dark:text-yellow-400">Quartas</span>
          <div className="flex flex-col gap-[52px]">
            {[...qfTop, ...qfBot].map(([h, a], i) => (
              <div key={i} className="flex flex-col gap-1">
                <ProjSlot teamId={h} reverse={reverse} />
                <ProjSlot teamId={a} reverse={reverse} />
              </div>
            ))}
          </div>
        </div>

        {/* Coluna Semi (placeholder) */}
        <div className="flex flex-col gap-3 w-[150px]">
          <span className="text-center text-[10px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">Semi</span>
          <div className="flex flex-col gap-[148px] mt-6">
            <ProjSlot teamId={null} reverse={reverse} />
            <ProjSlot teamId={null} reverse={reverse} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileGroup({
  title, leaves, pairs, getM,
}: {
  title: string
  leaves?: BracketLeaf[]
  pairs?: [string | null, string | null][]
  getM?: (id: string) => Match | undefined
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="grid grid-cols-2 gap-2">
        {leaves && getM && leaves.map((leaf) => (
          <div key={leaf.matchId} className="rounded-xl border border-border bg-card p-2">
            <R16Card match={getM(leaf.matchId)} />
          </div>
        ))}
        {pairs && pairs.map(([h, a], i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-2 flex flex-col gap-1">
            <FlagBox teamId={h} isWinner={!!h} />
            <FlagBox teamId={a} isWinner={!!a} />
          </div>
        ))}
      </div>
    </section>
  )
}
