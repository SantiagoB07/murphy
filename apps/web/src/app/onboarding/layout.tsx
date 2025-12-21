import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /* const session = await auth()
  if (!session.isAuthenticated) {
    redirect('/')
  }
  if (session.sessionClaims?.metadata.role) {
    redirect('/')
  } */

  return <>{children}</>
}

