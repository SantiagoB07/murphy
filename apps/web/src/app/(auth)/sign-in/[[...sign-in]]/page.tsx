import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center gap-8 animate-fade-up">
      {/* Logo/branding section */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold glow-text">Murphy</h1>
        <p className="text-muted-foreground">Tu asistente de diabetes</p>
      </div>
      
      <SignIn 
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "glass-card p-8",
          }
        }}
      />
    </div>
  )
}
