'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TimeOffRequest } from '@/lib/supabase'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
}

type Filter = 'all' | 'pending' | 'approved' | 'denied'

export default function RequestsClient({ initialRequests }: { initialRequests: TimeOffRequest[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState<string | null>(null)

  const requests = filter === 'all' ? initialRequests : initialRequests.filter((r) => r.status === filter)

  async function handleAction(requestId: string, action: 'approved' | 'denied') {
    setLoading(requestId + action)
    try {
      const res = await fetch('/api/requests/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {(['all', 'pending', 'approved', 'denied'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
            <span className="ml-1.5 text-xs opacity-75">
              ({f === 'all' ? initialRequests.length : initialRequests.filter((r) => r.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No {filter !== 'all' ? filter : ''} requests found.</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Position</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Dates</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Days</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{req.employee_name}</td>
                    <td className="px-4 py-3 text-gray-600">{req.employee_position}</td>
                    <td className="px-4 py-3 text-gray-600">{req.reason}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {req.start_date} – {req.end_date}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{req.num_days}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[req.status]}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {req.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleAction(req.id, 'approved')}
                            disabled={loading !== null}
                            title="Approve"
                            className="w-7 h-7 flex items-center justify-center rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40 text-base"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'denied')}
                            disabled={loading !== null}
                            title="Deny"
                            className="w-7 h-7 flex items-center justify-center rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-40 text-base"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
