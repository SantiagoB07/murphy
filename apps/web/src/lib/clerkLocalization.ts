import { esES, enUS } from "@clerk/localizations"

// Map next-intl locales to Clerk localizations
export const clerkLocalizations = {
  es: esES,
  en: enUS,
} as const

export type AppLocale = keyof typeof clerkLocalizations

export function getClerkLocalization(locale: string) {
  return clerkLocalizations[locale as AppLocale] ?? esES
}
