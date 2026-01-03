"use client"

import { Calendar as CalendarIcon, Check, MessageCircle } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDemoForm } from "./useDemoForm"

export function DemoFormSection() {
  const t = useTranslations("Landing.demoForm")
  const locale = useLocale()
  const dateLocale = locale === "es" ? es : enUS

  const { form, isPending, isSuccess } = useDemoForm({
    validation: {
      nombreRequired: t("validation.nombreRequired"),
      tipoUsuarioRequired: t("validation.tipoUsuarioRequired"),
      celularRequired: t("validation.celularRequired"),
      emailRequired: t("validation.emailRequired"),
      emailInvalid: t("validation.emailInvalid"),
    },
    success: {
      title: t("success.title"),
    },
    error: t("error"),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  if (isSuccess) {
    return (
      <section
        id="contacto"
        className="py-20 px-4 bg-gradient-to-br from-primary/20 via-primary/10 to-background"
      >
        <div className="container mx-auto max-w-2xl animate-fade-up">
          <div className="glass-card p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">{t("success.title")}</h3>
              <p className="text-muted-foreground">{t("success.message")}</p>
            </div>
            <Button asChild size="lg" className="btn-neon">
              <a href="https://wa.me/573045818587" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                {t("success.whatsappButton")}
              </a>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      id="contacto"
      className="py-20 px-4 bg-gradient-to-br from-primary/20 via-primary/10 to-background"
    >
      <div className="container mx-auto max-w-2xl animate-fade-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
          {/* Nombre */}
          <form.Field
            name="nombre"
            validators={{
              onChange: ({ value }) => (!value ? t("validation.nombreRequired") : undefined),
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{t("fields.nombre")} *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder={t("fields.nombrePlaceholder")}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={isPending}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Tipo de Usuario */}
          <form.Field
            name="tipoUsuario"
            validators={{
              onChange: ({ value }) => (!value ? t("validation.tipoUsuarioRequired") : undefined),
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{t("fields.tipoUsuario")} *</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as "" | "paciente" | "coadministrador" | "medico")
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder={t("fields.tipoUsuarioPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paciente">
                      {t("fields.tipoUsuarioOptions.paciente")}
                    </SelectItem>
                    <SelectItem value="coadministrador">
                      {t("fields.tipoUsuarioOptions.coadministrador")}
                    </SelectItem>
                    <SelectItem value="medico">{t("fields.tipoUsuarioOptions.medico")}</SelectItem>
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Celular */}
          <form.Field
            name="celular"
            validators={{
              onChange: ({ value }) => (!value ? t("validation.celularRequired") : undefined),
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{t("fields.celular")} *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="tel"
                  placeholder={t("fields.celularPlaceholder")}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={isPending}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Email */}
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!value) return t("validation.emailRequired")
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t("validation.emailInvalid")
                return undefined
              },
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{t("fields.email")} *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder={t("fields.emailPlaceholder")}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={isPending}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Fecha y Hora de contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fecha de contacto */}
            <form.Field name="fechaContacto">
              {(field) => (
                <div className="space-y-2">
                  <Label>{t("fields.fechaContacto")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={isPending}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.state.value
                          ? format(new Date(field.state.value), "PPP", { locale: dateLocale })
                          : t("fields.fechaContactoPlaceholder")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.state.value ? new Date(field.state.value) : undefined}
                        onSelect={(date) =>
                          field.handleChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        disabled={(date) => date < new Date()}
                        locale={dateLocale}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </form.Field>

            {/* Hora de contacto */}
            <form.Field name="horaContacto">
              {(field) => (
                <div className="space-y-2">
                  <Label>{t("fields.horaContacto")}</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("fields.horaContactoPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00">{t("fields.horaOptions.09:00")}</SelectItem>
                      <SelectItem value="10:00">{t("fields.horaOptions.10:00")}</SelectItem>
                      <SelectItem value="11:00">{t("fields.horaOptions.11:00")}</SelectItem>
                      <SelectItem value="12:00">{t("fields.horaOptions.12:00")}</SelectItem>
                      <SelectItem value="14:00">{t("fields.horaOptions.14:00")}</SelectItem>
                      <SelectItem value="15:00">{t("fields.horaOptions.15:00")}</SelectItem>
                      <SelectItem value="16:00">{t("fields.horaOptions.16:00")}</SelectItem>
                      <SelectItem value="17:00">{t("fields.horaOptions.17:00")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          <Button type="submit" size="lg" className="btn-neon w-full" disabled={isPending}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </div>
    </section>
  )
}
