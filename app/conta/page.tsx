"use client"

import { useEffect, useRef, useState } from "react"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Camera, LogOut, Trophy, Target, Crosshair } from "lucide-react"

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()
}

export default function ContaPage() {
  const { currentUser, updateProfile, logout } = useStore()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!currentUser) router.replace("/login")
    else setName(currentUser.name)
  }, [currentUser, router])

  const [stats, setStats] = useState<{ position: number | null; points: number; exact: number; correct: number } | null>(null)

  useEffect(() => {
    if (!currentUser) return
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        const rows: { id: string; points: number; exact: number; correct: number }[] = data.leaderboard ?? []
        const idx = rows.findIndex((r) => r.id === currentUser.id)
        if (idx < 0) {
          setStats({ position: null, points: 0, exact: 0, correct: 0 })
        } else {
          const me = rows[idx]
          setStats({ position: idx + 1, points: me.points, exact: me.exact, correct: me.correct })
        }
      })
      .catch(() => {})
  }, [currentUser])

  if (!currentUser) return null

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error("A imagem deve ter no máximo 2MB."); return }
    const reader = new FileReader()
    reader.onload = async () => {
      await updateProfile({ avatar: reader.result as string })
      toast.success("Foto atualizada!")
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("O nome não pode ficar vazio."); return }
    setSaving(true)
    const data: { name: string; password?: string } = { name: name.trim() }
    if (password) data.password = password
    await updateProfile(data)
    setPassword("")
    toast.success("Perfil atualizado!")
    setSaving(false)
  }

  async function handleLogout() {
    await logout()
    toast.success("Você saiu da conta.")
    router.push("/login")
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="animate-pop-in flex flex-col items-center gap-3 rounded-3xl bg-primary p-6 text-primary-foreground">
        <div className="relative">
          <Avatar className="size-24 ring-4 ring-primary-foreground/30">
            {currentUser.avatar && (
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            )}
            <AvatarFallback className="bg-card text-2xl font-bold text-foreground">
              {initials(currentUser.name)}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full bg-accent text-accent-foreground shadow-md ring-2 ring-primary transition active:scale-90"
            aria-label="Trocar foto"
          >
            <Camera className="size-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-extrabold">{currentUser.name}</h1>
          <p className="text-sm text-primary-foreground/80">{currentUser.email}</p>
        </div>
      </section>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Trophy className="size-4" />} label="Posição" value={stats.position ? `${stats.position}º` : "-"} />
          <StatCard icon={<Target className="size-4" />} label="Pontos" value={String(stats.points)} />
          <StatCard icon={<Crosshair className="size-4" />} label="Exatos" value={String(stats.exact)} />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-base font-bold text-foreground">Gerenciar conta</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe em branco para manter"
              className="rounded-xl"
              disabled={currentUser.provider === "google"}
            />
            {currentUser.provider === "google" && (
              <p className="text-xs text-muted-foreground">Conta Google não usa senha.</p>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl font-bold">
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>

      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full rounded-xl font-semibold text-destructive hover:text-destructive"
      >
        <LogOut className="size-4" />
        Sair da conta
      </Button>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-3">
      <span className="grid size-8 place-items-center rounded-full bg-secondary text-secondary-foreground">{icon}</span>
      <span className="text-lg font-extrabold tabular-nums text-foreground">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}
