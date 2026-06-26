'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TimeOffRequest } from '@/lib/supabase'
import { fmtDate } from '@/lib/utils'
import TimeOffModal from './TimeOffModal'

type View = 'calendar' | 'spreadsheet'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// "Jane Smith" → "Jane S."
function nameWithInitial(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

// "10:00 AM" + "4:00 PM" → "10L, 4E"
function toShorthand(timeStart: string | null, timeEnd: string | null): string | null {
  if (!timeStart || !timeEnd) return null
  const startHour = timeStart.split(':')[0]
  const endHour   = timeEnd.split(':')[0]
  return `${startHour}L, ${endHour}E`
}

type DayEntry = {
  label: string        // display text, e.g. "Jane S." or "Jane S. *10L,4E"
  isRestriction: boolean
  request: TimeOffRequest
}

function buildDateMap(requests: TimeOffRequest[]): Map<string, DayEntry[]> {
  const map = new Map<string, DayEntry[]>()
  for (const req of requests) {
    const start = new Date(req.start_date + 'T00:00:00')
    const end   = new Date(req.end_date   + 'T00:00:00')
    const cur   = new Date(start)
    const isRestriction = req.request_type === 'time_restriction'
    const shorthand = toShorthand(req.time_start, req.time_end)
    const base = nameWithInitial(req.employee_name)
    const label = isRestriction && shorthand ? `${base} *${shorthand}` : base

    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10)
      const entries = map.get(key) ?? []
      entries.push({ label, isRestriction, request: req })
      map.set(key, entries)
      cur.setDate(cur.getDate() + 1)
    }
  }
  return map
}

function CalendarView({
  requests,
  onAddDate,
  onEditRequest,
}: {
  requests: TimeOffRequest[]
  onAddDate: (dateKey: string) => void
  onEditRequest: (req: TimeOffRequest) => void
}) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year,  setYear]  = useState(now.getFullYear())

  const dateMap = buildDateMap(requests)

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth     = new Date(year, month + 1, 0).getDate()
  const startPad        = firstDayOfMonth.getDay()

  const cells: (number | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Determine cell bg: has restriction-only, time-off-only, or both
  function cellBg(entries: DayEntry[] | undefined) {
    if (!entries) return 'bg-white'
    const hasOff = entries.some(e => !e.isRestriction)
    const hasRes = entries.some(e => e.isRestriction)
    if (hasOff && hasRes) return 'bg-purple-50'
    if (hasRes) return 'bg-purple-50'
    return 'bg-green-50'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-lg">‹</button>
        <h3 className="text-lg font-semibold text-gray-900">{MONTH_NAMES[month]} {year}</h3>
        <button onClick={next} className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-lg">›</button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-200 inline-block" /> Time off
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-200 inline-block" /> Restriction · <span className="font-semibold text-purple-700">*10L, 4E</span> = 10am or later, 4pm or earlier
        </span>
        <span className="text-gray-400">Click a day to add · click an entry to edit</span>
      </div>

      <div className="grid grid-cols-7 gap-px mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-xs font-medium text-gray-500 text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="bg-gray-50 min-h-[80px]" />
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const entries = dateMap.get(key)
          const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
          const visible = entries?.slice(0, 3) ?? []
          const overflow = (entries?.length ?? 0) - 3

          return (
            <div
              key={i}
              onClick={() => onAddDate(key)}
              title="Add pre-approved time off"
              className={`group relative min-h-[80px] p-1.5 cursor-pointer transition-colors hover:ring-2 hover:ring-inset hover:ring-blue-300 ${cellBg(entries)}`}
            >
              <span className={`text-xs font-medium block mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
              }`}>
                {day}
              </span>
              {visible.map((entry, j) => (
                <span
                  key={j}
                  onClick={(e) => { e.stopPropagation(); onEditRequest(entry.request) }}
                  title="Edit / delete this entry"
                  className={`block text-xs truncate leading-[1.35rem] rounded px-0.5 hover:bg-white/70 ${
                    entry.isRestriction ? 'font-semibold text-purple-700' : 'text-green-700'
                  }`}
                >
                  {entry.label}
                </span>
              ))}
              {overflow > 0 && (
                <span className="text-xs text-gray-400">+{overflow} more</span>
              )}
              <span className="pointer-events-none absolute top-1 right-1 text-gray-300 opacity-0 group-hover:opacity-100 text-sm leading-none">+</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SpreadsheetView({
  requests,
  onEditRequest,
  onDeleteRequest,
  deletingId,
}: {
  requests: TimeOffRequest[]
  onEditRequest: (req: TimeOffRequest) => void
  onDeleteRequest: (req: TimeOffRequest) => void
  deletingId: string | null
}) {
  if (requests.length === 0) {
    return <div className="text-center py-16 text-gray-400">No approved requests.</div>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Position</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date(s)</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Time / Days</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Approved By</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((req) => {
              const isRestriction = req.request_type === 'time_restriction'
              const shorthand = toShorthand(req.time_start, req.time_end)
              return (
                <tr key={req.id} className={`hover:bg-gray-50 ${isRestriction ? 'bg-purple-50/40' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{req.employee_name}</td>
                  <td className="px-4 py-3 text-gray-600">{req.employee_position ?? '—'}</td>
                  <td className="px-4 py-3">
                    {isRestriction ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        ✦ Restriction
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        Time Off
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{req.reason}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {isRestriction ? fmtDate(req.start_date) : `${fmtDate(req.start_date)} – ${fmtDate(req.end_date)}`}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isRestriction && shorthand ? (
                      <span className="font-semibold text-purple-700">*{shorthand}</span>
                    ) : (
                      <span className="text-gray-600">{req.num_days} day{req.num_days !== 1 ? 's' : ''}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{req.reviewed_by ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => onEditRequest(req)}
                        className="px-2.5 py-1 rounded text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteRequest(req)}
                        disabled={deletingId === req.id}
                        className="px-2.5 py-1 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {deletingId === req.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type ModalState =
  | { mode: 'add'; prefillDate?: string }
  | { mode: 'edit'; request: TimeOffRequest }
  | null

export default function ApprovedClient({ requests }: { requests: TimeOffRequest[] }) {
  const router = useRouter()
  const [view, setView] = useState<View>('calendar')
  const [modal, setModal] = useState<ModalState>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function deleteRequest(req: TimeOffRequest) {
    if (!confirm(`Delete this approved time off for ${req.employee_name}? This cannot be undone.`)) return
    setDeletingId(req.id)
    try {
      const res = await fetch(`/api/requests/${req.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setView('spreadsheet')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'spreadsheet'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Spreadsheet View
          </button>
        </div>

        <button
          onClick={() => setModal({ mode: 'add' })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <span className="text-base leading-none">+</span> Add Pre-Approved Time Off
        </button>
      </div>

      {view === 'calendar' ? (
        <CalendarView
          requests={requests}
          onAddDate={(dateKey) => setModal({ mode: 'add', prefillDate: dateKey })}
          onEditRequest={(req) => setModal({ mode: 'edit', request: req })}
        />
      ) : (
        <SpreadsheetView
          requests={requests}
          onEditRequest={(req) => setModal({ mode: 'edit', request: req })}
          onDeleteRequest={deleteRequest}
          deletingId={deletingId}
        />
      )}

      {modal && (
        <TimeOffModal
          mode={modal.mode}
          prefillDate={modal.mode === 'add' ? modal.prefillDate : undefined}
          request={modal.mode === 'edit' ? modal.request : undefined}
          onClose={() => setModal(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  )
}
