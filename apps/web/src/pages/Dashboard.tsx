import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Users,
  GraduationCap,
  Layers3,
  ArrowUpRight,
  Download,
  CalendarDays,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  MoveUpRight,
} from 'lucide-react'
import type { PageProps } from '../App'
import { Avatar, Badge, PageTitle, SectionTitle } from '../components/ui'
import { downloadCsv, number, dateLabel } from '../lib/api'

export function Dashboard({ data, user, notify }: PageProps) {
  const navigate = useNavigate()
  const [className, setClassName] = useState('all')
  const [chartMode, setChartMode] = useState<'attendance' | 'grades'>('attendance')
  const students =
    className === 'all'
      ? data.students
      : data.students.filter((student) => student.className === className)
  const attendance = students.length
    ? Math.round(
        (students.filter((student) => student.status === 'Hadir').length / students.length) * 1000,
      ) / 10
    : 0
  const average = students.length
    ? Math.round(
        (students.reduce((total, student) => total + student.score, 0) / students.length) * 10,
      ) / 10
    : 0
  const chartData = data.classes
    .filter((item) => className === 'all' || item.name === className)
    .slice(0, 8)
    .map((item) => {
      const members = data.students.filter((student) => student.className === item.name)
      return {
        name: item.name,
        hadir: members.length
          ? Math.round(
              (members.filter((student) => student.status === 'Hadir').length / members.length) *
                1000,
            ) / 10
          : 0,
        nilai: members.length
          ? Math.round(members.reduce((total, member) => total + member.score, 0) / members.length)
          : 0,
        target: 95,
      }
    })
  const stats = [
    {
      label: user.role === 'STUDENT' ? 'Rata-rata nilai' : 'Total siswa',
      value: user.role === 'STUDENT' ? data.stats.average : students.length,
      icon: Users,
      color: 'mint',
      sub: user.role === 'STUDENT' ? 'Dari skala 100' : 'Siswa aktif terdaftar',
      tag: 'Aktif',
    },
    {
      label: 'Kehadiran',
      value: `${attendance.toLocaleString('id-ID')}%`,
      icon: Check,
      color: 'lavender',
      sub: 'Status absensi terakhir',
      tag: 'Tercatat',
    },
    {
      label: user.role === 'STUDENT' || user.role === 'TEACHER' ? 'Mata pelajaran' : 'Guru & staf',
      value:
        user.role === 'STUDENT' || user.role === 'TEACHER'
          ? data.subjects.length
          : data.teachers.length,
      icon: GraduationCap,
      color: 'peach',
      sub: 'Tahun ajaran berjalan',
      tag: '2026/27',
    },
    {
      label: 'Kelas aktif',
      value: className === 'all' ? data.classes.length : 1,
      icon: Layers3,
      color: 'yellow',
      sub: 'Semester ganjil',
      tag: 'Aktif',
    },
  ]
  function exportReport() {
    downloadCsv('ringkasan-akademik.csv', [
      ['Kelas', 'Siswa', 'Hadir', 'Rata-rata nilai'],
      ...data.classes.map((item) => {
        const members = data.students.filter((student) => student.className === item.name)
        return [
          item.name,
          members.length,
          members.filter((student) => student.status === 'Hadir').length,
          members.length
            ? (members.reduce((total, member) => total + member.score, 0) / members.length).toFixed(
                1,
              )
            : 0,
        ]
      }),
    ])
    notify('Laporan CSV berhasil diunduh.')
  }
  return (
    <div className="dashboard page-enter">
      <PageTitle
        eyebrow="LET'S MAKE TODAY COUNT"
        title={`Halo, ${user.name.split(' ')[0]}`}
        description={`${(data.demo ? new Date('2026-10-29T12:00:00') : new Date()).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}. Hari baru, peluang baru.`}
      >
        <button className="button secondary" onClick={exportReport}>
          <Download size={16} />
          Unduh laporan
        </button>
        {user.role === 'ADMIN' && (
          <button className="button primary" onClick={() => navigate('/students?new=1')}>
            <Plus size={17} />
            Tambah siswa
          </button>
        )}
      </PageTitle>
      <div className="overview-toolbar">
        <div className="overview-title">
          <span className="live-dot" />
          <strong>School overview</strong>
          <Badge tone="neutral">{data.demo ? 'Data demo' : 'Live'}</Badge>
        </div>
        <div className="overview-filters">
          <span className="term">
            <CalendarDays size={15} />
            2026/2027 - Ganjil
          </span>
          <label className="select-wrap">
            <select
              aria-label="Filter kelas dashboard"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
            >
              <option value="all">Semua kelas</option>
              {data.classes.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
            <ChevronDown size={14} />
          </label>
        </div>
      </div>
      <div className="stats-grid">
        {stats.map((stat) => (
          <article className={`stat-card ${stat.color}`} key={stat.label}>
            <div className="stat-top">
              <span>{stat.label}</span>
              <span className="stat-icon">
                <stat.icon size={19} />
              </span>
            </div>
            <div className="stat-value">
              {typeof stat.value === 'number' ? number(stat.value) : stat.value}
              <span className="stat-trend">
                <MoveUpRight size={13} />
                {stat.tag}
              </span>
            </div>
            <div className="stat-bottom">
              {stat.sub}
              <span className="mini-bars" aria-hidden="true">
                {[35, 55, 42, 70, 58, 84, 72, 100].map((height, index) => (
                  <i key={index} style={{ height: `${height}%` }} />
                ))}
              </span>
            </div>
          </article>
        ))}
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <section className="chart-section">
            <div className="section-title">
              <div>
                <h2>Setiap kehadiran berarti</h2>
                <p>Ringkasan akademik per kelas</p>
              </div>
              <div className="segmented">
                <button
                  className={chartMode === 'attendance' ? 'selected' : ''}
                  onClick={() => setChartMode('attendance')}
                >
                  Kehadiran
                </button>
                <button
                  className={chartMode === 'grades' ? 'selected' : ''}
                  onClick={() => setChartMode('grades')}
                >
                  Nilai
                </button>
              </div>
            </div>
            <div className="chart-summary">
              <strong>
                {chartMode === 'attendance' ? `${attendance.toLocaleString('id-ID')}%` : average}
                <span>{chartMode === 'attendance' ? 'kehadiran tercatat' : 'rata-rata nilai'}</span>
              </strong>
              <div className="chart-legend">
                <i />
                {chartMode === 'attendance' ? 'Hadir' : 'Rata-rata nilai'}
                <i className="legend-target" />
                Target 95
              </div>
            </div>
            <div className="attendance-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 15, right: 12, left: -27, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#65b59b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#65b59b" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#e8ece8" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#8b928c' }}
                    dy={10}
                  />
                  <YAxis
                    domain={[60, 100]}
                    ticks={[60, 70, 80, 90, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#8b928c' }}
                    tickFormatter={(value) =>
                      chartMode === 'attendance' ? `${value}%` : String(value)
                    }
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e6e9e4', fontSize: 12 }}
                    formatter={(value) => (chartMode === 'attendance' ? `${value}%` : value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    name="Target"
                    stroke="#b4c3b9"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMode === 'attendance' ? 'hadir' : 'nilai'}
                    name={chartMode === 'attendance' ? 'Hadir' : 'Nilai'}
                    stroke="#26846a"
                    fill="url(#attendanceFill)"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-caption">
              <span>
                <i className="live-dot" />
                Berdasarkan data{' '}
                {className === 'all'
                  ? `${Math.min(data.classes.length, 8)} kelas pertama`
                  : className}
              </span>
              <button className="text-button" onClick={() => navigate('/attendance')}>
                Detail absensi <ArrowUpRight size={14} />
              </button>
            </div>
          </section>
          <section className="students-section">
            <SectionTitle
              title={user.role === 'STUDENT' ? 'Catatan akademikmu' : 'Siswa dalam sorotan'}
              action={() => navigate(user.role === 'STUDENT' ? '/grades' : '/students')}
            >
              <p>Perkembangan kecil, dampak besar.</p>
            </SectionTitle>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Nama siswa</th>
                    <th>Kelas</th>
                    <th>Rata-rata</th>
                    <th>Kehadiran</th>
                    <th aria-label="Detail" />
                  </tr>
                </thead>
                <tbody>
                  {[...students]
                    .sort((first, second) => second.score - first.score)
                    .slice(0, 4)
                    .map((student, index) => (
                      <tr key={student.id}>
                        <td>
                          <div className="person-cell">
                            <Avatar name={student.name} index={index} />
                            <span>
                              <strong>{student.name}</strong>
                              <small>NIS {student.number}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="class-chip">{student.className}</span>
                        </td>
                        <td>
                          <strong className="grade-number">
                            {student.score}
                            <span>/100</span>
                          </strong>
                        </td>
                        <td>
                          <Badge tone={student.status === 'Hadir' ? 'green' : 'yellow'}>
                            <i />
                            {student.status}
                          </Badge>
                        </td>
                        <td>
                          <button
                            className="table-arrow"
                            aria-label={`Detail ${student.name}`}
                            onClick={() =>
                              navigate(
                                user.role === 'STUDENT'
                                  ? '/grades'
                                  : `/students?q=${encodeURIComponent(student.number)}`,
                              )
                            }
                          >
                            <ArrowUpRight size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="bottom-grid">
            <article className="event-feature">
              <img src="/campus.jpg" alt="Kampus dan ruang terbuka untuk kegiatan sekolah" />
              <div className="event-overlay" />
              <div className="event-content">
                <span className="event-label">CAMPUS LIFE</span>
                <h2>
                  Your next chapter
                  <br />
                  starts here.
                </h2>
                <div>
                  <span>Pekan Kreativitas / 5 Nov 2026</span>
                  <button
                    aria-label="Lihat kegiatan sekolah"
                    onClick={() => navigate('/announcements')}
                  >
                    <ArrowUpRight size={21} />
                  </button>
                </div>
              </div>
            </article>
            <section className="assignment-preview">
              <SectionTitle title="Deadline terdekat" action={() => navigate('/assignments')} />
              {data.assignments.slice(0, 2).map((item, index) => (
                <button
                  className="deadline-item"
                  key={item.id}
                  onClick={() => navigate('/assignments')}
                >
                  <span className={`subject-icon subject-${index}`}>
                    <BookOpen size={18} />
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.className} / {dateLabel(item.deadline)}
                    </small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))}
              {data.assignments.length === 0 && <p className="muted">Belum ada tugas aktif.</p>}
            </section>
          </section>
        </div>
        <aside className="dashboard-secondary">
          {user.role !== 'STUDENT' && (
            <section className="ai-widget">
              <div className="ai-widget-top">
                <span className="ai-symbol">
                  <Sparkles size={20} />
                </span>
                <Badge tone="white">YOUR AI SIDEKICK</Badge>
                <ArrowUpRight size={18} />
              </div>
              <h2>
                A little insight.
                <br />A big difference.
              </h2>
              <p>
                {data.aiConfigured ? 'EduPilot AI' : 'Ringkasan otomatis'}
                <span className="ai-status-dot" />
              </p>
              <div className="ai-suggestion">
                {data.stats.absent} siswa belum tercatat hadir. Ada cerita di balik setiap angka.
              </div>
              <button onClick={() => navigate('/ai-assistant')}>
                Lihat insight sekolah
                <Sparkles size={16} />
              </button>
            </section>
          )}
          <Agenda
            data={data}
            className={className === 'all' ? (data.classes[0]?.name ?? '') : className}
          />
          <section className="announcement-preview">
            <SectionTitle title="Papan pengumuman" action={() => navigate('/announcements')} />
            {data.announcements.slice(1, 3).map((item, index) => (
              <button key={item.id} onClick={() => navigate('/announcements')}>
                <span className={`announcement-dot dot-${index}`} />
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {dateLabel(item.date)}
                    <span>/</span>
                    {item.author}
                  </small>
                </span>
              </button>
            ))}
          </section>
        </aside>
      </div>
    </div>
  )
}

function Agenda({ data, className }: Pick<PageProps, 'data'> & { className: string }) {
  const navigate = useNavigate()
  const today = data.demo ? new Date('2026-10-29T12:00:00') : new Date()
  const [selected, setSelected] = useState(today)
  const [week, setWeek] = useState(0)
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + week * 7)
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })
  const schedules = (data.schedules ?? []).filter(
    (item) =>
      item.className === className &&
      item.day === selected.toLocaleDateString('id-ID', { weekday: 'long' }),
  )
  function changeWeek(offset: number) {
    setWeek(week + offset)
    const date = new Date(monday)
    date.setDate(monday.getDate() + offset * 7)
    setSelected(date)
  }
  return (
    <section className="agenda-section">
      <div className="section-title">
        <h2>Agenda kelas {className}</h2>
        <span className="calendar-icon">
          <CalendarDays size={17} />
        </span>
      </div>
      <div className="calendar-month">
        <strong>{monday.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</strong>
        <div>
          <button aria-label="Minggu sebelumnya" onClick={() => changeWeek(-1)}>
            <ChevronLeft size={16} />
          </button>
          <button aria-label="Minggu berikutnya" onClick={() => changeWeek(1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="week-strip">
        {dates.map((date) => (
          <button
            key={date.toDateString()}
            aria-label={date.toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            onClick={() => setSelected(date)}
            className={selected.toDateString() === date.toDateString() ? 'selected' : ''}
          >
            <small>{date.toLocaleDateString('id-ID', { weekday: 'short' })}</small>
            <strong>{date.getDate()}</strong>
            {today.toDateString() === date.toDateString() && <i />}
          </button>
        ))}
      </div>
      <div className="agenda-day-heading">
        <span>{selected.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
        <span>{schedules.length} sesi pelajaran</span>
      </div>
      {schedules.length ? (
        <div className="agenda-list">
          {schedules.slice(0, 2).map((item, index) => (
            <button
              className={`agenda-item ${index ? 'coral' : ''}`}
              key={item.id}
              onClick={() => navigate('/schedules')}
            >
              <span className="agenda-time">
                {item.startTime}
                <small>{item.endTime}</small>
              </span>
              <span className="agenda-line" />
              <span>
                <strong>{item.subject}</strong>
                <small>
                  Kelas {item.className} / {item.room}
                </small>
                <span className="agenda-teacher">
                  <Avatar name={item.teacher} small />
                  {item.teacher}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="calendar-empty">Tidak ada sesi pelajaran.</p>
      )}
      <button className="agenda-link" onClick={() => navigate('/schedules')}>
        Buka jadwal lengkap
        <ArrowRight size={16} />
      </button>
    </section>
  )
}
