import { randomUUID } from 'node:crypto'

export type Role = 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT'
export type Status = 'Hadir' | 'Izin' | 'Sakit' | 'Alpa'
export interface Student {
  id: string
  schoolId: string
  name: string
  number: string
  className: string
  email: string
  gender: string
  status: Status
  score: number
  attended: number
  sessions: number
}
export interface Member {
  id: string
  schoolId: string
  email: string
  name: string
  role: Role
  passwordHash: string
  className: string | null
  studentId: string | null
}
export interface SchoolData {
  students: Student[]
  teachers: { id: string; name: string; subject: string; email: string; classes: number }[]
  classes: { id: string; name: string; teacher: string; room: string }[]
  subjects: { id: string; name: string; code: string; hours: number }[]
  schedules: {
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
  attendanceHistory: { date: string; studentId: string; status: Status }[]
}
export const SCHOOL_ID = '8cdfd39e-1d3a-49e1-9af0-46c7773cb02a'
export const schoolName = 'SMA Nusantara'
export const roleNames: Record<Role, string> = {
  ADMIN: 'Admin Sekolah',
  PRINCIPAL: 'Kepala Sekolah',
  TEACHER: 'Guru',
  STUDENT: 'Siswa',
}
export function makeDemoData(): SchoolData {
  const firstNames = [
    'Aditya',
    'Alya',
    'Bima',
    'Citra',
    'Daffa',
    'Dewi',
    'Fajar',
    'Gita',
    'Hanif',
    'Intan',
    'Kevin',
    'Laras',
    'Maulana',
    'Nadia',
    'Putra',
    'Rani',
    'Rizky',
    'Salsabila',
    'Tegar',
    'Zahra',
  ]
  const lastNames = [
    'Pratama',
    'Putri',
    'Saputra',
    'Maharani',
    'Ramadhan',
    'Kusuma',
    'Wijaya',
    'Lestari',
    'Hidayat',
    'Permata',
  ]
  const teachers = [
    'Ratna Puspita',
    'Budi Santoso',
    'Diana Rahmawati',
    'Ahmad Fauzi',
    'Siti Nurhaliza',
    'Reza Firmansyah',
    'Nina Kartika',
    'Dedi Setiawan',
  ]
  const subjects = [
    'Matematika',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Fisika',
    'Kimia',
    'Biologi',
    'Informatika',
    'Sejarah',
  ]
  const classes = Array.from({ length: 32 }, (_, index) => ({
    id: randomUUID(),
    name: `${['X', 'XI', 'XII'][Math.floor(index / 11)]}-${(index % 11) + 1}`,
    teacher: teachers[index % teachers.length],
    room: `Ruang ${101 + index}`,
  }))
  return {
    students: Array.from({ length: 1240 }, (_, index) => ({
      id: randomUUID(),
      schoolId: SCHOOL_ID,
      name: `${firstNames[index % 20]} ${lastNames[Math.floor(index / 20) % 10]}`,
      number: `2026${String(index + 1).padStart(4, '0')}`,
      className: classes[index % 32].name,
      email: `siswa${index + 1}@nusantara.sch.id`,
      gender: index % 2 ? 'Perempuan' : 'Laki-laki',
      status:
        index % 29 === 0
          ? 'Alpa'
          : index % 23 === 0
            ? 'Sakit'
            : index % 19 === 0
              ? 'Izin'
              : 'Hadir',
      score: 73 + (index % 25),
      attended: 17 + (index % 4),
      sessions: 20,
    })),
    teachers: Array.from({ length: 64 }, (_, index) => ({
      id: randomUUID(),
      name: `${teachers[index % 8]}${index < 8 ? '' : ` ${lastNames[Math.floor(index / 8)]}`}`,
      subject: subjects[index % 8],
      email: `guru${index + 1}@nusantara.sch.id`,
      classes: 3 + (index % 3),
    })),
    classes,
    subjects: subjects.map((name, index) => ({
      id: randomUUID(),
      name,
      code: `MP-${String(index + 1).padStart(2, '0')}`,
      hours: index < 3 ? 4 : 3,
    })),
    schedules: classes.flatMap((classroom, classIndex) =>
      ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].flatMap((day, dayIndex) =>
        [0, 1, 2].map((slot) => ({
          id: randomUUID(),
          className: classroom.name,
          day,
          startTime: ['08.00', '10.00', '13.00'][slot],
          endTime: ['09.30', '11.30', '14.30'][slot],
          subject: subjects[(dayIndex + slot + classIndex) % subjects.length],
          teacher: teachers[(dayIndex + slot + classIndex) % teachers.length],
          room: classroom.room,
        })),
      ),
    ),
    assignments: [
      {
        id: randomUUID(),
        title: 'Persamaan & fungsi kuadrat',
        subject: 'Matematika',
        className: 'X-1',
        deadline: '2026-10-30',
        submitted: 28,
        total: 39,
      },
      {
        id: randomUUID(),
        title: 'Essay: A better tomorrow',
        subject: 'Bahasa Inggris',
        className: 'XI-2',
        deadline: '2026-10-31',
        submitted: 24,
        total: 39,
      },
      {
        id: randomUUID(),
        title: 'Eksperimen hukum Newton',
        subject: 'Fisika',
        className: 'X-1',
        deadline: '2026-11-02',
        submitted: 18,
        total: 39,
      },
      {
        id: randomUUID(),
        title: 'Proyek website personal',
        subject: 'Informatika',
        className: 'XII-3',
        deadline: '2026-11-04',
        submitted: 30,
        total: 38,
      },
    ],
    announcements: [
      {
        id: randomUUID(),
        title: 'Your next chapter starts here.',
        content: 'Pekan Kreativitas Nusantara 2026. Saatnya ide, karya, dan bakatmu naik panggung.',
        category: 'EVENT SEKOLAH',
        date: '2026-11-05',
        author: 'Tim Kesiswaan',
      },
      {
        id: randomUUID(),
        title: 'Persiapan asesmen tengah semester',
        content:
          'Jadwal asesmen tersedia. Pastikan seluruh nilai tugas sudah diperbarui sebelum 2 November.',
        category: 'Akademik',
        date: '2026-10-28',
        author: 'Ratna Puspita',
      },
      {
        id: randomUUID(),
        title: 'Rapat koordinasi wali kelas',
        content: 'Jumat, 30 Oktober 2026 pukul 13.00 di ruang rapat utama.',
        category: 'Informasi',
        date: '2026-10-27',
        author: 'Budi Santoso',
      },
    ],
    reports: [],
    audit: [],
    attendanceHistory: [],
  }
}
export function scopedData(data: SchoolData, member: Member): SchoolData {
  if (member.role === 'ADMIN' || member.role === 'PRINCIPAL') return data
  const students = data.students.filter((student) =>
    member.role === 'STUDENT'
      ? student.id === member.studentId
      : student.className === member.className,
  )
  const studentIds = new Set(students.map((student) => student.id))
  return {
    ...data,
    students,
    teachers: [],
    classes: data.classes.filter((item) => item.name === member.className),
    schedules: data.schedules.filter((item) => item.className === member.className),
    assignments: data.assignments.filter((item) => item.className === member.className),
    reports: data.reports.filter((item) => item.createdBy === member.id),
    audit: [],
    attendanceHistory: data.attendanceHistory.filter((item) => studentIds.has(item.studentId)),
  }
}
export function summarize(data: SchoolData) {
  const total = data.students.length
  const present = data.students.filter((student) => student.status === 'Hadir').length
  const attended = data.students.reduce((sum, student) => sum + student.attended, 0)
  const sessions = data.students.reduce((sum, student) => sum + student.sessions, 0)
  return {
    students: total,
    teachers: data.teachers.length,
    classes: data.classes.length,
    assignments: data.assignments.length,
    attendance: total ? Math.round((present / total) * 1000) / 10 : 0,
    average: total
      ? Math.round((data.students.reduce((sum, student) => sum + student.score, 0) / total) * 10) /
        10
      : 0,
    periodAttendance: sessions ? Math.round((attended / sessions) * 1000) / 10 : 0,
    present,
    absent: total - present,
  }
}
