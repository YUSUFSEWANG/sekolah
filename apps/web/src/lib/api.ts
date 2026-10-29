export type Role = 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT'
export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpa'
export interface User {
  id: string
  schoolId: string
  name: string
  email: string
  role: Role
  className: string | null
  studentId: string | null
}
export interface Student {
  id: string
  schoolId: string
  name: string
  number: string
  className: string
  email: string
  gender: string
  status: AttendanceStatus
  score: number
  attended: number
  sessions: number
}
export interface SchoolData {
  school: { id: string; name: string; slug: string }
  demo: boolean
  aiConfigured: boolean
  academicYear: string
  students: Student[]
  teachers: { id: string; name: string; subject: string; email: string; classes: number }[]
  classes: { id: string; name: string; teacher: string; room: string }[]
  subjects: { id: string; name: string; code: string; hours: number }[]
  schedules?: {
    id: string
    className: string
    day: string
    startTime: string
    endTime: string
    subject: string
    teacher: string
    room: string
  }[]
  assignments: {
    id: string
    title: string
    subject: string
    className: string
    deadline: string
    submitted: number
    total: number
  }[]
  announcements: {
    id: string
    title: string
    content: string
    category: string
    date: string
    author: string
  }[]
  reports: { id: string; title: string; content: string; createdAt: string; createdBy: string }[]
  audit: { id: string; action: string; actor: string; createdAt: string }[]
  attendanceHistory: { date: string; studentId: string; status: AttendanceStatus }[]
  stats: {
    students: number
    teachers: number
    classes: number
    assignments: number
    attendance: number
    average: number
    periodAttendance: number
    present: number
    absent: number
  }
}
export interface AiResponse {
  content: string
  provider: string
  source: string
  period: string
  generatedAt: string
}
export const roleNames: Record<Role, string> = {
  ADMIN: 'Admin Sekolah',
  PRINCIPAL: 'Kepala Sekolah',
  TEACHER: 'Guru',
  STUDENT: 'Siswa',
}
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Edupilot-Action': '1' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join('. ')
        : data.message || 'Koneksi API terputus. Coba kembali.',
    )
  return data as T
}
export const number = (value: number) => value.toLocaleString('id-ID')
export const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
export const dateLabel = (date: string) =>
  new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
export function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv =
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value)
            return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`
          })
          .join(','),
      )
      .join('\r\n')
  download(name, csv, 'text/csv;charset=utf-8')
}
export function download(name: string, content: string, type = 'text/plain;charset=utf-8') {
  const link = document.createElement('a')
  const url = URL.createObjectURL(new Blob([content], { type }))
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
