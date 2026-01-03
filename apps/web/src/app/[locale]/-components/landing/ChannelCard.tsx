import { cn } from "@/lib/utils"

interface ChannelCardProps {
  icon: React.ReactNode
  label: string
  className?: string
}

export function ChannelCard({ icon, label, className }: ChannelCardProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 p-3 rounded-lg bg-background/50", className)}>
      <div className="text-primary">{icon}</div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
