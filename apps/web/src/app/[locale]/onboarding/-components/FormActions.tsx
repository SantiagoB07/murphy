import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormActionsProps {
  onReset: () => void
  isLoading?: boolean
}

export function FormActions({ onReset, isLoading = false }: FormActionsProps) {
  return (
    <div className="flex justify-center pt-4">
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "btn-neon flex items-center gap-2 px-8 py-4 text-hig-lg focus-ring",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            Comenzar
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  )
}
