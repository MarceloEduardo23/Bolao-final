"use client"

import { useEffect, useState } from "react"
import { StoreProvider, useStore } from "@/lib/store"
import { SiteHeader, BottomNav } from "@/components/navigation"
import { LoadingScreen } from "@/components/loading-screen"
import { Toaster } from "@/components/ui/sonner"

function Shell({ children }: { children: React.ReactNode }) {
  const { ready } = useStore()
  // garante um tempo mínimo de splash para evitar "tela preta" em hospedagens
  const [minElapsed, setMinElapsed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 900)
    return () => clearTimeout(t)
  }, [])

  if (!ready || !minElapsed) {
    return <LoadingScreen />
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <Shell>{children}</Shell>
      <Toaster position="top-center" richColors />
    </StoreProvider>
  )
}
