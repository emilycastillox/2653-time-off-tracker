'use client'

import { useState } from 'react'
import type { TimeOffRequest } from '@/lib/supabase'

type View = 'calendar' | 'spreadsheet'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildDateMap(requests: TimeOffRequest[]) {
  const map = new Map<string, string[]>()
  for (const req of requests) {
    const start = new Date(req.start_date + 'T00:00:00')
    const end = new Date(req.end_date + 'T00:00:00')
    const cur = new Date(start)
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10)
      const names = map.get(key) ?? []
      names.push(req.employee_name.split(' ')[0])
      map.set(key, names)
      cur.setDate(cur.getDate() + 1)
    }
  }
  return map
}

function CalendarView({ requests }: { requests: TimeOffRequest[] }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())

  const dateMap = buildDateMap(requests)

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startPad = firstDayOfMonth.getDay()

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-lg">‹</button>
        <h3 className="text-lg font-semibold text-gray-900">{MONTH_NAMES[month]} {year}</h3>
        <button onClick={next} className="p-1.5 rounded hover:bg-gray-200 text-gray-600 text-lg">›</button>
      </div>
      <div className="grid grid-cols-7 gap-px mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-xs font-medium text-gray-500 text-center py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={i} className="bg-gray-50 min-h-[72px]" />
          }
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const names = dateMap.get(key)
          const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
          return (
            <div key={i} className={`min-h-[72px] p-1.5 ${names ? 'bg-green-50' : 'bg-white'}`}>
              <span className={`text-xs font-medium block mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
              }`}>
                {day}
              </span>
              {names?.slice(0, 3).map((name, j) => (
                <span key={j} className="block text-xs text-green-700 truncate leading-4">{name}</span>
              ))}
              {names && names.length > 3 && (
                <span className="text-xs text-gray-400">+{names.length - 3} more</span>
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Start</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">End</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Days</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Approved By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{req.employee_name}</td>
                <td className="px-4 py-3 text-gray-600">{req.employee_position}</td>
                <td className="px-4 py-3 text-gray-600">{req.reason}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{req.start_date}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{req.end_date}</td>
                <td className="px-4 py-3 text-gray-600">{req.num_days}</td>
                <td className="px-4 py-3 text-gray-500">{req.reviewed_by ?? '—'}</td>
              </tr>
            ))}
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
