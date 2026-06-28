"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Trophy, Mail, Lock, User as UserIcon } from "lucide-react"

export default function LoginPage() {
  const { login, register, currentUser } = useStore()
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentUser) router.replace("/conta")
  }, [currentUser, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res =
      mode === "login"
        ? await login(email, password)
        : await register(name.trim(), email.trim(), password)
    if (res.ok) {
      toast.success(mode === "login" ? "Bem-vindo de volta!" : "Conta criada com sucesso!")
      router.push("/")
    } else {
      toast.error(res.error ?? "Algo deu errado.")
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-6 pt-6">
      <div className="flex flex-col items-center gap-2 text-center animate-pop-in">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Trophy className="size-7" />
        </span>
        <h1 className="text-2xl font-extrabold text-foreground">Bolão da Copa 2026</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          {mode === "login" ? "Entre para registrar seus palpites" : "Crie sua conta e comece a palpitar"}
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
        <button
          onClick={() => setMode("login")}
          className={`rounded-xl py-2 text-sm font-bold transition ${
            mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Entrar
        </button>
        <button
          onClick={() => setMode("register")}
          className={`rounded-xl py-2 text-sm font-bold transition ${
            mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          Cadastrar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        {mode === "register" && (
          <Field
            id="name"
            label="Nome"
            icon={<UserIcon className="size-4" />}
            value={name}
            onChange={setName}
            placeholder="Seu nome"
            required
          />
        )}
        <Field
          id="email"
          label="E-mail"
          type="email"
          icon={<Mail className="size-4" />}
          value={email}
          onChange={setEmail}
          placeholder="voce@email.com"
          required
        />
        <Field
          id="password"
          label="Senha"
          type="password"
          icon={<Lock className="size-4" />}
          value={password}
          onChange={setPassword}
          placeholder="••••••"
          required
        />

        <Button type="submit" disabled={loading} className="mt-1 w-full rounded-xl font-bold">
          {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar conta"}
        </Button>
      </form>


    </div>
  )
}

function Field({
  id, label, icon, value, onChange, type = "text", placeholder, required,
}: {
  id: string; label: string; icon: React.ReactNode; value: string
  onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="rounded-xl pl-9"
        />
      </div>
    </div>
  )
}


