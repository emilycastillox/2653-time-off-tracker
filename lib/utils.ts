/** "YYYY-MM-DD" → "MM/DD/YYYY" */
export function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${m}/${d}/${y}`
}
