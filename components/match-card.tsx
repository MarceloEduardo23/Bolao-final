"use client"

import { useState } from "react"
import { type Match } from "@/lib/matches-data"
import { canPredict, matchStatus, scorePrediction, isKnockout, penaltyWinner } from "@/lib/scoring"
import { useStore } from "@/lib/store"
import { getTeam } from "@/lib/teams"
import { Flag } from "@/components/flag"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Lock, CheckCircle2, Clock, Radio, Swords, Star, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function MatchCard({ match, index = 0 }: { match: Match; index?: number }) {
  const { currentUser, getUserPrediction, setPrediction } = useStore()
  const existing = getUserPrediction(match.id)
  const open = canPredict(match)
  const status = matchStatus(match)
  const knockout = isKnockout(match)

  const [home, setHome] = useState(existing?.home ?? 0)
  const [away, setAway] = useState(existing?.away ?? 0)
  const [homeET, setHomeET] = useState(existing?.homeET ?? 0)
  const [awayET, setAwayET] = useState(existing?.awayET ?? 0)
  const [homePen, setHomePen] = useState(existing?.homePenalties ?? 0)
  const [awayPen, setAwayPen] = useState(existing?.awayPenalties ?? 0)
  const [saving, setSaving] = useState(false)

  const locked = !open
  const home_team = getTeam(match.homeId)
  const away_team = getTeam(match.awayId)

  // Prorrogação aparece quando apostou empate nos 90' em jogo eliminatório
  const showET = knockout && home === away
  // Pênaltis aparecem quando apostou empate na prorrogação também
  const showPenalties = showET && homeET === awayET

  async function handleSave() {
    setSaving(true)
    const et_home = showET ? homeET : null
    const et_away = showET ? awayET : null
    const hp = showPenalties ? homePen : null
    const ap = showPenalties ? awayPen : null

    if (showPenalties && homePen === awayPen) {
      toast.error("Nos pênaltis, um time precisa ganhar! Ajuste os pênaltis.")
      setSaving(false)
      return
    }
    if (showET && homeET === awayET && !showPenalties) {
      // Nunca deve acontecer pois showPenalties já lida, mas salvaguarda
    }

    const res = await setPrediction(match.id, home, away, hp, ap, et_home, et_away)
    if (res.ok) {
      let desc = `${home_team.name} ${home} x ${away} ${away_team.name}`
      if (showET) desc += ` · ET: ${homeET}x${awayET}`
      if (showPenalties) desc += ` · Pen: ${homePen}x${awayPen}`
      toast.success("Palpite registrado!", { description: desc })
    } else {
      toast.error(res.error ?? "Não foi possível salvar.")
    }
    setSaving(false)
  }

  const earned = existing && match.finished ? scorePrediction(existing, match) : null

  return (
    <div
      className="animate-pop-in rounded-2xl border border-border bg-card p-4 shadow-sm"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* topo: grupo + status */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {knockout && <Swords className="size-3 text-amber-500" />}
          <span className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            knockout
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
              : "bg-secondary text-secondary-foreground"
          )}>
            {match.group}
          </span>
        </div>
        <StatusBadge status={status} kickoff={match.kickoff} />
      </div>

      {/* confronto */}
      <div className="flex items-center justify-between gap-2">
        <TeamSide name={home_team.name} teamId={match.homeId} />

        <div className="flex flex-col items-center px-1">
          {match.finished ? (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-2 text-2xl font-extrabold tabular-nums text-foreground">
                <span>{match.homeScore}</span>
                <span className="text-muted-foreground">-</span>
                <span>{match.awayScore}</span>
              </div>
              {match.homeET !== null && match.awayET !== null && (
                <div className="text-[11px] font-semibold text-blue-500">
                  ET: {match.homeET} x {match.awayET}
                </div>
              )}
              {match.homePenalties !== null && match.awayPenalties !== null && (
                <div className="text-[11px] font-semibold text-muted-foreground">
                  pen: {match.homePenalties} x {match.awayPenalties}
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              VS
            </span>
          )}
        </div>

        <TeamSide name={away_team.name} teamId={match.awayId} reverse />
      </div>

      {/* área de palpite */}
      <div className="mt-4 border-t border-dashed border-border pt-3">
        {!currentUser ? (
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground transition-transform active:scale-[0.98]"
          >
            <Lock className="size-4" />
            Entre para palpitar
          </Link>
        ) : locked ? (
          <LockedView
            existing={existing ? {
              home: existing.home, away: existing.away,
              homeET: existing.homeET, awayET: existing.awayET,
              homePenalties: existing.homePenalties, awayPenalties: existing.awayPenalties,
            } : null}
            finished={match.finished}
            earned={earned}
            started={!open && !existing}
            knockout={knockout}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {/* Palpite 90' */}
            <p className="text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {knockout ? "Placar nos 90 minutos" : "Placar final"}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Stepper value={home} onChange={setHome} label={home_team.name} dark />
              <span className="pb-6 text-lg font-bold text-muted-foreground">x</span>
              <Stepper value={away} onChange={setAway} label={away_team.name} dark />
            </div>

            {/* Prorrogação */}
            {showET && (
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
                <p className="mb-2 text-center text-xs font-bold text-foreground">
                  ⏱️ Empate → placar na prorrogação?
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Stepper value={homeET} onChange={setHomeET} label={home_team.name} min={0} />
                  <span className="pb-6 text-sm font-bold text-muted-foreground">ET</span>
                  <Stepper value={awayET} onChange={setAwayET} label={away_team.name} min={0} />
                </div>
                {homeET === awayET && (
                  <p className="mt-1 text-center text-[11px] text-blue-600 dark:text-blue-400">
                    Empatou na ET → defina quem vence nos pênaltis abaixo
                  </p>
                )}
              </div>
            )}

            {/* Pênaltis */}
            {showPenalties && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                <p className="mb-2 text-center text-xs font-bold text-amber-700 dark:text-amber-400">
                  ⚽ Placar nos pênaltis
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Stepper value={homePen} onChange={setHomePen} label={home_team.name} min={0} />
                  <span className="pb-6 text-sm font-bold text-muted-foreground">pen</span>
                  <Stepper value={awayPen} onChange={setAwayPen} label={away_team.name} min={0} />
                </div>
                {homePen === awayPen && homePen > 0 && (
                  <p className="mt-1 text-center text-xs text-red-500">Pênaltis não podem empatar!</p>
                )}
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-bold">
              {existing ? "Atualizar palpite" : "Confirmar palpite"}
            </Button>

            {knockout && (
              <p className="text-center text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                🏆 Fase eliminatória — placar exato + prorrogação + pênaltis vale até 22 pts!
              </p>
            )}
            {!knockout && (
              <p className="text-center text-xs text-muted-foreground">
                Você pode editar seu palpite até o jogo começar.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TeamSide({ name, teamId, reverse = false }: { name: string; teamId: string; reverse?: boolean }) {
  return (
    <div className={cn("flex flex-1 items-center gap-2", reverse ? "flex-row-reverse text-right" : "text-left")}>
      <Flag teamId={teamId} size={40} />
      <span className="text-sm font-bold leading-tight text-foreground">{name}</span>
    </div>
  )
}

function StatusBadge({ status, kickoff }: { status: "upcoming" | "live" | "finished"; kickoff: string }) {
  if (status === "finished") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-primary">
        <CheckCircle2 className="size-3.5" />
        Encerrado
      </span>
    )
  }
  if (status === "live") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
        <Radio className="size-3.5 animate-pulse" />
        Em andamento
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <Clock className="size-3.5" />
      {fmtTime(kickoff)}
    </span>
  )
}

function Stepper({ value, onChange, label, min = 0, dark = false }: { value: number; onChange: (v: number) => void; label: string; min?: number; dark?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground transition active:scale-90 disabled:opacity-40"
          disabled={value <= min}
        >
          <Minus className="size-4" />
        </button>
        <span className={`w-8 text-center text-2xl font-extrabold tabular-nums ${dark ? "text-white dark:text-white" : "text-gray-900 dark:text-white"}`}>{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition active:scale-90"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <span className={`max-w-[5.5rem] truncate text-center text-[11px] font-medium ${dark ? "text-white/60 dark:text-white/60" : "text-gray-700 dark:text-white/70"}`}>{label}</span>
    </div>
  )
}

function pointsLabel(pts: number): string {
  if (pts === 22) return "⭐ Gabarito Supremo +22"
  if (pts === 17) return "🔥 Empate Perfeito +17"
  if (pts === 12) return "✅ Cravou +12"
  if (pts === 5)  return "👍 Classificado +5"
  if (pts === 3)  return "Placar exato +3"
  if (pts === 1)  return "Acertou +1"
  return "0 pts"
}

function pointsColor(pts: number): string {
  if (pts === 22) return "bg-yellow-400 text-yellow-900"
  if (pts === 17) return "bg-orange-500 text-white"
  if (pts === 12) return "bg-primary text-primary-foreground"
  if (pts === 5)  return "bg-blue-500 text-white"
  if (pts === 3)  return "bg-primary text-primary-foreground"
  if (pts === 1)  return "bg-accent text-accent-foreground"
  return "bg-muted text-muted-foreground"
}

function LockedView({
  existing, finished, earned, started, knockout,
}: {
  existing: { home: number; away: number; homeET: number | null; awayET: number | null; homePenalties: number | null; awayPenalties: number | null } | null
  finished: boolean
  earned: number | null
  started: boolean
  knockout: boolean
}) {
  if (!existing) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-muted py-2.5 text-sm font-medium text-muted-foreground">
        <Lock className="size-4" />
        {started ? "Palpites encerrados" : "Sem palpite"}
      </div>
    )
  }

  let desc = `${existing.home} x ${existing.away}`
  if (existing.homeET !== null && existing.awayET !== null) desc += ` · ET: ${existing.homeET}x${existing.awayET}`
  if (existing.homePenalties !== null && existing.awayPenalties !== null) desc += ` · Pen: ${existing.homePenalties}x${existing.awayPenalties}`

  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-secondary-foreground">
        <Lock className="size-3.5" />
        Seu palpite: {desc}
      </span>
      {finished && earned !== null && (
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", pointsColor(earned))}>
          {pointsLabel(earned)}
        </span>
      )}
    </div>
  )
}
