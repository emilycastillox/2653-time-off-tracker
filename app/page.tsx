import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const role = (sessionClaims as Record<string, unknown> & { metadata?: { role?: string } })?.metadata?.role

  if (role === 'admin') {
    redirect('/admin/requests')
  }

  redirect('/dashboard')
}
