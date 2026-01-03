import { cn } from "@/lib/utils"

interface BenefitItemProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

export function BenefitItem({ icon, title, description, className }: BenefitItemProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  )
}
