import { Activity } from "lucide-react"
import { useTranslations } from "next-intl"

export function LandingFooter() {
  const t = useTranslations("Landing")

  return (
    <footer className="py-8 px-4 border-t border-border">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-primary">{t("brand.name")}</span>
        </div>
        <p className="text-muted-foreground text-sm text-center">{t("brand.tagline")}</p>
        <p className="text-muted-foreground text-sm">{t("footer.copyright")}</p>
      </div>
    </footer>
  )
}
