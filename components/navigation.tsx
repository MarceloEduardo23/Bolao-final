"use client"

import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { CalendarDays, Trophy, ShieldCheck, UserRound, LogIn, Swords } from "lucide-react"

const NAV = [
  { href: "/", label: "Jogos", icon: CalendarDays },
  { href: "/chaveamento", label: "Chave", icon: Swords },
  { href: "/classificacao", label: "Tabela", icon: Trophy },
  { href: "/conta", label: "Conta", icon: UserRound },
]

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

export function SiteHeader() {
  const { currentUser } = useStore()
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          {/* Logo visível no tema light (fundo branco) */}
          <Image
            src="/Logo.png"
            alt="Bolão da Copa"
            width={32}
            height={32}
            className="size-8 object-contain dark:hidden"
            priority
          />
          {/* Logo visível no tema dark (fundo preto) — usa filter para inverter */}
          <Image
            src="/Logo.png"
            alt="Bolão da Copa"
            width={32}
            height={32}
            className="size-8 object-contain hidden dark:block dark:invert"
            priority
          />
          <span className="text-base font-extrabold tracking-tight text-foreground">
            Bolão da Copa
          </span>
        </Link>
        {currentUser ? (
          <Link href="/conta" className="flex items-center gap-2">
            {currentUser.role === "admin" && (
              <span className="hidden rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground sm:inline">
                Admin
              </span>
            )}
            <Avatar className="size-8 ring-2 ring-primary/30">
              {currentUser.avatar && (
                <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
              )}
              <AvatarFallback className="bg-secondary text-xs font-bold text-secondary-foreground">
                {initials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            <LogIn className="size-4" />
            Entrar
          </Link>
        )}
      </div>
    </header>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const { currentUser } = useStore()
  const items = [...NAV]
  if (currentUser?.role === "admin") {
    items.push({ href: "/admin", label: "Admin", icon: ShieldCheck })
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform",
                  active && "scale-110",
                )}
              />
              <span>{item.label}</span>
              {active && (
                <span className="absolute -top-px h-1 w-8 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
