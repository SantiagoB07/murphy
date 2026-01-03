import { cn } from "@/lib/utils"

interface StepCardProps {
  number: number
  title: string
  description: string
  className?: string
}

export function StepCard({ number, title, description, className }: StepCardProps) {
  return (
    <div className={cn("glass-card p-5 flex items-start gap-4", className)}>
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
        {number}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  )
}
