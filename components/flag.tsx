import { flagUrl, getTeam } from "@/lib/teams"
import { cn } from "@/lib/utils"

interface FlagProps {
  teamId: string
  size?: number
  className?: string
}

export function Flag({ teamId, size = 28, className }: FlagProps) {
  const team = getTeam(teamId)
  return (
    <img
      src={flagUrl(team.code) || "/placeholder.svg"}
      alt={`Bandeira ${team.name}`}
      width={size}
      height={Math.round(size * 0.66)}
      loading="lazy"
      className={cn("rounded-[3px] object-cover shadow-sm ring-1 ring-border", className)}
      style={{ width: size, height: Math.round(size * 0.66) }}
    />
  )
}
