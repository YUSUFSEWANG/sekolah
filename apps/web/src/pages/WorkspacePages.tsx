import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ArrowUpRight,
  Send,
  FileText,
  Download,
  Save,
  Plus,
  Megaphone,
  CalendarDays,
  ShieldCheck,
  Database,
  LogOut,
  Mail,
  Building2,
  BookOpen,
  LoaderCircle,
  Check,
  ClipboardList,
} from 'lucide-react'
import type { PageProps } from '../App'
import { api, dateLabel, download, downloadCsv, roleNames, type AiResponse } from '../lib/api'
import { Avatar, Badge, Empty, Modal, PageTitle, SearchInput } from '../components/ui'
import { ClassFilter } from './Academic'

export function AiAssistant({ data, user, reload, notify }: PageProps) {
  const [prompt, setPrompt] = useState('')
  const [className, setClassName] = useState('all')
  const [response, setResponse] = useState<AiResponse | null>(null)
  const [lastPrompt, setLastPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState('')
  async function ask(question: string) {
    if (question.trim().length < 3 || busy) return
    setBusy(true)
    setError('')
    setLastPrompt(question)
    setPrompt('')
    setSaved(false)
    setResponse(null)
    try {
      const result = await api<AiResponse>(`/schools/${user.schoolId}/ai`, 'POST', {
        prompt: question,
        ...(className === 'all' ? {} : { className }),
      })
      setResponse(result)
      setDraft(result.content)
    } catch (reason) {
      setError((reason as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function save() {
    setSaving(true)
    try {
      await api(`/schools/${user.schoolId}/reports`, 'POST', {
        title: `Ringkasan akademik ${className === 'all' ? 'sekolah' : className}`,
        content: draft,
      })
      await reload()
      setConfirm(false)
      setSaved(true)
      notify('Draf laporan disimpan setelah ditinjau.')
    } catch (reason) {
      notify((reason as Error).message)
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="page-enter ai-page">
      <PageTitle
        eyebrow="A LITTLE CLARITY GOES A LONG WAY"
        title="EduPilot AI"
        description="Academic insights / SMA Nusantara"
      >
        <Badge tone={data.aiConfigured ? 'green' : 'yellow'}>
          <i />
          {data.aiConfigured ? 'Model AI terhubung' : 'Mode ringkasan otomatis'}
        </Badge>
      </PageTitle>
      <div className="ai-layout">
        <div className="ai-main">
          <div className="ai-conversation">
            {!lastPrompt && (
              <div className="ai-welcome">
                <span className="ai-large-symbol">
                  <Sparkles size={32} />
                </span>
                <h2>
                  Big questions.
                  <br />
                  <span>Clearer answers.</span>
                </h2>
                <p>Apa yang ingin kamu ketahui hari ini, {user.name.split(' ')[0]}?</p>
                <div className="prompt-grid">
                  {[
                    {
                      icon: ClipboardList,
                      title: 'Ringkasan kehadiran',
                      text: 'Buat ringkasan kehadiran berdasarkan data yang tersedia.',
                    },
                    {
                      icon: FileText,
                      title: 'Draf laporan akademik',
                      text: 'Buat draf laporan akademik berdasarkan rekap saat ini.',
                    },
                    {
                      icon: BookOpen,
                      title: 'Perkembangan nilai',
                      text: 'Ringkas nilai dan rekomendasikan tindak lanjut akademik.',
                    },
                  ].map((item) => (
                    <button key={item.title} onClick={() => ask(item.text)}>
                      <item.icon size={20} />
                      <span>{item.title}</span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {lastPrompt && (
              <div className="user-message">
                <Avatar name={user.name} />
                <div>
                  <strong>{user.name}</strong>
                  <p>{lastPrompt}</p>
                </div>
              </div>
            )}
            {busy && (
              <div className="ai-answer loading-answer">
                <Sparkles size={22} />
                <LoaderCircle size={18} className="spin" />
                <span>Menyiapkan ringkasan data...</span>
              </div>
            )}
            {error && (
              <div className="error-message" role="alert">
                {error}
                <button className="text-button" onClick={() => ask(lastPrompt)}>
                  Coba kembali
                </button>
              </div>
            )}
            {response && (
              <div className="ai-answer">
                <div className="ai-answer-heading">
                  <span className="ai-symbol">
                    <Sparkles size={20} />
                  </span>
                  <strong>EduPilot</strong>
                  <Badge tone="neutral">Draf</Badge>
                </div>
                <div className="report-content">{response.content}</div>
                <div className="source-note">
                  <Database size={15} />
                  <span>
                    {response.source}
                    <small>
                      {response.period} / {response.provider}
                    </small>
                  </span>
                </div>
                <div className="answer-actions">
                  <button
                    className="button secondary"
                    onClick={() => setConfirm(true)}
                    disabled={saved}
                  >
                    {saved ? <Check size={15} /> : <Save size={15} />}
                    {saved ? 'Draf tersimpan' : 'Tinjau & simpan'}
                  </button>
                  <button
                    className="button secondary"
                    onClick={() =>
                      download(
                        'draf-edupilot.txt',
                        `${response.content}\n\nSumber: ${response.source}\n${response.period}\n${response.provider}`,
                      )
                    }
                  >
                    <Download size={15} />
                    Unduh draf
                  </button>
                </div>
              </div>
            )}
          </div>
          <form
            className="ai-composer"
            onSubmit={(event) => {
              event.preventDefault()
              void ask(prompt)
            }}
          >
            <textarea
              aria-label="Pertanyaan untuk EduPilot"
              placeholder="Tanyakan tentang kehadiran, nilai, atau laporan..."
              value={prompt}
              maxLength={1000}
              rows={2}
              onChange={(event) => setPrompt(event.target.value)}
            />
            <div>
              <ClassFilter data={data} value={className} onChange={setClassName} />
              <button
                className="send-button"
                aria-label="Kirim pertanyaan"
                disabled={busy || prompt.trim().length < 3}
              >
                <Send size={18} />
              </button>
            </div>
          </form>
          <p className="ai-disclaimer">
            {data.aiConfigured
              ? 'Hasil AI perlu ditinjau. Data pribadi siswa tidak disertakan dalam konteks agregat.'
              : 'Tanpa API key: ringkasan berbasis aturan, bukan jawaban model AI.'}
          </p>
        </div>
        <aside className="ai-context">
          <h3>Konteks workspace</h3>
          <div>
            <Building2 size={18} />
            <span>
              Sekolah<strong>{data.school.name}</strong>
            </span>
          </div>
          <div>
            <CalendarDays size={18} />
            <span>
              Periode<strong>Semester ganjil 2026/2027</strong>
            </span>
          </div>
          <div>
            <ShieldCheck size={18} />
            <span>
              Akses<strong>{roleNames[user.role]}</strong>
            </span>
          </div>
          <div>
            <Database size={18} />
            <span>
              Sumber<strong>{data.demo ? 'Data contoh, Oktober 2026' : 'Database sekolah'}</strong>
            </span>
          </div>
          <div className="context-note">
            <ShieldCheck size={19} />
            <p>Hanya data dalam lingkup akses akunmu yang disertakan.</p>
          </div>
        </aside>
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Tinjau draf laporan"
        description="Periksa isi laporan sebelum menyimpannya ke workspace."
      >
        <label className="draft-label">
          Isi laporan
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={13}
            maxLength={20000}
          />
        </label>
        <div className="form-actions">
          <button className="button secondary" onClick={() => setConfirm(false)}>
            Batal
          </button>
          <button className="button primary" disabled={saving || draft.length < 10} onClick={save}>
            <Save size={16} />
            Konfirmasi & simpan
          </button>
        </div>
      </Modal>
    </div>
  )
}
export function Reports({ data }: PageProps) {
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<(typeof data.reports)[number] | null>(null)
  const navigate = useNavigate()
  const reports = data.reports.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  )
  const exports = [
    {
      title: 'Rekap kehadiran',
      icon: ClipboardList,
      file: 'rekap-kehadiran.csv',
      rows: [
        ['NIS', 'Nama', 'Kelas', 'Status terakhir', 'Hadir periode', 'Sesi periode'],
        ...data.students.map((student) => [
          student.number,
          student.name,
          student.className,
          student.status,
          student.attended,
          student.sessions,
        ]),
      ],
    },
    {
      title: 'Rekap nilai',
      icon: BookOpen,
      file: 'rekap-nilai.csv',
      rows: [
        ['NIS', 'Nama', 'Kelas', 'Nilai'],
        ...data.students.map((student) => [
          student.number,
          student.name,
          student.className,
          student.score,
        ]),
      ],
    },
    {
      title: 'Direktori siswa',
      icon: FileText,
      file: 'direktori-siswa.csv',
      rows: [
        ['NIS', 'Nama', 'Kelas', 'Email'],
        ...data.students.map((student) => [
          student.number,
          student.name,
          student.className,
          student.email,
        ]),
      ],
    },
  ]
  return (
    <div className="page-enter academic-page">
      <PageTitle
        eyebrow="TURN DATA INTO DIRECTION"
        title="Laporan"
        description="Rekap akademik dan draf laporan sekolah."
      >
        <button className="button primary" onClick={() => navigate('/ai-assistant')}>
          <Sparkles size={16} />
          Buat draf laporan
        </button>
      </PageTitle>
      <div className="report-export-grid">
        {exports.map((item) => (
          <button key={item.file} onClick={() => downloadCsv(item.file, item.rows)}>
            <span className="subject-icon">
              <item.icon size={21} />
            </span>
            <span>
              <strong>{item.title}</strong>
              <small>CSV / Tahun ajaran {data.academicYear}</small>
            </span>
            <Download size={19} />
          </button>
        ))}
      </div>
      <div className="section-title report-list-title">
        <h2>
          Draf tersimpan <Badge tone="neutral">{data.reports.length}</Badge>
        </h2>
        <SearchInput value={query} onChange={setQuery} placeholder="Cari laporan..." />
      </div>
      {!reports.length ? (
        <Empty
          title="Belum ada draf tersimpan"
          detail="Laporan yang sudah ditinjau akan muncul di sini."
        />
      ) : (
        <div className="report-list">
          {reports.map((item) => (
            <button key={item.id} onClick={() => setDetail(item)}>
              <FileText size={24} />
              <span>
                <strong>{item.title}</strong>
                <small>{dateLabel(item.createdAt)}</small>
              </span>
              <Badge tone="yellow">Draf ditinjau</Badge>
              <ArrowUpRight size={18} />
            </button>
          ))}
        </div>
      )}
      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.title ?? 'Laporan'}
      >
        <div className="report-content">{detail?.content}</div>
        <div className="form-actions">
          <button
            className="button secondary"
            onClick={() => detail && download(`${detail.title}.txt`, detail.content)}
          >
            <Download size={16} />
            Unduh laporan
          </button>
        </div>
      </Modal>
    </div>
  )
}
export function Announcements({ data, user, reload, notify }: PageProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('Semua')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const items = data.announcements.filter(
    (item) => category === 'Semua' || item.category === category,
  )
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api(
        `/schools/${user.schoolId}/announcements`,
        'POST',
        Object.fromEntries(new FormData(event.currentTarget)),
      )
      await reload()
      setOpen(false)
      notify('Pengumuman berhasil diterbitkan.')
    } catch (reason) {
      setError((reason as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page-enter academic-page">
      <PageTitle
        eyebrow="IN THE KNOW"
        title="Papan pengumuman"
        description="Kabar terbaru dari keluarga Nusantara."
      >
        {['ADMIN', 'PRINCIPAL'].includes(user.role) && (
          <button
            className="button primary"
            onClick={() => {
              setError('')
              setOpen(true)
            }}
          >
            <Plus size={17} />
            Buat pengumuman
          </button>
        )}
      </PageTitle>
      <div className="day-tabs">
        {['Semua', 'Akademik', 'Informasi', 'Kegiatan'].map((item) => (
          <button
            key={item}
            className={category === item ? 'selected' : ''}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="announcements-list">
        {items.map((item, index) => (
          <article className="announcement-full" key={item.id}>
            {item.category === 'EVENT SEKOLAH' && (
              <img src="/campus.jpg" alt="Kegiatan di lingkungan kampus Nusantara" />
            )}
            <div className="announcement-full-content">
              <div>
                <Badge tone={index % 2 ? 'lavender' : 'green'}>{item.category}</Badge>
                <span>{dateLabel(item.date)}</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.content}</p>
              <div className="announcement-author">
                <Avatar name={item.author} index={index} small />
                <span>{item.author}</span>
                <Megaphone size={15} />
              </div>
            </div>
          </article>
        ))}
      </div>
      {!items.length && <Empty title="Belum ada pengumuman" />}
      <Modal open={open} onClose={() => setOpen(false)} title="Buat pengumuman">
        <form onSubmit={save}>
          <label>
            Judul
            <input name="title" minLength={3} maxLength={150} required />
          </label>
          <label>
            Kategori
            <select name="category">
              <option>Akademik</option>
              <option>Informasi</option>
              <option>Kegiatan</option>
            </select>
          </label>
          <label>
            Isi pengumuman
            <textarea name="content" rows={5} minLength={5} maxLength={2000} required />
          </label>
          {error && <p className="error-message">{error}</p>}
          <div className="form-actions">
            <button className="button secondary" type="button" onClick={() => setOpen(false)}>
              Batal
            </button>
            <button className="button primary" disabled={busy}>
              <Megaphone size={16} />
              Terbitkan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export function Settings({
  data,
  user,
  notify,
  profile = false,
}: PageProps & { profile?: boolean }) {
  const navigate = useNavigate()
  async function logout() {
    try {
      await api('/auth/logout', 'POST')
      sessionStorage.setItem('edupilot-logged-out', '1')
      navigate('/login')
    } catch (reason) {
      notify((reason as Error).message)
    }
  }
  return (
    <div className="page-enter settings-page">
      <PageTitle
        eyebrow="YOUR LITTLE CORNER"
        title={profile ? 'Profil saya' : 'Pengaturan'}
        description="Akun, workspace, dan keamanan sesi."
      />
      <section className="profile-overview">
        <Avatar name={user.name} />
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <Badge>{roleNames[user.role]}</Badge>
        </div>
      </section>
      <section className="settings-section">
        <h2>Akun & sekolah</h2>
        {[
          { icon: Mail, title: 'Email', value: user.email },
          { icon: Building2, title: 'Workspace', value: data.school.name },
          { icon: CalendarDays, title: 'Tahun ajaran', value: data.academicYear },
          { icon: ShieldCheck, title: 'Hak akses', value: roleNames[user.role] },
          {
            icon: Database,
            title: 'Penyimpanan',
            value: data.demo ? 'Demo di memori / reset saat server dimulai ulang' : 'PostgreSQL',
          },
        ].map((item) => (
          <div className="settings-row" key={item.title}>
            <item.icon size={18} />
            <span>{item.title}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>
      <section className="settings-section">
        <h2>Sesi & keamanan</h2>
        <div className="settings-row">
          <ShieldCheck size={18} />
          <span>Sesi server</span>
          <Badge>HttpOnly / 8 jam</Badge>
        </div>
        <div className="settings-row">
          <Sparkles size={18} />
          <span>Provider AI</span>
          <strong>{data.aiConfigured ? 'OpenAI / backend' : 'Belum dikonfigurasi'}</strong>
        </div>
        <button className="button danger" onClick={logout}>
          <LogOut size={16} />
          Keluar dari akun
        </button>
      </section>
      {user.role === 'ADMIN' && (
        <section className="settings-section">
          <h2>Audit aktivitas</h2>
          {data.audit.length ? (
            data.audit.slice(0, 15).map((item) => (
              <div className="audit-item" key={item.id}>
                <ShieldCheck size={16} />
                <span>
                  {item.action}
                  <small>
                    {item.actor} / {dateLabel(item.createdAt)}
                  </small>
                </span>
              </div>
            ))
          ) : (
            <Empty title="Belum ada aktivitas" />
          )}
        </section>
      )}
    </div>
  )
}
