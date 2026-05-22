import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient, type TimeOffRequest } from '@/lib/supabase'
import AdminNav from '../AdminNav'
import ApprovedClient from './ApprovedClient'

export default async function AdminApprovedPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')

  const role = (sessionClaims as Record<string, unknown> & { metadata?: { role?: string } })?.metadata?.role
  if (role !== 'admin') redirect('/dashboard')

  const supabase = createServerClient()
  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .eq('status', 'approved')
    .order('start_date', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Approved Time Off</h2>
        <ApprovedClient requests={(requests ?? []) as TimeOffRequest[]} />
      </main>
    </div>
  )
}
