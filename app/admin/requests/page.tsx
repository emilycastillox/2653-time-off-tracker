import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient, type TimeOffRequest } from '@/lib/supabase'
import AdminNav from '../AdminNav'
import RequestsClient from './RequestsClient'

export default async function AdminRequestsPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')

  const role = (sessionClaims as Record<string, unknown> & { metadata?: { role?: string } })?.metadata?.role
  if (role !== 'admin') redirect('/dashboard')

  const supabase = createServerClient()
  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">All Time-Off Requests</h2>
        <RequestsClient initialRequests={(requests ?? []) as TimeOffRequest[]} />
      </main>
    </div>
  )
}
