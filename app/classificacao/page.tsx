"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown, Minus, Crown, Medal, Trophy, Star, Zap } from "lucide-react"

interface LeaderRow {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  provider: string
  points: number
  exact: number
  correct: number
  total: number
  bonusPoints?: number
}

interface BonusInfo {
  id: string
  boostLabel: string | null
  boostIcon: string
  penaltyHits: number
  gapToLeader: number
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

export default function ClassificacaoPage() {
  const { currentUser } = useStore()
  const [rows, setRows] = useState<LeaderRow[]>([])
  const [bonusMap, setBonusMap] = useState<Record<string, BonusInfo>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/leaderboard").then((r) => r.json()),
      fetch("/api/bonus-auto").then((r) => r.json()),
    ])
      .then(([leaderData, bonusData]) => {
        setRows(leaderData.leaderboard ?? [])
        const map: Record<string, BonusInfo> = {}
        for (const b of bonusData.bonusInfo ?? []) {
          map[b.id] = b
        }
        setBonusMap(map)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const podium = rows.slice(0, 3)
  const rest = rows.slice(3)

  return (
    <div className="flex flex-col gap-5">
      <section className="animate-slide-up rounded-3xl bg-primary p-5 text-primary-foreground">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground/80">
          <Trophy className="size-4" />
          Classificação geral
        </div>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight">Quem manda no bolão</h1>
        <p className="mt-1 text-sm text-primary-foreground/85">
          Grupos: exato=3, vencedor=1 · Eliminatórias: +pênaltis=4
        </p>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground animate-pulse">
          Carregando classificação...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          Ainda não há participantes pontuados.
        </div>
      ) : (
        <>
          {podium.length >= 1 && (
            <Podium podium={podium} currentId={currentUser?.id} bonusMap={bonusMap} />
          )}

          <div className="flex flex-col gap-2">
            {rest.map((row, i) => {
              const pos = i + 4
              const isMe = row.id === currentUser?.id
              const bonus = bonusMap[row.id]
              return (
                <div
                  key={row.id}
                  className={cn(
                    "animate-pop-in flex items-center gap-3 rounded-2xl border bg-card p-3",
                    isMe ? "border-primary ring-1 ring-primary" : "border-border",
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex w-8 items-center justify-center">
                    <span className="text-base font-extrabold tabular-nums text-muted-foreground">
                      {pos}
                    </span>
                  </div>
                  <span className="flex items-center text-muted-foreground">
                    <Minus className="size-4" />
                  </span>
                  <Avatar className="size-10">
                    {row.avatar && <AvatarImage src={row.avatar} alt={row.name} />}
                    <AvatarFallback className="bg-secondary text-xs font-bold text-secondary-foreground">
                      {initials(row.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {row.name} {isMe && <span className="text-primary">(você)</span>}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {row.exact} exatos · {row.correct} acertos
                      </span>
                      {bonus?.penaltyHits > 0 && (
                        <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          ⚽ {bonus.penaltyHits} pen
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {bonus?.boostLabel && (
                      <span className="text-sm" title={bonus.boostLabel}>
                        {bonus.boostIcon}
                      </span>
                    )}
                    <span className="text-lg font-extrabold tabular-nums text-foreground">
                      {row.points}
                    </span>
                    <span className="text-[10px] uppercase text-muted-foreground">pts</span>
                  </div>
                </div>
              )
            })}
          </div>

          <MarioKartLegend />
          <LegendCard />
        </>
      )}
    </div>
  )
}

function Podium({ podium, currentId, bonusMap }: { podium: LeaderRow[]; currentId?: string; bonusMap: Record<string, BonusInfo> }) {
  const entries: { row: LeaderRow; place: number }[] = podium.slice(0, 3).map((row, i) => ({
    row,
    place: i + 1,
  }))

  const visualOrder: typeof entries = []
  const second = entries.find((e) => e.place === 2)
  const first = entries.find((e) => e.place === 1)
  const third = entries.find((e) => e.place === 3)
  if (second) visualOrder.push(second)
  if (first) visualOrder.push(first)
  if (third) visualOrder.push(third)

  const heightMap: Record<number, string> = { 1: "h-32", 2: "h-24", 3: "h-20" }
  const colorMap: Record<number, string> = {
    1: "bg-accent text-accent-foreground",
    2: "bg-secondary text-secondary-foreground",
    3: "bg-secondary text-secondary-foreground",
  }
  const iconMap: Record<number, typeof Crown> = { 1: Crown, 2: Medal, 3: Medal }

  return (
    <div className="flex items-end justify-center gap-2">
      {visualOrder.map(({ row, place }) => {
        const Icon = iconMap[place]
        const isMe = row.id === currentId
        const bonus = bonusMap[row.id]
        return (
          <div key={row.id} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative">
              <Avatar className={cn("size-14 ring-4", place === 1 ? "ring-accent" : "ring-secondary")}>
                {row.avatar && <AvatarImage src={row.avatar} alt={row.name} />}
                <AvatarFallback className="bg-card text-sm font-bold text-foreground">
                  {initials(row.name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -right-1 -top-2 grid size-6 place-items-center rounded-full bg-card shadow ring-1 ring-border">
                <Icon className={cn("size-3.5", place === 1 ? "text-accent" : "text-muted-foreground")} />
              </span>
            </div>
            <p className="max-w-full truncate text-center text-xs font-bold text-foreground">
              {row.name.split(" ")[0]}{isMe && " *"}
            </p>
            {bonus?.boostLabel && (
              <span className="text-xs" title={bonus.boostLabel}>{bonus.boostIcon}</span>
            )}
            <div
              className={cn(
                "flex w-full flex-col items-center justify-start rounded-t-xl pt-2 animate-bounce-in",
                heightMap[place],
                colorMap[place],
              )}
              style={{ animationDelay: `${place * 120}ms` }}
            >
              <span className="text-2xl font-extrabold leading-none">{place}º</span>
              <span className="mt-1 text-sm font-bold">{row.points} pts</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MarioKartLegend() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Zap className="size-3.5 text-yellow-500" />
        Modo Mario Kart — ícones de posição
      </p>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2"><span>⭐</span> Líder (Top 3) — na pole position</div>
        <div className="flex items-center gap-2"><span>💨</span> Boost Leve — metade do pelotão</div>
        <div className="flex items-center gap-2"><span>🔴</span> Red Shell — acelerando na cauda</div>
        <div className="flex items-center gap-2"><span>🚀</span> Turbo Foguete — lanterna, mas não desistiu!</div>
      </div>
    </div>
  )
}

function LegendCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
      <p className="mb-2 font-semibold text-foreground">Como funciona a pontuação</p>
      <ul className="flex flex-col gap-1.5">
        <li className="flex items-center gap-2">
          <span className="rounded-full bg-yellow-400 px-2 py-0.5 font-bold text-yellow-900 flex items-center gap-0.5">
            <Star className="size-2.5 inline" /> +4
          </span>
          Placar exato + acertou pênaltis (elim.)
        </li>
        <li className="flex items-center gap-2">
          <span className="rounded-full bg-primary px-2 py-0.5 font-bold text-primary-foreground">+3</span>
          Acertou o placar exato
        </li>
        <li className="flex items-center gap-2">
          <span className="rounded-full bg-blue-500 dark:bg-blue-400 px-2 py-0.5 font-bold text-white dark:text-blue-950">+2</span>
          Acertou vencedor nos pênaltis (empate apostado)
        </li>
        <li className="flex items-center gap-2">
          <span className="rounded-full bg-accent px-2 py-0.5 font-bold text-accent-foreground">+1</span>
          Acertou só o vencedor (ou empate na fase de grupos)
        </li>
        <li className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 font-bold text-muted-foreground">0</span>
          Errou o resultado
        </li>
      </ul>
    </div>
  )
}
