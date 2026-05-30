import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient, type TimeOffRequest } from '@/lib/supabase'
import RequestForm from './RequestForm'
import DashboardHeader from './DashboardHeader'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
}

export default async function Dashboard() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/sign-in')

  const role = (sessionClaims as Record<string, unknown> & { metadata?: { role?: string } })?.metadata?.role
  if (role === 'admin') redirect('/admin/requests')

  const supabase = createServerClient()
  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Submit a Time-Off Request</h2>
          <RequestForm />
        </section>

        {requests && requests.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Request History</h2>
            <div className="space-y-3">
              {(requests as TimeOffRequest[]).map((req) => (
                <div key={req.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{req.reason}</p>
                        {req.request_type === 'time_restriction' && (
                          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Restriction</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {req.request_type === 'time_restriction'
                          ? <>{req.start_date} · {req.time_start} – {req.time_end}</>
                          : <>{req.start_date} – {req.end_date} · {req.num_days} day{req.num_days !== 1 ? 's' : ''}</>
                        }
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[req.status]}`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
