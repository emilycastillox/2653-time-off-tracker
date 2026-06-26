'use client'

import { useState } from 'react'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { TimeOffRequest } from '@/lib/supabase'
import TimePicker, { type TimeVal, formatTime, parseTime } from '@/app/components/TimePicker'

const REASONS = [
  'Vacation',
  'Personal',
  'Medical / Sick Leave',
  'Family Emergency',
  'Bereavement',
  'Other',
]

type RequestType = 'time_off' | 'time_restriction'

export default function TimeOffModal({
  mode,
  prefillDate,
  request,
  onClose,
  onSaved,
}: {
  mode: 'add' | 'edit'
  prefillDate?: string
  request?: TimeOffRequest
  onClose: () => void
  onSaved: () => void
}) {
  const [requestType, setRequestType] = useState<RequestType>(request?.request_type ?? 'time_off')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    employee_name: request?.employee_name ?? '',
    employee_id: request?.employee_id ?? '',
    reason: request?.reason ?? '',
    start_date: request?.start_date ?? prefillDate ?? '',
    end_date: request?.end_date ?? prefillDate ?? '',
    num_days: request ? String(request.num_days) : '',
    restriction_date: request?.start_date ?? prefillDate ?? '',
  })

  const [timeStart, setTimeStart] = useState<TimeVal>(parseTime(request?.time_start, { hour: '9', minute: '00', ampm: 'AM' }))
  const [timeEnd, setTimeEnd] = useState<TimeVal>(parseTime(request?.time_end, { hour: '5', minute: '00', ampm: 'PM' }))

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(f => {
      const next = { ...f, [name]: value }
      if (name === 'start_date' || name === 'end_date') {
        const start = name === 'start_date' ? value : f.start_date
        const end = name === 'end_date' ? value : f.end_date
        if (start && end) {
          const days = differenceInCalendarDays(parseISO(end), parseISO(start)) + 1
          if (days > 0) next.num_days = String(days)
        }
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const isRestriction = requestType === 'time_restriction'
    const payload = isRestriction
      ? {
          employee_name: form.employee_name,
          employee_id: form.employee_id || null,
          request_type: 'time_restriction',
          reason: form.reason,
          start_date: form.restriction_date,
          end_date: form.restriction_date,
          num_days: 1,
          time_start: formatTime(timeStart),
          time_end: formatTime(timeEnd),
        }
      : {
          employee_name: form.employee_name,
          employee_id: form.employee_id || null,
          request_type: 'time_off',
          reason: form.reason,
          start_date: form.start_date,
          end_date: form.end_date,
          num_days: parseInt(form.num_days, 10),
          time_start: null,
          time_end: null,
        }

    const url = mode === 'add' ? '/api/requests/admin' : `/api/requests/${request!.id}`
    const method = mode === 'add' ? 'POST' : 'PATCH'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.text()) || 'Save failed')
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!request) return
    if (!confirm(`Delete this approved time off for ${request.employee_name}? This cannot be undone.`)) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/requests/${request.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.text()) || 'Delete failed')
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const busy = submitting || deleting

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'add' ? 'Add Pre-Approved Time Off' : 'Edit Approved Time Off'}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Employee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input name="employee_name" value={form.employee_name} onChange={handleChange} required placeholder="Jane Smith" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input name="employee_id" value={form.employee_id} onChange={handleChange} placeholder="Optional" className={inputCls} />
            </div>
          </div>

          {/* Type toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 gap-1">
            <button
              type="button"
              onClick={() => setRequestType('time_off')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                requestType === 'time_off' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Time Off
            </button>
            <button
              type="button"
              onClick={() => setRequestType('time_restriction')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                requestType === 'time_restriction' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Time Restriction
            </button>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <select name="reason" value={form.reason} onChange={handleChange} required className={`${inputCls} bg-white`}>
              <option value="">Select a reason...</option>
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* When */}
          {requestType === 'time_off' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input type="date" name="end_date" value={form.end_date} onChange={handleChange} min={form.start_date || undefined} required className={inputCls} />
              </div>
            </div>
          ) : (
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" name="restriction_date" value={form.restriction_date} onChange={handleChange} required className={inputCls} />
            </div>
          )}

          {/* How much */}
          {requestType === 'time_off' ? (
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="num_days"
                value={form.num_days}
                onChange={handleChange}
                min={1}
                required
                placeholder="Auto-calculated from dates"
                className="w-52 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TimePicker label="From" value={timeStart} onChange={setTimeStart} />
              <TimePicker label="To" value={timeEnd} onChange={setTimeEnd} />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Saving…' : mode === 'add' ? 'Add Time Off' : 'Save Changes'}
            </button>
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="px-4 py-2.5 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 text-center">This entry is automatically approved. No email is sent.</p>
        </form>
      </div>
    </div>
  )
}
