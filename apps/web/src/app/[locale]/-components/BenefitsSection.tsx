"use client"

import {
  Heart,
  TrendingUp,
  AlertTriangle,
  Check,
  Activity,
  Award,
  FileText,
  Users,
  Building2,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BenefitItem } from "./landing"

export function BenefitsSection() {
  const t = useTranslations("Landing")

  return (
    <section id="beneficios" className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 animate-fade-up">
          {t("benefits.title")}
        </h2>

        <Tabs
          defaultValue="pacientes"
          className="animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="pacientes" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              {t("benefits.tabs.pacientes")}
            </TabsTrigger>
            <TabsTrigger value="medicos" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("benefits.tabs.medicos")}
            </TabsTrigger>
            <TabsTrigger value="clinicas" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t("benefits.tabs.clinicas")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pacientes" className="glass-card p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <BenefitItem
                icon={<Heart className="h-5 w-5" />}
                title={t("benefits.pacientes.support.title")}
                description={t("benefits.pacientes.support.description")}
              />
              <BenefitItem
                icon={<TrendingUp className="h-5 w-5" />}
                title={t("benefits.pacientes.education.title")}
                description={t("benefits.pacientes.education.description")}
              />
              <BenefitItem
                icon={<AlertTriangle className="h-5 w-5" />}
                title={t("benefits.pacientes.alerts.title")}
                description={t("benefits.pacientes.alerts.description")}
              />
              <BenefitItem
                icon={<Check className="h-5 w-5" />}
                title={t("benefits.pacientes.simple.title")}
                description={t("benefits.pacientes.simple.description")}
              />
            </div>
          </TabsContent>

          <TabsContent value="medicos" className="glass-card p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <BenefitItem
                icon={<TrendingUp className="h-5 w-5" />}
                title={t("benefits.medicos.visibility.title")}
                description={t("benefits.medicos.visibility.description")}
              />
              <BenefitItem
                icon={<Activity className="h-5 w-5" />}
                title={t("benefits.medicos.decisions.title")}
                description={t("benefits.medicos.decisions.description")}
              />
              <BenefitItem
                icon={<AlertTriangle className="h-5 w-5" />}
                title={t("benefits.medicos.alerts.title")}
                description={t("benefits.medicos.alerts.description")}
              />
              <BenefitItem
                icon={<Award className="h-5 w-5" />}
                title={t("benefits.medicos.professional.title")}
                description={t("benefits.medicos.professional.description")}
              />
            </div>
          </TabsContent>

          <TabsContent value="clinicas" className="glass-card p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <BenefitItem
                icon={<TrendingUp className="h-5 w-5" />}
                title={t("benefits.clinicas.indicators.title")}
                description={t("benefits.clinicas.indicators.description")}
              />
              <BenefitItem
                icon={<Activity className="h-5 w-5" />}
                title={t("benefits.clinicas.costs.title")}
                description={t("benefits.clinicas.costs.description")}
              />
              <BenefitItem
                icon={<FileText className="h-5 w-5" />}
                title={t("benefits.clinicas.data.title")}
                description={t("benefits.clinicas.data.description")}
              />
              <BenefitItem
                icon={<Users className="h-5 w-5" />}
                title={t("benefits.clinicas.scalability.title")}
                description={t("benefits.clinicas.scalability.description")}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
