"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { type Match } from "@/lib/matches-data"
import { getTeam } from "@/lib/teams"
import { matchStatus } from "@/lib/scoring"
import { Flag } from "@/components/flag"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { ShieldCheck, Pencil, Trash2, Minus, Plus, Swords, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

export default function AdminPage() {
  const { currentUser, matches, users, deleteUser } = useStore()
  const router = useRouter()
  const [editing, setEditing] = useState<Match | null>(null)

  useEffect(() => {
    if (currentUser === null) {
      router.replace("/login")
    } else if (currentUser && currentUser.role !== "admin") {
      router.replace("/")
    }
  }, [currentUser, router])

  if (!currentUser || currentUser.role !== "admin") return null

  const [bonusLoading, setBonusLoading] = useState<string | null>(null)
  const [bonusMap, setBonusMap] = useState<Record<string, number>>({})
  const [seedLoading, setSeedLoading] = useState(false)

  const hasOitavas = matches.some(m => m.stage === "Oitavas")

  async function handleSeedOitavas() {
    setSeedLoading(true)
    try {
      const res = await fetch("/api/seed-oitavas", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        if (data.inserted > 0) {
          toast.success(`✅ ${data.inserted} jogos dos 16 avos inseridos! Recarregando...`)
          setTimeout(() => window.location.reload(), 1500)
        } else {
          toast.info("Os jogos dos 16 avos já estavam no banco.")
        }
      } else {
        toast.error(data.error ?? "Erro ao inserir 16 avos.")
      }
    } catch {
      toast.error("Erro de conexão.")
    } finally {
      setSeedLoading(false)
    }
  }

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, number> = {}
        for (const row of data.leaderboard ?? []) {
          map[row.id] = row.bonusPoints ?? 0
        }
        setBonusMap(map)
      })
      .catch(() => {})
  }, [])

  async function handleBonus(userId: string, delta: number) {
    setBonusLoading(userId)
    try {
      const res = await fetch(`/api/users/${userId}/bonus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      })
      const data = await res.json()
      if (res.ok) {
        setBonusMap((prev) => ({ ...prev, [userId]: data.bonusPoints }))
        toast.success(delta > 0 ? `+${delta} ponto(s) adicionado(s)!` : `${delta} ponto(s) removido(s)!`)
      } else {
        toast.error(data.error ?? "Erro ao ajustar pontos.")
      }
    } finally {
      setBonusLoading(null)
    }
  }

  const sorted = [...matches].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
  )

  return (
    <div className="flex flex-col gap-5">
      <section className="animate-slide-up rounded-3xl bg-foreground p-5 text-background">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-background/70">
          <ShieldCheck className="size-4" />
          Painel do administrador
        </div>
        <h1 className="mt-2 text-2xl font-extrabold">Gerenciar bolão</h1>
        <p className="mt-1 text-sm text-background/80">
          Edite resultados e horários dos jogos ou gerencie os participantes.
        </p>
      </section>

      <Tabs defaultValue="matches" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="matches">Jogos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        {/* Botão para inserir 16 avos */}
        {!hasOitavas && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
            <Swords className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">16 avos não carregados</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Os jogos da fase eliminatória ainda não estão no banco de dados.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSeedOitavas}
              disabled={seedLoading}
              className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {seedLoading ? <RefreshCw className="size-4 animate-spin" /> : "Carregar"}
            </Button>
          </div>
        )}

        <TabsContent value="matches" className="mt-4 flex flex-col gap-3">
          {sorted.map((m) => {
            const status = matchStatus(m)
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <div className="flex flex-1 items-center gap-2">
                  <Flag teamId={m.homeId} size={26} />
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {m.finished ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                  </span>
                  <Flag teamId={m.awayId} size={26} />
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    status === "finished" && "bg-primary text-primary-foreground",
                    status === "live" && "bg-destructive text-background",
                    status === "upcoming" && "bg-secondary text-secondary-foreground",
                  )}
                >
                  {status === "finished" ? "Encerrado" : status === "live" ? "Ao vivo" : "Agendado"}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-9 rounded-xl"
                  onClick={() => setEditing(m)}
                  aria-label="Editar jogo"
                >
                  <Pencil className="size-4" />
                </Button>
              </div>
            )
          })}
        </TabsContent>

        <TabsContent value="users" className="mt-4 flex flex-col gap-3">
          {users.map((u) => {
            const bonus = bonusMap[u.id] ?? 0
            const isLoading = bonusLoading === u.id
            return (
              <div
                key={u.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    {u.avatar && <AvatarImage src={u.avatar || "/placeholder.svg"} alt={u.name} />}
                    <AvatarFallback className="bg-secondary text-xs font-bold text-secondary-foreground">
                      {initials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {u.name}
                      {u.role === "admin" && (
                        <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                          admin
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {u.role !== "admin" && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-9 rounded-xl text-destructive hover:text-destructive"
                      onClick={() => {
                        deleteUser(u.id).then(() => toast.success(`${u.name} removido.`))
                      }}
                      aria-label="Remover usuário"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>

                {u.role !== "admin" && (
                  <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2">
                    <span className="text-xs font-semibold text-secondary-foreground">
                      Pontos bônus: <span className="text-foreground">{bonus}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isLoading || bonus <= 0}
                        onClick={() => handleBonus(u.id, -1)}
                        className="grid size-7 place-items-center rounded-full bg-muted text-muted-foreground transition active:scale-90 disabled:opacity-40"
                        aria-label="Remover 1 ponto"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleBonus(u.id, 1)}
                        className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground transition active:scale-90 disabled:opacity-40"
                        aria-label="Adicionar 1 ponto"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </TabsContent>
      </Tabs>

      <EditMatchDialog match={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function EditMatchDialog({ match, onClose }: { match: Match | null; onClose: () => void }) {
  const { updateMatch } = useStore()
  const [home, setHome] = useState(0)
  const [away, setAway] = useState(0)
  const [homePen, setHomePen] = useState<number | null>(null)
  const [awayPen, setAwayPen] = useState<number | null>(null)
  const [kickoff, setKickoff] = useState("")
  const [finished, setFinished] = useState(false)

  const knockout = match?.stage !== "Fase de Grupos"
  const showPenalties = knockout && finished && home === away

  useEffect(() => {
    if (match) {
      setHome(match.homeScore ?? 0)
      setAway(match.awayScore ?? 0)
      setHomePen(match.homePenalties ?? null)
      setAwayPen(match.awayPenalties ?? null)
      setKickoff(toLocalInput(match.kickoff))
      setFinished(match.finished)
    }
  }, [match])

  if (!match) return null
  const home_team = getTeam(match.homeId)
  const away_team = getTeam(match.awayId)

  async function handleSave() {
    if (!match) return
    await updateMatch({
      ...match,
      homeScore: finished ? home : null,
      awayScore: finished ? away : null,
      homePenalties: (finished && showPenalties) ? homePen : null,
      awayPenalties: (finished && showPenalties) ? awayPen : null,
      finished,
      kickoff: new Date(kickoff).toISOString(),
    })
    toast.success("Jogo atualizado! A classificação foi recalculada.")
    onClose()
  }

  return (
    <Dialog open={!!match} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Editar jogo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex items-center justify-center gap-3 text-sm font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Flag teamId={match.homeId} size={24} />
              {home_team.name}
            </span>
            <span className="text-muted-foreground">x</span>
            <span className="flex items-center gap-1.5">
              {away_team.name}
              <Flag teamId={match.awayId} size={24} />
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kickoff">Data e hora do jogo</Label>
            <Input
              id="kickoff"
              type="datetime-local"
              value={kickoff}
              onChange={(e) => setKickoff(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
            <span className="text-sm font-semibold text-secondary-foreground">
              Jogo encerrado
            </span>
            <button
              type="button"
              onClick={() => setFinished((f) => !f)}
              className={cn(
                "relative h-6 w-11 rounded-full transition",
                finished ? "bg-primary" : "bg-muted-foreground/30",
              )}
              aria-pressed={finished}
              aria-label="Alternar jogo encerrado"
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-card transition-transform",
                  finished ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </button>
          </div>

          {finished && (
            <div className="flex items-center justify-center gap-4">
              <ScoreStepper value={home} onChange={setHome} label={home_team.name} />
              <span className="pb-6 text-lg font-bold text-muted-foreground">x</span>
              <ScoreStepper value={away} onChange={setAway} label={away_team.name} />
            </div>
          )}

          {showPenalties && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
              <p className="mb-2 text-center text-xs font-bold text-amber-700 dark:text-amber-400">
                ⚽ Pênaltis (empate no tempo normal)
              </p>
              <div className="flex items-center justify-center gap-4">
                <ScoreStepper value={homePen ?? 0} onChange={setHomePen} label={home_team.name} />
                <span className="pb-6 text-lg font-bold text-muted-foreground">x</span>
                <ScoreStepper value={awayPen ?? 0} onChange={setAwayPen} label={away_team.name} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="rounded-xl font-bold">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ScoreStepper({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground transition active:scale-90 disabled:opacity-40"
          disabled={value <= 0}
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="size-4" />
        </button>
        <span className="w-8 text-center text-2xl font-extrabold tabular-nums text-foreground">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(20, value + 1))}
          className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition active:scale-90"
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="size-4" />
        </button>
      </div>
      <span className="max-w-[5.5rem] truncate text-center text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  )
}
