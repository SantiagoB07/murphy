"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations, useLocale } from "next-intl"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { DiabetesType } from "@/types/diabetes"
import { toast } from "sonner"

interface PersonalDataSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock user data - will be replaced with Convex data
const mockUserData = {
  name: "Carlos Martinez",
  email: "carlos@example.com",
  phone: "+52 555 123 4567",
  birthDate: new Date("1990-05-15"),
  diabetesType: "Tipo 1" as DiabetesType,
}

export function PersonalDataSheet({ open, onOpenChange }: PersonalDataSheetProps) {
  const t = useTranslations("Configuracion")
  const locale = useLocale()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dateFnsLocale = locale === "es" ? es : enUS

  const DIABETES_TYPES: DiabetesType[] = ["Tipo 1", "Tipo 2", "Gestacional", "LADA", "MODY"]

  const formSchema = z.object({
    name: z.string().min(2, t("personalData.validation.nameMinLength")),
    email: z.string().email(t("personalData.validation.emailInvalid")),
    phone: z.string().optional(),
    birthDate: z.date({ error: t("personalData.validation.birthDateRequired") }),
    diabetesType: z.enum(["Tipo 1", "Tipo 2", "Gestacional", "LADA", "MODY"]),
  })

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: mockUserData.name,
      email: mockUserData.email,
      phone: mockUserData.phone,
      birthDate: mockUserData.birthDate,
      diabetesType: mockUserData.diabetesType,
    },
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Saving personal data:", data)
      toast.success(t("personalData.toast.successTitle"), {
        description: t("personalData.toast.successMessage"),
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(t("personalData.toast.errorTitle"), {
        description: t("personalData.toast.errorMessage"),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("personalData.sheet.title")}</SheetTitle>
          <SheetDescription>
            {t("personalData.sheet.description")}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalData.form.nameLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("personalData.form.namePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalData.form.emailLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("personalData.form.emailPlaceholder")}
                      {...field}
                      disabled
                      className="bg-muted"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t("personalData.form.emailDisabled")}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalData.form.phoneLabel")}</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder={t("personalData.form.phonePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t("personalData.form.birthDateLabel")}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: dateFnsLocale })
                          ) : (
                            <span>{t("personalData.form.selectDate")}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diabetesType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("personalData.form.diabetesTypeLabel")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("personalData.form.selectType")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DIABETES_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`personalData.diabetesTypes.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                {t("personalData.form.cancel")}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? t("personalData.form.saving") : t("personalData.form.save")}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
