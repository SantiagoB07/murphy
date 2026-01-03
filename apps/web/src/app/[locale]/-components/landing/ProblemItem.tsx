import { cn } from "@/lib/utils"

interface ProblemItemProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

export function ProblemItem({ icon, title, description, className }: ProblemItemProps) {
  return (
    <div className={cn("flex items-start gap-4", className)}>
      <div className="p-2 rounded-lg bg-destructive/10 text-destructive shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  )
}
