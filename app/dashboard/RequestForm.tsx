'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { differenceInCalendarDays, parseISO } from 'date-fns'

const REASONS = [
  'Vacation',
  'Personal',
  'Medical / Sick Leave',
  'Family Emergency',
  'Bereavement',
  'Other',
]

export default function RequestForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    employee_name: '',
    employee_position: '',
    employee_id: '',
    reason: '',
    start_date: '',
    end_date: '',
    num_days: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((f) => {
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

    try {
      const res = await fetch('/api/requests/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          num_days: parseInt(form.num_days, 10),
        }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Submission failed')
      }

      setSuccess(true)
      setForm({
        employee_name: '',
        employee_position: '',
        employee_id: '',
        reason: '',
        start_date: '',
        end_date: '',
        num_days: '',
      })
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
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm text-green-700 underline"
        >
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">

      {/* WHO */}
      <div className="p-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Who</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              name="employee_name"
              value={form.employee_name}
              onChange={handleChange}
              required
              placeholder="Jane Smith"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
            <input
              name="employee_position"
              value={form.employee_position}
              onChange={handleChange}
              required
              placeholder="Sales Associate"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
            <input
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              required
              placeholder="EMP-001"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* WHAT */}
      <div className="p-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">What</h3>
        <select
          name="reason"
          value={form.reason}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Select a reason...</option>
          {REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* WHEN */}
      <div className="p-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">When</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              min={form.start_date || undefined}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* WHERE */}
      <div className="p-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Where</h3>
        <input
          value="2653 Legacy Place"
          readOnly
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
        />
      </div>

      {/* HOW MUCH */}
      <div className="p-6 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">How Much</h3>
        <div className="flex items-center gap-4">
          <input
            type="number"
            name="num_days"
            value={form.num_days}
            onChange={handleChange}
            min={1}
            required
            placeholder="Auto-calculated from dates"
            className="w-48 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">days</span>
        </div>
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
