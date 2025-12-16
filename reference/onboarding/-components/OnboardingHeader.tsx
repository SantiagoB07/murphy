import { SparklesIcon } from "lucide-react"

export function OnboardingHeader() {
  return (
    <div className="mb-8 text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-2 text-white shadow-lg">
        <SparklesIcon className="size-5" />
        <span className="font-semibold">Welcome to Lieou</span>
      </div>
      <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">
        Let&apos;s get started
      </h1>
      <p className="text-muted-foreground text-lg">
        Discover amazing places or share your business with explorers
      </p>
    </div>
  )
}

