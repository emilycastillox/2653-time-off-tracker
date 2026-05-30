'use client'

import { useState } from 'react'
import type { TimeOffRequest } from '@/lib/supabase'
import { fmtDate } from '@/lib/utils'

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
      entries.push({ label, isRestriction })
      map.set(key, entries)
      cur.setDate(cur.getDate() + 1)
    }
  }
  return map
}

function CalendarView({ requests }: { requests: TimeOffRequest[] }) {
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
      <div className="flex gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-200 inline-block" /> Time off
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-200 inline-block" /> Restriction · <span className="font-semibold text-purple-700">*10L, 4E</span> = 10am or later, 4pm or earlier
        </span>
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
            <div key={i} className={`min-h-[80px] p-1.5 ${cellBg(entries)}`}>
              <span className={`text-xs font-medium block mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
              }`}>
                {day}
              </span>
              {visible.map((entry, j) =>
                entry.isRestriction ? (
                  <span key={j} className="block text-xs font-semibold text-purple-700 truncate leading-[1.35rem]">
                    {entry.label}
                  </span>
                ) : (
                  <span key={j} className="block text-xs text-green-700 truncate leading-[1.35rem]">
                    {entry.label}
                  </span>
                )
              )}
              {overflow > 0 && (
                <span className="text-xs text-gray-400">+{overflow} more</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SpreadsheetView({ requests }: { requests: TimeOffRequest[] }) {
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((req) => {
              const isRestriction = req.request_type === 'time_restriction'
              const shorthand = toShorthand(req.time_start, req.time_end)
              return (
                <tr key={req.id} className={`hover:bg-gray-50 ${isRestriction ? 'bg-purple-50/40' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{req.employee_name}</td>
                  <td className="px-4 py-3 text-gray-600">{req.employee_position}</td>
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
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ApprovedClient({ requests }: { requests: TimeOffRequest[] }) {
  const [view, setView] = useState<View>('calendar')

  return (
    <div>
      <div className="flex gap-2 mb-6">
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

      {view === 'calendar' ? (
        <CalendarView requests={requests} />
      ) : (
        <SpreadsheetView requests={requests} />
      )}
    </div>
  )
}
