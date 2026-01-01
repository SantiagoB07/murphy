import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import "../../index.css"
import BaseProviders from "@/components/providers/base"

let Devtools: React.ComponentType | null = null
if (process.env.NODE_ENV === "development") {
  const module = await import("@/lib/devtools-setup")
  Devtools = module.default
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "murphy",
  description: "murphy",
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <BaseProviders>
            <div className="grid grid-rows-[auto_1fr] h-svh">
              {children}
            </div>
            {Devtools && <Devtools />}
          </BaseProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
