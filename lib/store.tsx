"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { Match } from "./matches-data"
import type { Prediction, User } from "./scoring"

interface StoreState {
  ready: boolean
  users: User[]
  matches: Match[]
  predictions: Prediction[]
  currentUser: User | null
  token: string | null
}

interface StoreContextValue extends StoreState {
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  loginWithGoogle: () => void
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  setPrediction: (matchId: string, home: number, away: number, homePenalties?: number | null, awayPenalties?: number | null) => Promise<{ ok: boolean; error?: string }>
  getUserPrediction: (matchId: string) => Prediction | undefined
  updateProfile: (data: Partial<Pick<User, "name" | "avatar" | "password">>) => Promise<void>
  refreshMatches: () => Promise<void>
  updateMatchResult: (matchId: string, home: number, away: number) => Promise<void>
  setMatchFinished: (matchId: string, finished: boolean) => Promise<void>
  updateMatch: (match: Match) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
}

const StoreContext = createContext<StoreContextValue | null>(null)

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("bolao_token")
}

function setStoredToken(t: string | null) {
  if (typeof window === "undefined") return
  if (t) localStorage.setItem("bolao_token", t)
  else localStorage.removeItem("bolao_token")
}

async function apiFetch(path: string, options: RequestInit = {}, token?: string | null): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  const tok = token ?? getStoredToken()
  if (tok) headers["Authorization"] = `Bearer ${tok}`
  return fetch(path, { ...options, headers })
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>({
    ready: false,
    users: [],
    matches: [],
    predictions: [],
    currentUser: null,
    token: null,
  })
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    async function init() {
      const token = getStoredToken()
      const [matchesRes, meRes] = await Promise.all([
        apiFetch("/api/matches", {}, token),
        apiFetch("/api/auth/me", {}, token),
      ])
      const matchesData = matchesRes.ok ? await matchesRes.json() : { matches: [] }
      const meData = meRes.ok ? await meRes.json() : { user: null }
      let predictions: Prediction[] = []
      let users: User[] = []
      if (meData.user) {
        const [predRes, usersRes] = await Promise.all([
          apiFetch("/api/predictions", {}, token),
          meData.user.role === "admin"
            ? apiFetch("/api/users", {}, token)
            : Promise.resolve(new Response(JSON.stringify({ users: [] }))),
        ])
        if (predRes.ok) predictions = (await predRes.json()).predictions ?? []
        if (usersRes.ok) users = (await usersRes.json()).users ?? []
      }
      setState({
        ready: true,
        matches: matchesData.matches ?? [],
        currentUser: meData.user ? { ...meData.user, password: "" } : null,
        token,
        predictions,
        users,
      })
    }
    init()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error ?? "Erro ao entrar." }
    setStoredToken(data.token)
    const [predRes, usersRes] = await Promise.all([
      apiFetch("/api/predictions", {}, data.token),
      data.role === "admin" ? apiFetch("/api/users", {}, data.token) : Promise.resolve(new Response(JSON.stringify({ users: [] }))),
    ])
    const predictions = predRes.ok ? (await predRes.json()).predictions ?? [] : []
    const users = usersRes.ok ? (await usersRes.json()).users ?? [] : []
    setState((s) => ({
      ...s,
      currentUser: { id: data.id, name: data.name, email: data.email, role: data.role, avatar: data.avatar, provider: data.provider, password: "" },
      token: data.token,
      predictions,
      users,
    }))
    return { ok: true }
  }, [])

  const loginWithGoogle = useCallback(() => {
    alert("OAuth Google requer configuração: adicione GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env e integre NextAuth / Auth.js.")
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error ?? "Erro ao cadastrar." }
    setStoredToken(data.token)
    setState((s) => ({
      ...s,
      currentUser: { id: data.id, name: data.name, email: data.email, role: data.role, avatar: data.avatar, provider: data.provider, password: "" },
      token: data.token,
      predictions: [],
    }))
    return { ok: true }
  }, [])

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/logout", { method: "POST" })
    setStoredToken(null)
    setState((s) => ({ ...s, currentUser: null, token: null, predictions: [], users: [] }))
  }, [])

  const getUserPrediction = useCallback((matchId: string): Prediction | undefined => {
    return state.predictions.find((p) => p.matchId === matchId)
  }, [state.predictions])

  const setPrediction = useCallback(async (matchId: string, home: number, away: number, homePenalties?: number | null, awayPenalties?: number | null) => {
    if (!state.currentUser) return { ok: false, error: "Você precisa estar logado." }
    const res = await apiFetch("/api/predictions", { method: "POST", body: JSON.stringify({ matchId, home, away, homePenalties: homePenalties ?? null, awayPenalties: awayPenalties ?? null }) }, state.token)
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error ?? "Não foi possível salvar." }
    const newPred = { matchId, userId: state.currentUser.id, home, away, homePenalties: homePenalties ?? null, awayPenalties: awayPenalties ?? null, createdAt: new Date().toISOString() }
    setState((s) => ({ ...s, predictions: [...s.predictions.filter(p => p.matchId !== matchId || p.userId !== state.currentUser!.id), newPred] }))
    return { ok: true }
  }, [state.currentUser, state.token])

  const updateProfile = useCallback(async (data: Partial<Pick<User, "name" | "avatar" | "password">>) => {
    const res = await apiFetch("/api/users", { method: "PATCH", body: JSON.stringify(data) }, state.token)
    if (!res.ok) return
    const json = await res.json()
    setState((s) => ({ ...s, currentUser: s.currentUser ? { ...s.currentUser, ...json.user } : null }))
  }, [state.token])

  const refreshMatches = useCallback(async () => {
    const res = await apiFetch("/api/matches", {}, state.token)
    if (!res.ok) return
    const data = await res.json()
    setState((s) => ({ ...s, matches: data.matches ?? [] }))
  }, [state.token])

  const updateMatch = useCallback(async (match: Match) => {
    await apiFetch("/api/matches", {
      method: "PATCH",
      body: JSON.stringify({ id: match.id, homeScore: match.homeScore, awayScore: match.awayScore, finished: match.finished, kickoff: match.kickoff, homePenalties: match.homePenalties ?? null, awayPenalties: match.awayPenalties ?? null }),
    }, state.token)
    setState((s) => ({ ...s, matches: s.matches.map((m) => (m.id === match.id ? match : m)) }))
  }, [state.token])

  const updateMatchResult = useCallback(async (matchId: string, home: number, away: number) => {
    const match = state.matches.find((m) => m.id === matchId)
    if (!match) return
    await updateMatch({ ...match, homeScore: home, awayScore: away, finished: true })
  }, [state.matches, updateMatch])

  const setMatchFinished = useCallback(async (matchId: string, finished: boolean) => {
    const match = state.matches.find((m) => m.id === matchId)
    if (!match) return
    await updateMatch({ ...match, finished })
  }, [state.matches, updateMatch])

  const deleteUser = useCallback(async (userId: string) => {
    await apiFetch(`/api/users/${userId}`, { method: "DELETE" }, state.token)
    setState((s) => ({ ...s, users: s.users.filter((u) => u.id !== userId) }))
  }, [state.token])

  const value = useMemo<StoreContextValue>(() => ({
    ...state,
    login,
    loginWithGoogle,
    register,
    logout,
    setPrediction,
    getUserPrediction,
    updateProfile,
    refreshMatches,
    updateMatchResult,
    setMatchFinished,
    updateMatch,
    deleteUser,
  }), [state, login, loginWithGoogle, register, logout, setPrediction, getUserPrediction, updateProfile, refreshMatches, updateMatchResult, setMatchFinished, updateMatch, deleteUser])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider")
  return ctx
}
