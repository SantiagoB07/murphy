import { Phone, MessageCircle, Monitor } from "lucide-react"
import { useTranslations } from "next-intl"
import { StepCard, ChannelCard } from "./landing"

export function SolutionSection() {
  const t = useTranslations("Landing")

  return (
    <div id="solucion" className="space-y-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
      <div>
        <span className="text-primary font-semibold text-sm uppercase tracking-wider">
          {t("solution.badge")}
        </span>
        <h2 className="text-3xl md:text-4xl font-bold mt-2">{t("solution.title")}</h2>
      </div>

      <div className="space-y-4">
        <StepCard
          number={1}
          title={t("solution.steps.register.title")}
          description={t("solution.steps.register.description")}
        />
        <StepCard
          number={2}
          title={t("solution.steps.analysis.title")}
          description={t("solution.steps.analysis.description")}
        />
        <StepCard
          number={3}
          title={t("solution.steps.integration.title")}
          description={t("solution.steps.integration.description")}
        />
      </div>

      <div className="glass-card p-5">
        <p className="text-sm font-medium mb-3">{t("solution.channels.title")}</p>
        <div className="grid grid-cols-3 gap-3">
          <ChannelCard icon={<Phone className="h-5 w-5" />} label={t("solution.channels.calls")} />
          <ChannelCard
            icon={<MessageCircle className="h-5 w-5" />}
            label={t("solution.channels.whatsapp")}
          />
          <ChannelCard
            icon={<Monitor className="h-5 w-5" />}
            label={t("solution.channels.dashboard")}
          />
        </div>
      </div>
    </div>
  )
}
