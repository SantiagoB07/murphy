import { FileText, MessageCircle, Clock } from "lucide-react"
import { useTranslations } from "next-intl"
import { ProblemItem } from "./landing"

export function ProblemSection() {
  const t = useTranslations("Landing")

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <span className="text-primary font-semibold text-sm uppercase tracking-wider">
          {t("problem.badge")}
        </span>
        <h2 className="text-3xl md:text-4xl font-bold mt-2">{t("problem.title")}</h2>
      </div>

      <div className="glass-card p-6">
        <p className="text-muted-foreground italic mb-4">&quot;{t("problem.story")}&quot;</p>
        <p className="text-primary font-medium">{t("problem.question")}</p>
      </div>

      <div className="space-y-4">
        <ProblemItem
          icon={<FileText className="h-5 w-5" />}
          title={t("problem.items.tracking.title")}
          description={t("problem.items.tracking.description")}
        />
        <ProblemItem
          icon={<MessageCircle className="h-5 w-5" />}
          title={t("problem.items.communication.title")}
          description={t("problem.items.communication.description")}
        />
        <ProblemItem
          icon={<Clock className="h-5 w-5" />}
          title={t("problem.items.decisions.title")}
          description={t("problem.items.decisions.description")}
        />
      </div>
    </div>
  )
}
