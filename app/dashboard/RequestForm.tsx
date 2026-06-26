'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import TimePicker, { type TimeVal, formatTime } from '@/app/components/TimePicker'

const REASONS = [
  'Vacation',
  'Personal',
  'Medical / Sick Leave',
  'Family Emergency',
  'Bereavement',
  'Other',
]

type RequestType = 'time_off' | 'time_restriction'

export default function RequestForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [requestType, setRequestType] = useState<RequestType>('time_off')

  const [form, setForm] = useState({
    employee_name: '',
    employee_position: '',
    employee_id: '',
    reason: '',
    // time off
    start_date: '',
    end_date: '',
    num_days: '',
    // time restriction
    restriction_date: '',
  })

  const [timeStart, setTimeStart] = useState<TimeVal>({ hour: '9', minute: '00', ampm: 'AM' })
  const [timeEnd, setTimeEnd] = useState<TimeVal>({ hour: '5', minute: '00', ampm: 'PM' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(f => {
      const next = { ...f, [name]: value }
      if (name === 'start_date' || name === 'end_date') {
        const start = name === 'start_date' ? value : f.start_date
        const end   = name === 'end_date'   ? value : f.end_date
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
          employee_name:     form.employee_name,
          employee_position: form.employee_position,
          employee_id:       form.employee_id,
          request_type:      'time_restriction',
          reason:            form.reason,
          start_date:        form.restriction_date,
          end_date:          form.restriction_date,
          num_days:          1,
          time_start:        formatTime(timeStart),
          time_end:          formatTime(timeEnd),
        }
      : {
          employee_name:     form.employee_name,
          employee_position: form.employee_position,
          employee_id:       form.employee_id,
          request_type:      'time_off',
          reason:            form.reason,
          start_date:        form.start_date,
          end_date:          form.end_date,
          num_days:          parseInt(form.num_days, 10),
          time_start:        null,
          time_end:          null,
        }

    try {
      const res = await fetch('/api/requests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.text()) || 'Submission failed')

      setSuccess(true)
      setForm({ employee_name:'', employee_position:'', employee_id:'', reason:'', start_date:'', end_date:'', num_days:'', restriction_date:'' })
      setTimeStart({ hour:'9', minute:'00', ampm:'AM' })
      setTimeEnd({ hour:'5', minute:'00', ampm:'PM' })
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <p className="text-green-800 font-semibold text-lg">Request submitted!</p>
        <p className="text-green-700 text-sm mt-1">Management has been notified and will review your request.</p>
        <button onClick={() => setSuccess(false)} className="mt-4 text-sm text-green-700 underline">
          Submit another request
        </button>
      </div>
    )
  }

  const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">

      {/* WHO */}
      <div className="p-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Who</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input name="employee_name" value={form.employee_name} onChange={handleChange} required placeholder="Jane Smith" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
            <input name="employee_position" value={form.employee_position} onChange={handleChange} required placeholder="e.g. SA" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
            <input name="employee_id" value={form.employee_id} onChange={handleChange} required placeholder="e.g. 170266" className={inputCls} />
          </div>
        </div>
      </div>

      {/* WHAT */}
      <div className="p-6 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">What</h3>

        {/* Type toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 gap-1">
          <button
            type="button"
            onClick={() => setRequestType('time_off')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              requestType === 'time_off'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Time Off Request
          </button>
          <button
            type="button"
            onClick={() => setRequestType('time_restriction')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              requestType === 'time_restriction'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
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
      </div>

      {/* WHEN */}
      <div className="p-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">When</h3>

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
      </div>

      {/* WHERE */}
      <div className="p-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Where</h3>
        <input value="2653 Legacy Place" readOnly className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
      </div>

      {/* HOW MUCH */}
      <div className="p-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">How Much</h3>

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
            <TimePicker label="To"   value={timeEnd}   onChange={setTimeEnd} />
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="p-6 space-y-3">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>

    </form>
  )
}
