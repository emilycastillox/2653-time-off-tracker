'use client'

export const HOURS = ['1','2','3','4','5','6','7','8','9','10','11','12']
export const MINUTES = ['00','15','30','45']

export type TimeVal = { hour: string; minute: string; ampm: 'AM' | 'PM' }

export function formatTime(t: TimeVal) {
  return `${t.hour}:${t.minute} ${t.ampm}`
}

// "9:00 AM" → { hour: '9', minute: '00', ampm: 'AM' }; falls back to a default for bad input
export function parseTime(str: string | null | undefined, fallback: TimeVal = { hour: '9', minute: '00', ampm: 'AM' }): TimeVal {
  if (!str) return fallback
  const m = str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!m) return fallback
  return { hour: String(Number(m[1])), minute: m[2], ampm: m[3].toUpperCase() as 'AM' | 'PM' }
}

export default function TimePicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: TimeVal
  onChange: (v: TimeVal) => void
}) {
  const base = 'border border-gray-300 rounded-md px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <select value={value.hour} onChange={e => onChange({ ...value, hour: e.target.value })} className={base}>
          {HOURS.map(h => <option key={h}>{h}</option>)}
        </select>
        <span className="text-gray-500 font-medium">:</span>
        <select value={value.minute} onChange={e => onChange({ ...value, minute: e.target.value })} className={base}>
          {MINUTES.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={value.ampm} onChange={e => onChange({ ...value, ampm: e.target.value as 'AM' | 'PM' })} className={base}>
          <option>AM</option>
          <option>PM</option>
        </select>
      </div>
    </div>
  )
}
