import { useDeferredValue, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Download,
  Pencil,
  Archive,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  BookOpen,
  CalendarDays,
  Save,
  Check,
  ArrowUpRight,
  GraduationCap,
  Clock3,
  MapPin,
  Mail,
  FileText,
} from 'lucide-react'
import type { PageProps } from '../App'
import {
  api,
  dateLabel,
  downloadCsv,
  number,
  type AttendanceStatus,
  type Student,
} from '../lib/api'
import { Avatar, Badge, Empty, IconButton, Modal, PageTitle, SearchInput } from '../components/ui'

export function ClassFilter({
  data,
  value,
  onChange,
  all = true,
}: Pick<PageProps, 'data'> & { value: string; onChange: (value: string) => void; all?: boolean }) {
  return (
    <label className="select-wrap">
      <select
        aria-label="Pilih kelas"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {all && <option value="all">Semua kelas</option>}
        {data.classes.map((item) => (
          <option key={item.id} value={item.name}>
            Kelas {item.name}
          </option>
        ))}
      </select>
      <ChevronDown size={14} />
    </label>
  )
}
function Pagination({
  page,
  total,
  size,
  onChange,
}: {
  page: number
  total: number
  size: number
  onChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / size))
  return (
    <div className="pagination">
      <span>
        {total ? (page - 1) * size + 1 : 0}-{Math.min(page * size, total)} dari {number(total)} data
      </span>
      <div>
        <IconButton
          label="Halaman sebelumnya"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={17} />
        </IconButton>
        <span>
          {page} / {pages}
        </span>
        <IconButton
          label="Halaman berikutnya"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={17} />
        </IconButton>
      </div>
    </div>
  )
}
export function Students({ data, user, reload, notify }: PageProps) {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const deferredQuery = useDeferredValue(query)
  const [className, setClassName] = useState(params.get('class') ?? 'all')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('number')
  const [modal, setModal] = useState<Student | 'new' | null>(
    params.has('new') && user.role === 'ADMIN' ? 'new' : null,
  )
  const [archive, setArchive] = useState<Student | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const editable = user.role === 'ADMIN'
  const rows = data.students
    .filter(
      (student) =>
        (className === 'all' || student.className === className) &&
        `${student.name} ${student.number} ${student.email}`
          .toLowerCase()
          .includes(deferredQuery.toLowerCase()),
    )
    .sort((first, second) =>
      sort === 'name'
        ? first.name.localeCompare(second.name)
        : first.number.localeCompare(second.number),
    )
  const size = 10
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / size)))
  const selected = modal && modal !== 'new' ? modal : undefined
  function close() {
    setModal(null)
    setError('')
    if (params.has('new')) {
      params.delete('new')
      setParams(params, { replace: true })
    }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const body = Object.fromEntries(new FormData(event.currentTarget))
    try {
      await api(
        `/schools/${user.schoolId}/students${selected ? `/${selected.id}` : ''}`,
        selected ? 'PATCH' : 'POST',
        body,
      )
      await reload()
      close()
      notify(selected ? 'Data siswa berhasil diperbarui.' : 'Siswa baru berhasil ditambahkan.')
    } catch (reason) {
      setError((reason as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function archiveStudent() {
    if (!archive) return
    setBusy(true)
    setError('')
    try {
      await api(`/schools/${user.schoolId}/students/${archive.id}`, 'DELETE')
      await reload()
      setArchive(null)
      notify('Siswa diarsipkan dari daftar aktif.')
    } catch (reason) {
      setError((reason as Error).message)
    } finally {
      setBusy(false)
    }
  }
  function exportRows() {
    downloadCsv('siswa-nusantara.csv', [
      ['NIS', 'Nama', 'Kelas', 'Email', 'Kehadiran', 'Nilai'],
      ...rows.map((student) => [
        student.number,
        student.name,
        student.className,
        student.email,
        student.status,
        student.score,
      ]),
    ])
    notify(`${rows.length} data siswa diekspor.`)
  }
  return (
    <div className="page-enter academic-page">
      <PageTitle
        eyebrow="THE NEXT GENERATION"
        title="Data siswa"
        description={`${number(data.students.length)} cerita, satu keluarga Nusantara.`}
      >
        <button className="button secondary" onClick={exportRows}>
          <Download size={16} />
          Ekspor CSV
        </button>
        {editable && (
          <button className="button primary" onClick={() => setModal('new')}>
            <Plus size={17} />
            Tambah siswa
          </button>
        )}
      </PageTitle>
      <div className="page-tabs">
        <span className="active">
          Semua siswa <Badge tone="neutral">{number(data.students.length)}</Badge>
        </span>
        <span>{data.academicYear}</span>
      </div>
      <div className="data-toolbar">
        <SearchInput
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
        />
        <div>
          <ClassFilter
            data={data}
            value={className}
            onChange={(value) => {
              setClassName(value)
              setPage(1)
            }}
          />
          <label className="select-wrap">
            <select
              aria-label="Urutkan siswa"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="number">Urutkan: NIS</option>
              <option value="name">Urutkan: Nama</option>
            </select>
            <ChevronDown size={14} />
          </label>
        </div>
      </div>
      <div className="table-scroll full-table">
        <table>
          <thead>
            <tr>
              <th>Nama siswa</th>
              <th>NIS</th>
              <th>Kelas</th>
              <th>Jenis kelamin</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice((currentPage - 1) * size, currentPage * size).map((student, index) => (
              <tr key={student.id}>
                <td>
                  <div className="person-cell">
                    <Avatar name={student.name} index={index} />
                    <span>
                      <strong>{student.name}</strong>
                      <small>{student.email}</small>
                    </span>
                  </div>
                </td>
                <td>{student.number}</td>
                <td>
                  <span className="class-chip">{student.className}</span>
                </td>
                <td>{student.gender}</td>
                <td>
                  <Badge>
                    <i />
                    Aktif
                  </Badge>
                </td>
                <td>
                  <div className="row-actions">
                    <IconButton
                      label={editable ? `Edit ${student.name}` : `Detail ${student.name}`}
                      onClick={() => setModal(student)}
                    >
                      {editable ? <Pencil size={15} /> : <ArrowUpRight size={16} />}
                    </IconButton>
                    {editable && (
                      <IconButton
                        label={`Arsipkan ${student.name}`}
                        onClick={() => {
                          setError('')
                          setArchive(student)
                        }}
                      >
                        <Archive size={15} />
                      </IconButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <Empty
          title="Siswa tidak ditemukan"
          detail="Tidak ada data yang cocok dengan pencarian ini."
        />
      )}
      <Pagination page={currentPage} total={rows.length} size={size} onChange={setPage} />
      <Modal
        open={modal !== null}
        onClose={close}
        title={selected ? (editable ? 'Edit data siswa' : 'Profil siswa') : 'Siswa baru'}
      >
        <form onSubmit={save}>
          <label>
            Nama lengkap
            <input
              name="name"
              defaultValue={selected?.name}
              minLength={2}
              maxLength={100}
              required
              readOnly={!editable}
            />
          </label>
          <div className="form-grid">
            <label>
              NIS
              <input
                name="number"
                defaultValue={selected?.number}
                minLength={3}
                maxLength={30}
                required
                readOnly={!editable}
              />
            </label>
            <label>
              Kelas
              <select name="className" defaultValue={selected?.className ?? data.classes[0]?.name}>
                {(selected
                  ? data.classes.filter((item) => item.name === selected.className)
                  : data.classes
                ).map((item) => (
                  <option key={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Email
            <input
              name="email"
              type="email"
              defaultValue={selected?.email}
              required
              readOnly={!editable}
            />
          </label>
          <label>
            Jenis kelamin
            <select
              name="gender"
              defaultValue={selected?.gender ?? 'Laki-laki'}
              disabled={!editable}
            >
              <option>Laki-laki</option>
              <option>Perempuan</option>
            </select>
          </label>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="button secondary" type="button" onClick={close}>
              Batal
            </button>
            {editable && (
              <button className="button primary" disabled={busy}>
                <Save size={16} />
                {busy ? 'Menyimpan...' : 'Simpan siswa'}
              </button>
            )}
          </div>
        </form>
      </Modal>
      <Modal
        open={Boolean(archive)}
        onClose={() => setArchive(null)}
        title="Arsipkan siswa?"
        description={`${archive?.name ?? ''} akan dihapus dari daftar siswa aktif. Riwayat yang telah dicatat tetap disimpan.`}
      >
        {error && <p className="error-message">{error}</p>}
        <div className="form-actions">
          <button className="button secondary" onClick={() => setArchive(null)}>
            Batal
          </button>
          <button className="button danger" disabled={busy} onClick={archiveStudent}>
            <Archive size={16} />
            Arsipkan siswa
          </button>
        </div>
      </Modal>
    </div>
  )
}
export function Directory({
  data,
  kind,
}: PageProps & { kind: 'teachers' | 'classes' | 'subjects' }) {
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<{ name: string; fields: string[] } | null>(null)
  const navigate = useNavigate()
  const title = { teachers: 'Guru & staf', classes: 'Kelas', subjects: 'Mata pelajaran' }[kind]
  const items = data[kind].filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
  return (
    <div className="page-enter academic-page">
      <PageTitle
        eyebrow="GROWING TOGETHER"
        title={title}
        description={`${items.length} ${title.toLowerCase()} / Semester ganjil 2026/2027`}
      />
      <div className="data-toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={`Cari ${title.toLowerCase()}...`}
        />
        <Badge tone="neutral">{data.school.name}</Badge>
      </div>
      <div className="directory-grid">
        {items.map((item, index) => (
          <article className={`directory-item directory-color-${index % 4}`} key={item.id}>
            <div className="directory-item-top">
              {kind === 'teachers' ? (
                <Avatar name={item.name} index={index} />
              ) : (
                <span className="subject-icon">
                  {kind === 'classes' ? <Users size={20} /> : <BookOpen size={20} />}
                </span>
              )}
              <Badge tone="neutral">
                {kind === 'teachers'
                  ? 'Guru'
                  : kind === 'classes'
                    ? 'Kelas aktif'
                    : 'Kurikulum Merdeka'}
              </Badge>
            </div>
            <h2>{item.name}</h2>
            {'subject' in item && (
              <>
                <p>{item.subject}</p>
                <div className="directory-meta">
                  <Mail size={14} />
                  <span>{item.email}</span>
                </div>
              </>
            )}
            {'teacher' in item && (
              <>
                <p>Wali kelas: {item.teacher}</p>
                <div className="directory-meta">
                  <Users size={14} />
                  <span>
                    {data.students.filter((student) => student.className === item.name).length}{' '}
                    siswa
                  </span>
                  <MapPin size={14} />
                  <span>{item.room}</span>
                </div>
              </>
            )}
            {'hours' in item && (
              <>
                <p>{item.code}</p>
                <div className="directory-meta">
                  <Clock3 size={14} />
                  <span>{item.hours} jam pelajaran / minggu</span>
                </div>
              </>
            )}
            <button
              className="directory-action"
              onClick={() => {
                if (kind === 'classes') navigate(`/students?class=${encodeURIComponent(item.name)}`)
                else
                  setDetail({
                    name: item.name,
                    fields:
                      'subject' in item
                        ? [item.subject, item.email, `${item.classes} kelas ditugaskan`]
                        : 'hours' in item
                          ? [
                              item.code,
                              `${item.hours} jam pelajaran per minggu`,
                              'Kurikulum Merdeka',
                            ]
                          : [],
                  })
              }}
            >
              {kind === 'classes' ? 'Lihat siswa' : 'Lihat detail'}
              <ArrowUpRight size={16} />
            </button>
          </article>
        ))}
      </div>
      {!items.length && <Empty title="Data tidak ditemukan" />}
      <Modal open={detail !== null} onClose={() => setDetail(null)} title={detail?.name ?? title}>
        <div className="detail-fields">
          {detail?.fields.map((field) => (
            <p key={field}>{field}</p>
          ))}
        </div>
      </Modal>
    </div>
  )
}
export function Attendance({ data, user, reload, notify }: PageProps) {
  const [className, setClassName] = useState(data.classes[0]?.name ?? '')
  const [date, setDate] = useState('2026-10-29')
  const [changes, setChanges] = useState<Record<string, AttendanceStatus>>({})
  const [busy, setBusy] = useState(false)
  const canEdit = user.role === 'ADMIN' || user.role === 'TEACHER'
  const students = data.students.filter((student) => student.className === className)
  const statusOf = (student: Student): AttendanceStatus =>
    changes[student.id] ??
    data.attendanceHistory.find((item) => item.studentId === student.id && item.date === date)
      ?.status ??
    (date === '2026-10-29' ? student.status : 'Hadir')
  const statuses: AttendanceStatus[] = ['Hadir', 'Izin', 'Sakit', 'Alpa']
  const hasSaved = data.attendanceHistory.some(
    (item) => item.date === date && students.some((student) => student.id === item.studentId),
  )
  async function save() {
    setBusy(true)
    try {
      await api(`/schools/${user.schoolId}/attendance`, 'POST', {
        date,
        records: students.map((student) => ({ studentId: student.id, status: statusOf(student) })),
      })
      await reload()
      setChanges({})
      notify(`Absensi kelas ${className} berhasil disimpan.`)
    } catch (reason) {
      notify((reason as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page-enter academic-page">
      <PageTitle
        eyebrow="EVERY DAY MATTERS"
        title="Absensi"
        description="Catatan kehadiran, satu hari pada satu waktu."
      >
        {canEdit && (
          <button
            className="button primary"
            onClick={save}
            disabled={busy || students.length === 0}
          >
            <Save size={16} />
            {busy ? 'Menyimpan...' : 'Simpan absensi'}
          </button>
        )}
      </PageTitle>
      <div className="attendance-totals">
        {statuses.map((status, index) => (
          <div key={status} className={`attendance-total total-${index}`}>
            <span>{status}</span>
            <strong>{students.filter((student) => statusOf(student) === status).length}</strong>
            <span>siswa</span>
          </div>
        ))}
      </div>
      <div className="data-toolbar">
        <div>
          <ClassFilter
            data={data}
            value={className}
            all={false}
            onChange={(value) => {
              setClassName(value)
              setChanges({})
            }}
          />
          <label className="date-input">
            <CalendarDays size={16} />
            <input
              type="date"
              aria-label="Tanggal absensi"
              value={date}
              max="2027-07-01"
              min="2026-07-01"
              onChange={(event) => {
                setDate(event.target.value)
                setChanges({})
              }}
            />
          </label>
        </div>
        <div>
          <Badge tone={hasSaved ? 'green' : 'yellow'}>
            {hasSaved ? 'Tersimpan' : 'Draf absensi'}
          </Badge>
          {canEdit && (
            <button
              className="text-button"
              onClick={() =>
                setChanges(Object.fromEntries(students.map((student) => [student.id, 'Hadir'])))
              }
            >
              <Check size={15} />
              Semua hadir
            </button>
          )}
        </div>
      </div>
      <div className="table-scroll full-table">
        <table>
          <thead>
            <tr>
              <th>Nama siswa</th>
              <th>NIS</th>
              <th>Kelas</th>
              <th>Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id}>
                <td>
                  <div className="person-cell">
                    <Avatar name={student.name} index={index} />
                    <strong>{student.name}</strong>
                  </div>
                </td>
                <td>{student.number}</td>
                <td>{student.className}</td>
                <td>
                  <div
                    className="attendance-options"
                    role="group"
                    aria-label={`Kehadiran ${student.name}`}
                  >
                    {statuses.map((status) => (
                      <button
                        key={status}
                        aria-pressed={statusOf(student) === status}
                        className={statusOf(student) === status ? `selected status-${status}` : ''}
                        disabled={!canEdit}
                        onClick={() => setChanges({ ...changes, [student.id]: status })}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!students.length && <Empty />}
    </div>
  )
}
export function Grades({ data, user, reload, notify }: PageProps) {
  const [className, setClassName] = useState(data.classes[0]?.name ?? '')
  const [query, setQuery] = useState('')
  const [changes, setChanges] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const canEdit = user.role === 'ADMIN' || user.role === 'TEACHER'
  const students = data.students.filter(
    (student) =>
      student.className === className && student.name.toLowerCase().includes(query.toLowerCase()),
  )
  async function save() {
    const entries = Object.entries(changes)
    if (
      entries.some(
        ([, score]) =>
          score === '' ||
          !Number.isFinite(Number(score)) ||
          Number(score) < 0 ||
          Number(score) > 100,
      )
    ) {
      notify('Nilai harus berupa angka antara 0 dan 100.')
      return
    }
    setBusy(true)
    try {
      for (const [id, score] of entries)
        await api(`/schools/${user.schoolId}/grades/${id}`, 'PATCH', { score: Number(score) })
      await reload()
      setChanges({})
      notify('Nilai berhasil disimpan.')
    } catch (reason) {
      notify((reason as Error).message)
      await reload()
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page-enter academic-page">
      <PageTitle
        eyebrow="PROGRESS OVER PERFECTION"
        title="Nilai & rapor"
        description="Rekap nilai akademik / Semester ganjil 2026/2027"
      >
        <button
          className="button secondary"
          onClick={() =>
            downloadCsv(`nilai-${className}.csv`, [
              ['NIS', 'Nama', 'Kelas', 'Nilai'],
              ...students.map((student) => [
                student.number,
                student.name,
                student.className,
                student.score,
              ]),
            ])
          }
        >
          <Download size={16} />
          Ekspor nilai
        </button>
        {canEdit && (
          <button
            className="button primary"
            onClick={save}
            disabled={busy || !Object.keys(changes).length}
          >
            <Save size={16} />
            {busy ? 'Menyimpan...' : 'Simpan nilai'}
          </button>
        )}
      </PageTitle>
      <div className="data-toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder="Cari nama siswa..." />
        <ClassFilter data={data} value={className} all={false} onChange={setClassName} />
      </div>
      <div className="table-scroll full-table">
        <table>
          <thead>
            <tr>
              <th>Nama siswa</th>
              <th>NIS</th>
              <th>Kelas</th>
              <th>Nilai (0-100)</th>
              <th>Capaian</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id}>
                <td>
                  <div className="person-cell">
                    <Avatar name={student.name} index={index} />
                    <strong>{student.name}</strong>
                  </div>
                </td>
                <td>{student.number}</td>
                <td>{student.className}</td>
                <td>
                  {canEdit ? (
                    <input
                      className="score-input"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      aria-label={`Nilai ${student.name}`}
                      value={changes[student.id] ?? student.score}
                      onChange={(event) =>
                        setChanges({ ...changes, [student.id]: event.target.value })
                      }
                    />
                  ) : (
                    <strong>{student.score}</strong>
                  )}
                </td>
                <td>
                  <Badge
                    tone={
                      student.score >= 90 ? 'green' : student.score >= 75 ? 'lavender' : 'yellow'
                    }
                  >
                    {student.score >= 90
                      ? 'Sangat baik'
                      : student.score >= 75
                        ? 'Tuntas'
                        : 'Pendampingan'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!students.length && <Empty />}
    </div>
  )
}
export function Assignments({ data, user, reload, notify }: PageProps) {
  const [className, setClassName] = useState('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<(typeof data.assignments)[number] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const items = data.assignments.filter(
    (item) =>
      (className === 'all' || item.className === className) &&
      `${item.title} ${item.subject}`.toLowerCase().includes(query.toLowerCase()),
  )
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api(
        `/schools/${user.schoolId}/assignments`,
        'POST',
        Object.fromEntries(new FormData(event.currentTarget)),
      )
      await reload()
      setOpen(false)
      notify('Tugas baru diterbitkan.')
    } catch (reason) {
      setError((reason as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page-enter academic-page">
      <PageTitle
        eyebrow="SMALL STEPS. BIG WINS."
        title="Tugas"
        description={`${data.assignments.length} tugas akademik terdaftar.`}
      >
        {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
          <button
            className="button primary"
            onClick={() => {
              setError('')
              setOpen(true)
            }}
          >
            <Plus size={17} />
            Buat tugas
          </button>
        )}
      </PageTitle>
      <div className="data-toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Cari judul tugas atau mata pelajaran..."
        />
        <ClassFilter data={data} value={className} onChange={setClassName} />
      </div>
      <div className="directory-grid">
        {items.map((item, index) => (
          <article className="assignment-card" key={item.id}>
            <div className="directory-item-top">
              <span className={`subject-icon subject-${index % 2}`}>
                <FileText size={20} />
              </span>
              <Badge tone="lavender">{item.className}</Badge>
            </div>
            <p>{item.subject}</p>
            <h2>{item.title}</h2>
            <div className="deadline-date">
              <CalendarDays size={14} />
              {dateLabel(item.deadline)}
            </div>
            <div className="submission-progress">
              <span>Terkumpul</span>
              <strong>
                {item.submitted} / {item.total}
              </strong>
              <progress value={item.submitted} max={item.total || 1} />
            </div>
            <button className="directory-action" onClick={() => setDetail(item)}>
              Detail tugas
              <ArrowUpRight size={16} />
            </button>
          </article>
        ))}
      </div>
      {!items.length && <Empty title="Belum ada tugas" />}
      <Modal open={open} onClose={() => setOpen(false)} title="Buat tugas">
        <form onSubmit={save}>
          <label>
            Judul tugas
            <input name="title" minLength={3} maxLength={150} required />
          </label>
          <label>
            Mata pelajaran
            <select name="subject">
              {data.subjects.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Kelas
              <select name="className">
                {data.classes.map((item) => (
                  <option key={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              Batas pengumpulan
              <input type="date" name="deadline" required />
            </label>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="form-actions">
            <button className="button secondary" type="button" onClick={() => setOpen(false)}>
              Batal
            </button>
            <button className="button primary" disabled={busy}>
              <Plus size={16} />
              Terbitkan tugas
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.title ?? 'Detail tugas'}
      >
        <div className="detail-fields">
          <p>
            <BookOpen size={16} />
            {detail?.subject}
          </p>
          <p>
            <GraduationCap size={16} />
            Kelas {detail?.className}
          </p>
          <p>
            <CalendarDays size={16} />
            {detail && dateLabel(detail.deadline)}
          </p>
          <p>
            <Check size={16} />
            {detail?.submitted} dari {detail?.total} pengumpulan tercatat.
          </p>
          <Badge tone="neutral">Rekap tugas</Badge>
        </div>
      </Modal>
    </div>
  )
}
export function Schedules({ data, user }: PageProps) {
  const [className, setClassName] = useState(data.classes[0]?.name ?? '')
  const [day, setDay] = useState('Kamis')
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
  const schedule =
    data.schedules?.filter((item) => item.className === className && item.day === day) ?? []
  return (
    <div className="page-enter academic-page">
      <PageTitle
        eyebrow="MAKE ROOM FOR GREAT THINGS"
        title="Jadwal pelajaran"
        description={`${user.role === 'STUDENT' ? 'Jadwal kelasmu' : 'Agenda akademik'} / Semester ganjil 2026/2027`}
      >
        <ClassFilter data={data} value={className} all={false} onChange={setClassName} />
      </PageTitle>
      <div className="day-tabs">
        {days.map((item) => (
          <button
            key={item}
            className={day === item ? 'selected' : ''}
            onClick={() => setDay(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="schedule-list">
        {schedule.map((item, index) => (
          <article className={`schedule-row schedule-${index % 3}`} key={item.id}>
            <div className="schedule-time">
              <Clock3 size={18} />
              <strong>{item.startTime}</strong>
              <span>{item.endTime}</span>
            </div>
            <div className="schedule-subject">
              <Badge tone="neutral">{item.className}</Badge>
              <h2>{item.subject}</h2>
              <span>
                <GraduationCap size={15} />
                {item.teacher}
              </span>
            </div>
            <div className="schedule-room">
              <MapPin size={16} />
              {item.room}
            </div>
          </article>
        ))}
      </div>
      {!schedule.length && (
        <Empty title="Belum ada jadwal" detail={`${day} / Kelas ${className}`} />
      )}
    </div>
  )
}
