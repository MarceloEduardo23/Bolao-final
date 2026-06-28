"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { matchStatus } from "@/lib/scoring"
import { MatchCard } from "@/components/match-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Match } from "@/lib/matches-data"
import { CalendarDays, Swords, Users } from "lucide-react"

function sameDay(iso: string, ref: Date) {
  const d = new Date(iso)
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  )
}

function splitMatches(matches: Match[]) {
  const now = new Date()
  const sorted = [...matches].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
  )
  const today: Match[] = []
  const upcoming: Match[] = []
  const past: Match[] = []
  for (const m of sorted) {
    const status = matchStatus(m)
    if (status === "finished") {
      past.push(m)
    } else if (sameDay(m.kickoff, now)) {
      today.push(m)
    } else if (new Date(m.kickoff).getTime() > now.getTime()) {
      upcoming.push(m)
    } else {
      today.push(m)
    }
  }
  past.reverse()
  return { today, upcoming, past }
}

export default function HomePage() {
  const { matches, currentUser } = useStore()
  const [stageTab, setStageTab] = useState<"grupos" | "oitavas">("grupos")

  const grupoMatches = useMemo(() => matches.filter(m => m.stage === "Fase de Grupos"), [matches])
  const oitavasMatches = useMemo(() => matches.filter(m => m.stage === "Oitavas"), [matches])

  const hasOitavas = oitavasMatches.length > 0

  // Quando os 16 avos existirem, mudar automaticamente para a aba deles
  useMemo(() => {
    if (hasOitavas && stageTab === "grupos") {
      setStageTab("oitavas")
    }
  }, [hasOitavas])

  const gruposSplit = useMemo(() => splitMatches(grupoMatches), [grupoMatches])
  const oitavasSplit = useMemo(() => splitMatches(oitavasMatches), [oitavasMatches])

  const { today, upcoming, past } = stageTab === "oitavas" ? oitavasSplit : gruposSplit


  return (
    <div className="flex flex-col gap-5">
      {/* Hero Copa 2026 */}
      <section
        className="animate-slide-up overflow-hidden rounded-3xl p-5 text-white"
        style={{
          background: "linear-gradient(135deg, #6B22CC 0%, #9333EA 30%, #0891B2 65%, #E62E2E 100%)",
          backgroundSize: "200% 200%",
        }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
          <CalendarDays className="size-4" />
          Copa do Mundo 2026
        </div>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight text-balance">
          {currentUser ? `Bora palpitar, ${currentUser.name.split(" ")[0]}?` : "Dê seu palpite e suba na tabela"}
        </h1>
        <p className="mt-1 text-sm text-white/85 text-pretty">
          Grupos: exato=<strong>3pts</strong>, vencedor=<strong>1pt</strong> · Elim: até <strong>22pts</strong>
        </p>
      </section>

      {/* Seletor de fase */}
      {hasOitavas && (
        <div className="flex gap-2">
          <button
            onClick={() => setStageTab("oitavas")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
              stageTab === "oitavas"
                ? "bg-amber-500 text-white shadow-md"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            <Swords className="size-4" />
            16 avos
          </button>
          <button
            onClick={() => setStageTab("grupos")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
              stageTab === "grupos"
                ? "bg-secondary text-foreground ring-1 ring-border"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Users className="size-4" />
            Fase de Grupos
          </button>
        </div>
      )}

      {/* Badge de fase */}
      {stageTab === "oitavas" && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
          <Swords className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <strong>Fase eliminatória:</strong> apostas de pênaltis disponíveis! Placar exato + pênaltis vale até 4 pontos.
          </p>
        </div>
      )}

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          <TabsTrigger value="past">Anteriores</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <MatchList matches={today} empty="Nenhum jogo para hoje." />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
          <MatchList matches={upcoming} empty="Nenhum jogo futuro cadastrado." />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <MatchList matches={past} empty="Nenhum jogo anterior." />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MatchList({ matches, empty }: { matches: Match[]; empty: string }) {
  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {matches.map((m, i) => (
        <MatchCard key={m.id} match={m} index={i} />
      ))}
    </div>
  )
}
