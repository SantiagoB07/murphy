import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import BaseProviders from "@/components/providers/base";

let Devtools: React.ComponentType | null = null
if (process.env.NODE_ENV === 'development') {
  const module = await import('@/lib/devtools-setup')
  Devtools = module.default
}


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "murphy",
  description: "murphy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BaseProviders>
          <div className="grid grid-rows-[auto_1fr] h-svh">
            {children}
          </div>
          {Devtools && <Devtools />}
        </BaseProviders>
      </body>
    </html>
  );
}
