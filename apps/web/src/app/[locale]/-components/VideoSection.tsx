import { useTranslations } from "next-intl"
import { StatCard } from "./landing"

export function VideoSection() {
  const t = useTranslations("Landing")

  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12 animate-fade-up">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            {t("video.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {t("video.title")}{" "}
            <span className="text-primary">{t("video.titleHighlight")}</span>
          </h2>

          {/* Video Embed */}
          <div
            className="glass-card p-2 rounded-2xl mb-12 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="aspect-video rounded-xl overflow-hidden">
              <iframe
                src="https://www.youtube.com/embed/gZUBpbIfQrI"
                title="Murphy - Somos Murphy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("video.description")}
          </p>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          <StatCard value={t("stats.population")} label={t("stats.populationLabel")} />
          <StatCard value={t("stats.patients")} label={t("stats.patientsLabel")} />
          <StatCard value={t("stats.support")} label={t("stats.supportLabel")} />
        </div>
      </div>
    </section>
  )
}
