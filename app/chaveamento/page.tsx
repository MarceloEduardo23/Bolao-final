"use client"

import { useMemo } from "react"
import { useStore } from "@/lib/store"
import { getTeam, flagUrl } from "@/lib/teams"
import { penaltyWinner } from "@/lib/scoring"
import type { Match } from "@/lib/matches-data"
import { Swords, Trophy, Star } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

// Mapeamento das oitavas → confrontos futuros
// Define quem o vencedor de cada jogo enfrenta nas quartas/semi/final
const BRACKET_STRUCTURE = [
  // Lado A
  {
    id: "qf-a1",
    label: "Quartas 1",
    match1: "r16-rsa-can",
    match2: "r16-bra-jpn",
  },
  {
    id: "qf-a2",
    label: "Quartas 2",
    match1: "r16-civ-nor",
    match2: "r16-bel-sen",
  },
  // Lado B
  {
    id: "qf-b1",
    label: "Quartas 3",
    match1: "r16-ger-par",
    match2: "r16-fra-swe",
  },
  {
    id: "qf-b2",
    label: "Quartas 4",
    match1: "r16-eng-cod",
    match2: "r16-usa-bih",
  },
  // Lado C
  {
    id: "qf-c1",
    label: "Quartas 5",
    match1: "r16-ned-mar",
    match2: "r16-mex-ecu",
  },
  {
    id: "qf-c2",
    label: "Quartas 6",
    match1: "r16-esp-aut",
    match2: "r16-aus-egy",
  },
  // Lado D
  {
    id: "qf-d1",
    label: "Quartas 7",
    match1: "r16-por-cro",
    match2: "r16-arg-cpv",
  },
  {
    id: "qf-d2",
    label: "Quartas 8",
    match1: "r16-sui-alg",
    match2: "r16-col-gha",
  },
]

// Retorna o vencedor de um jogo (ou null se ainda não terminou)
function getWinner(match: Match | undefined): string | null {
  if (!match || !match.finished) return null
  if (match.homeScore === null || match.awayScore === null) return null

  if (match.homeScore > match.awayScore) return match.homeId
  if (match.awayScore > match.homeScore) return match.awayId

  // Empate — verificar pênaltis
  const winner = penaltyWinner(match)
  if (winner === "home") return match.homeId
  if (winner === "away") return match.awayId
  return null
}

function TeamSlot({ teamId, isWinner }: { teamId: string | null; isWinner?: boolean }) {
  const team = teamId ? getTeam(teamId) : null

  if (!teamId) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-xl border border-dashed border-border px-2.5 text-xs text-muted-foreground">
        <div className="size-6 rounded-full bg-muted" />
        A definir
      </div>
    )
  }

  return (
    <div className={cn(
      "flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold transition-all",
      isWinner
        ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
        : "bg-secondary text-secondary-foreground"
    )}>
      <Image
        src={flagUrl(team!.code)}
        alt={team!.name}
        width={24}
        height={18}
        className="rounded-sm object-cover"
        unoptimized
      />
      <span className="truncate">{team!.name}</span>
      {isWinner && <Star className="ml-auto size-3.5 shrink-0" />}
    </div>
  )
}

function MatchSlot({
  match,
  label,
  compact = false,
}: {
  match: Match | undefined
  label: string
  compact?: boolean
}) {
  const winner = getWinner(match)
  const homeWinner = winner === match?.homeId
  const awayWinner = winner === match?.awayId

  return (
    <div className="flex flex-col gap-1">
      {!compact && (
        <div className="mb-1 flex items-center gap-1.5">
          <Swords className="size-3 text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {match?.kickoff && !match.finished && (
            <span className="text-[10px] text-muted-foreground">
              · {new Date(match.kickoff).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </span>
          )}
        </div>
      )}
      <TeamSlot teamId={match?.homeId ?? null} isWinner={homeWinner} />
      <TeamSlot teamId={match?.awayId ?? null} isWinner={awayWinner} />
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

  // Calcula vencedores e monta quartas
  const quarterFinals = useMemo(() => {
    return BRACKET_STRUCTURE.map((qf) => {
      const m1 = matchMap.get(qf.match1)
      const m2 = matchMap.get(qf.match2)
      const w1 = getWinner(m1)
      const w2 = getWinner(m2)
      return { ...qf, m1, m2, w1, w2 }
    })
  }, [matchMap])

  // Monta semis: QF[0]x[1], QF[2]x[3], QF[4]x[5], QF[6]x[7]
  const semiFinals = useMemo(() => [
    { id: "sf-a", label: "Semi 1", home: quarterFinals[0]?.w1 ?? null, away: quarterFinals[1]?.w1 ?? null, qf1: quarterFinals[0]?.label, qf2: quarterFinals[1]?.label },
    { id: "sf-b", label: "Semi 2", home: quarterFinals[2]?.w1 ?? null, away: quarterFinals[3]?.w1 ?? null, qf1: quarterFinals[2]?.label, qf2: quarterFinals[3]?.label },
    { id: "sf-c", label: "Semi 3", home: quarterFinals[4]?.w1 ?? null, away: quarterFinals[5]?.w1 ?? null, qf1: quarterFinals[4]?.label, qf2: quarterFinals[5]?.label },
    { id: "sf-d", label: "Semi 4", home: quarterFinals[6]?.w1 ?? null, away: quarterFinals[7]?.w1 ?? null, qf1: quarterFinals[6]?.label, qf2: quarterFinals[7]?.label },
  ], [quarterFinals])

  const r16Matches = useMemo(() => {
    return matches
      .filter(m => m.stage === "Oitavas")
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
  }, [matches])

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
        <h1 className="mt-2 text-2xl font-extrabold leading-tight">Chaveamento</h1>
        <p className="mt-1 text-sm text-white/85">
          Confira o caminho de cada seleção até a final. O chaveamento se atualiza automaticamente conforme os jogos encerram.
        </p>
      </section>

      {/* 16 avos */}
      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Swords className="size-4 text-amber-500" />
          16 avos de final
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {r16Matches.length === 0 && (
            <div className="col-span-2 rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Os jogos das oitavas ainda não foram carregados no banco de dados.
            </div>
          )}
          {r16Matches.map((match, i) => {
            const winner = getWinner(match)
            const homeWinner = winner === match.homeId
            const awayWinner = winner === match.awayId
            const homeTeam = getTeam(match.homeId)
            const awayTeam = getTeam(match.awayId)

            return (
              <div
                key={match.id}
                className="animate-pop-in rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-card p-3 shadow-sm"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                    16 avos
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(match.kickoff).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Home */}
                  <div className={cn("flex flex-1 items-center gap-1.5 rounded-xl p-2", homeWinner && "bg-primary/10")}>
                    <Image src={flagUrl(homeTeam.code)} alt={homeTeam.name} width={24} height={18} className="rounded-sm" unoptimized />
                    <span className={cn("text-xs font-bold truncate", homeWinner && "text-primary")}>{homeTeam.name}</span>
                    {homeWinner && <Star className="ml-auto size-3 text-primary shrink-0" />}
                  </div>

                  {/* Score */}
                  <div className="text-center shrink-0">
                    {match.finished ? (
                      <div className="flex flex-col items-center">
                        <span className="text-base font-extrabold tabular-nums">{match.homeScore} - {match.awayScore}</span>
                        {match.homePenalties !== null && (
                          <span className="text-[10px] text-muted-foreground">pen {match.homePenalties}x{match.awayPenalties}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">vs</span>
                    )}
                  </div>

                  {/* Away */}
                  <div className={cn("flex flex-1 flex-row-reverse items-center gap-1.5 rounded-xl p-2", awayWinner && "bg-primary/10")}>
                    <Image src={flagUrl(awayTeam.code)} alt={awayTeam.name} width={24} height={18} className="rounded-sm" unoptimized />
                    <span className={cn("text-xs font-bold truncate", awayWinner && "text-primary")}>{awayTeam.name}</span>
                    {awayWinner && <Star className="ml-auto size-3 text-primary shrink-0" />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Quartas de Final — vencedores projetados */}
      {quarterFinals.some(qf => qf.w1 || qf.w2) && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Trophy className="size-4 text-yellow-500" />
            Quartas de Final (Projeção)
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quarterFinals.map((qf) => (
              <div key={qf.id} className="rounded-2xl border border-yellow-200 dark:border-yellow-800/50 bg-card p-3 shadow-sm">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-yellow-600 dark:text-yellow-400">
                  {qf.label}
                </div>
                <div className="flex flex-col gap-1.5">
                  <TeamSlot teamId={qf.w1} />
                  <div className="text-center text-xs text-muted-foreground font-bold">vs</div>
                  <TeamSlot teamId={qf.w2} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Semis */}
      {semiFinals.some(sf => sf.home || sf.away) && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Star className="size-4 text-orange-500" />
            Semifinais (Projeção)
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {semiFinals.map((sf) => (
              <div key={sf.id} className="rounded-2xl border border-orange-200 dark:border-orange-800/50 bg-card p-3 shadow-sm">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                  {sf.label}
                </div>
                <div className="flex flex-col gap-1.5">
                  <TeamSlot teamId={sf.home} />
                  <div className="text-center text-xs text-muted-foreground font-bold">vs</div>
                  <TeamSlot teamId={sf.away} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Info */}
      <div className="rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground leading-relaxed">
        <p className="font-semibold text-foreground mb-1">ℹ️ Sobre o chaveamento</p>
        O chaveamento é atualizado automaticamente conforme os resultados são registrados pelo admin. Times eliminados aparecem riscados e os classificados ficam destacados.
        As quartas e semifinais mostram projeções baseadas nos vencedores atuais dos 16 avos.
      </div>
    </div>
  )
}
