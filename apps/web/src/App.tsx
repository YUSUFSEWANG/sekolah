import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  ChartNoAxesCombined,
  Sparkles,
  Megaphone,
  Settings2,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  Menu,
  X,
  ArrowUpRight,
  Command,
  Building2,
  CircleHelp,
  Layers3,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { api, roleNames, type User, type SchoolData, type Role } from './lib/api'
import { Avatar, Badge, IconButton, Loading, Modal } from './components/ui'
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })),
)
import { Students, Directory, Attendance, Grades, Assignments, Schedules } from './pages/Academic'
import { AiAssistant, Reports, Announcements, Settings } from './pages/WorkspacePages'
import './App.css'

const navigation = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'],
    group: 'WORKSPACE',
  },
  {
    path: '/students',
    label: 'Data siswa',
    icon: Users,
    roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'],
    group: '',
  },
  {
    path: '/teachers',
    label: 'Guru & staf',
    icon: GraduationCap,
    roles: ['ADMIN', 'PRINCIPAL'],
    group: '',
  },
  {
    path: '/classes',
    label: 'Kelas',
    icon: Layers3,
    roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'],
    group: '',
  },
  {
    path: '/subjects',
    label: 'Mata pelajaran',
    icon: BookOpen,
    roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'],
    group: '',
  },
  {
    path: '/schedules',
    label: 'Jadwal pelajaran',
    icon: CalendarDays,
    roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'],
    group: 'AKADEMIK',
  },
  {
    path: '/attendance',
    label: 'Absensi',
    icon: ClipboardCheck,
    roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'],
    group: '',
  },
  {
    path: '/assignments',
    label: 'Tugas',
    icon: FileText,
    roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'],
    group: '',
  },
  {
    path: '/grades',
    label: 'Nilai & rapor',
    icon: ChartNoAxesCombined,
    roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'],
    group: '',
  },
  {
    path: '/reports',
    label: 'Laporan',
    icon: FileText,
    roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'],
    group: '',
  },
  {
    path: '/ai-assistant',
    label: 'EduPilot AI',
    icon: Sparkles,
    roles: ['ADMIN', 'PRINCIPAL', 'TEACHER'],
    group: 'LAINNYA',
  },
  {
    path: '/announcements',
    label: 'Pengumuman',
    icon: Megaphone,
    roles: ['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT'],
    group: '',
  },
]
export interface PageProps {
  data: SchoolData
  user: User
  reload: () => Promise<void>
  notify: (message: string) => void
}

interface LoginTarget {
  schoolId?: string
  email?: string
  role?: Role
}

function Workspace() {
  const initialized = useRef(false)
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<SchoolData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobile, setMobile] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [toast, setToast] = useState('')
  const [panel, setPanel] = useState<'notifications' | 'search' | 'school' | 'help' | null>(null)
  const [query, setQuery] = useState('')
  const [serverMode, setServerMode] = useState<'demo' | 'database' | null>(null)
  const [switching, setSwitching] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const notify = (message: string) => setToast(message)
  async function load(member: User) {
    const workspace = await api<SchoolData>(`/schools/${member.schoolId}/workspace`)
    setUser(member)
    setData(workspace)
    setServerMode(workspace.demo ? 'demo' : 'database')
    setError('')
  }
  async function initialize() {
    setLoading(true)
    setError('')
    try {
      const health = await api<{ mode: 'demo' | 'database' }>('/health')
      setServerMode(health.mode)
      let member: User
      try {
        member = await api<User>('/auth/me')
      } catch {
        if (health.mode !== 'demo' || sessionStorage.getItem('edupilot-logged-out')) {
          if (location.pathname !== '/login') navigate('/login')
          return
        }
        member = await api<User>('/auth/demo', 'POST', { role: 'ADMIN' })
      }
      await load(member)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'API tidak tersedia.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      void initialize()
    }
  }, [])
  useEffect(() => {
    setMobile(false)
  }, [location.pathname])
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPanel('search')
      }
      if (event.key === 'Escape') setMobile(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4500)
    return () => clearTimeout(timer)
  }, [toast])
  async function logout() {
    try {
      await api('/auth/logout', 'POST')
      sessionStorage.setItem('edupilot-logged-out', '1')
      setUser(null)
      setData(null)
      navigate('/login')
    } catch (reason) {
      notify((reason as Error).message)
    }
  }
  async function switchRole(role: Role) {
    if (switching || !user) return
    setSwitching(true)
    try {
      const health = await api<{ mode: 'demo' | 'database' }>('/health')
      setServerMode(health.mode)
      if (health.mode !== 'demo') {
        setPanel(null)
        setToast('')
        const target: LoginTarget = {
          schoolId: user.schoolId,
          role,
          email:
            user.schoolId === '8cdfd39e-1d3a-49e1-9af0-46c7773cb02a'
              ? `${role.toLowerCase()}@demo.edupilot.id`
              : undefined,
        }
        navigate('/login', { state: target })
        return
      }
      await load(await api<User>('/auth/demo', 'POST', { role }))
      setPanel(null)
      navigate('/dashboard')
      notify(`Sesi demo: ${roleNames[role]}`)
    } catch (reason) {
      notify((reason as Error).message)
    } finally {
      setSwitching(false)
    }
  }
  if (location.pathname === '/login')
    return (
      <Login
        target={(location.state as LoginTarget | null) ?? undefined}
        onLogin={async (member) => {
          sessionStorage.removeItem('edupilot-logged-out')
          await load(member)
          navigate('/dashboard')
        }}
      />
    )
  if (loading) return <Loading />
  if (error)
    return (
      <div className="connection-error">
        <GraduationCap size={44} />
        <h1>Koneksi belum tersedia</h1>
        <p>{error}</p>
        <button className="button primary" onClick={initialize}>
          Coba lagi
        </button>
      </div>
    )
  if (!user || !data) return <Navigate to="/login" replace />
  const current = navigation.find((item) => item.path === location.pathname)
  const pageProps = { data, user, reload: async () => load(user), notify }
  const visibleNav = navigation.filter((item) => item.roles.includes(user.role))
  const restricted = Boolean(current && !current.roles.includes(user.role))
  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Tutup menu"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'sidebar-open' : ''}`}>
        <NavLink to="/dashboard" className="brand">
          <span className="brand-mark">
            <GraduationCap size={23} strokeWidth={2.2} />
          </span>
          <span>
            edu<span className="brand-light">pilot</span>
            <sup>AI</sup>
          </span>
        </NavLink>
        <button className="school-switch" onClick={() => setPanel('school')}>
          <span className="school-symbol">
            <Building2 size={20} />
          </span>
          <span>
            <strong>{data.school.name}</strong>
            <small>School workspace</small>
          </span>
          <ChevronDown size={15} />
        </button>
        <nav className="main-nav" aria-label="Navigasi utama">
          {visibleNav.map((item) => (
            <div key={item.path}>
              {item.group && <div className="nav-group">{item.group}</div>}
              <NavLink
                to={item.path}
                className={({ isActive }: { isActive: boolean }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.path === '/ai-assistant' && <span className="tiny-tag">AI</span>}
                {item.path === '/assignments' && data.assignments.length > 0 && (
                  <span className="nav-count">{data.assignments.length}</span>
                )}
              </NavLink>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setPanel('help')}>
            <CircleHelp size={18} />
            <span>Pusat bantuan</span>
            <ArrowUpRight size={14} />
          </button>
          <NavLink to="/settings" className="nav-item">
            <Settings2 size={18} />
            <span>Pengaturan</span>
          </NavLink>
          <button className="sidebar-profile" onClick={() => navigate('/profile')}>
            <Avatar name={user.name} />
            <span>
              <strong>{user.name}</strong>
              <small>{roleNames[user.role]}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <IconButton
              label="Buka navigasi"
              onClick={() =>
                window.innerWidth <= 760 ? setMobile(!mobile) : setCollapsed(!collapsed)
              }
            >
              <Menu className="mobile-only" size={20} />
              <PanelLeftClose className="desktop-only" size={18} />
            </IconButton>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {current?.label ?? (location.pathname === '/profile' ? 'Profil saya' : 'Pengaturan')}
            </strong>
          </div>
          <div className="topbar-actions">
            <button className="global-search" onClick={() => setPanel('search')}>
              <Search size={16} />
              <span>Cari sesuatu...</span>
              <span className="keycap">
                <Command size={11} /> K
              </span>
            </button>
            <span className="top-divider" />
            <IconButton label="Notifikasi" onClick={() => setPanel('notifications')}>
              <Bell size={19} />
              <i className="notification-dot" />
            </IconButton>
            <button
              className="profile-trigger"
              onClick={() => navigate('/profile')}
              aria-label="Profil saya"
            >
              <Avatar name={user.name} small />
            </button>
          </div>
        </header>
        <main className="main-content">
          {restricted ? (
            <div className="connection-error access-denied">
              <ShieldCheck size={38} />
              <h1>Akses terbatas</h1>
              <p>Halaman ini tidak tersedia untuk peran {roleNames[user.role]}.</p>
              <button className="button primary" onClick={() => navigate('/dashboard')}>
                Kembali ke dashboard
              </button>
            </div>
          ) : (
            <Routes>
              <Route path="/dashboard" element={<Dashboard {...pageProps} />} />
              <Route path="/students" element={<Students key={location.search} {...pageProps} />} />
              <Route
                path="/teachers"
                element={<Directory key="teachers" {...pageProps} kind="teachers" />}
              />
              <Route
                path="/classes"
                element={<Directory key="classes" {...pageProps} kind="classes" />}
              />
              <Route
                path="/subjects"
                element={<Directory key="subjects" {...pageProps} kind="subjects" />}
              />
              <Route path="/attendance" element={<Attendance {...pageProps} />} />
              <Route path="/assignments" element={<Assignments {...pageProps} />} />
              <Route path="/grades" element={<Grades {...pageProps} />} />
              <Route path="/schedules" element={<Schedules {...pageProps} />} />
              <Route path="/reports" element={<Reports {...pageProps} />} />
              <Route path="/ai-assistant" element={<AiAssistant {...pageProps} />} />
              <Route path="/announcements" element={<Announcements {...pageProps} />} />
              <Route path="/settings" element={<Settings {...pageProps} />} />
              <Route path="/profile" element={<Settings {...pageProps} profile />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          )}
          <footer className="page-footer">
            <span>
              EduPilot <span className="muted">/</span> School, in sync.
            </span>
            <span>
              <i className="live-dot" />
              {data.demo ? 'Demo workspace' : 'Terhubung'}
              <span className="footer-separator">|</span>Tahun ajaran {data.academicYear}
            </span>
          </footer>
        </main>
      </div>
      <Modal
        open={panel === 'notifications'}
        onClose={() => setPanel(null)}
        title="Pusat aktivitas"
      >
        <div className="notification-list">
          {data.announcements.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPanel(null)
                navigate('/announcements')
              }}
            >
              <span className="notification-icon">
                <Megaphone size={18} />
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>
                  {item.author} / {item.date}
                </small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
          {data.audit.slice(0, 5).map((item) => (
            <div className="audit-item" key={item.id}>
              <ShieldCheck size={17} />
              <span>
                {item.action}
                <small>{item.actor}</small>
              </span>
            </div>
          ))}
        </div>
      </Modal>
      <Modal
        open={panel === 'search'}
        onClose={() => {
          setPanel(null)
          setQuery('')
        }}
        title="Cari di workspace"
      >
        <label className="search-input large">
          <Search size={18} />
          <input
            autoFocus
            placeholder="Halaman atau nama siswa..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="search-results">
          {visibleNav
            .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
            .map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  setPanel(null)
                  navigate(item.path)
                }}
              >
                <item.icon size={18} />
                {item.label}
                <ArrowUpRight size={16} />
              </button>
            ))}
          {query.length > 1 &&
            data.students
              .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 5)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setPanel(null)
                    navigate(`/students?q=${encodeURIComponent(item.name)}`)
                  }}
                >
                  <Avatar name={item.name} small />
                  <span>
                    {item.name}
                    <small>
                      {item.className} / {item.number}
                    </small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              ))}
        </div>
      </Modal>
      <Modal open={panel === 'school'} onClose={() => setPanel(null)} title="Workspace sekolah">
        <div className="workspace-info">
          <Building2 size={28} />
          <div>
            <h3>{data.school.name}</h3>
            <p>Tahun ajaran {data.academicYear}</p>
          </div>
          <Badge>Aktif</Badge>
        </div>
        <h3 className="modal-subheading">
          {serverMode === 'demo' ? 'Akun demo' : 'Masuk dengan akun lain'}
        </h3>
        <div className="role-grid">
          {(Object.keys(roleNames) as Role[]).map((role) => (
            <button
              key={role}
              className={user.role === role ? 'selected' : ''}
              disabled={switching}
              onClick={() => switchRole(role)}
            >
              <ShieldCheck size={19} />
              {roleNames[role]}
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
        {serverMode === 'demo' && (
          <p className="form-note">
            Data contoh di memori server. Perubahan direset saat API dimulai ulang.
          </p>
        )}
      </Modal>
      <Modal open={panel === 'help'} onClose={() => setPanel(null)} title="Pusat bantuan">
        <div className="help-content">
          <h3>Workspace SMA Nusantara</h3>
          <p>Hubungi administrator sekolah untuk perubahan akun dan penugasan kelas.</p>
          <a className="button secondary" href="/api/docs" target="_blank" rel="noreferrer">
            Dokumentasi API <ArrowUpRight size={16} />
          </a>
          <button className="button secondary" onClick={logout}>
            <LogOut size={16} /> Keluar dari akun
          </button>
        </div>
      </Modal>
      {toast && (
        <div className="toast" role="status">
          <ShieldCheck size={18} />
          <span>{toast}</span>
          <button aria-label="Tutup pemberitahuan" onClick={() => setToast('')}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
function Login({
  onLogin,
  target,
}: {
  onLogin: (user: User) => Promise<void>
  target?: LoginTarget
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [demo, setDemo] = useState(false)
  useEffect(() => {
    api<{ mode: string }>('/health')
      .then((health) => setDemo(health.mode === 'demo'))
      .catch(() => setError('API belum terhubung.'))
  }, [])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      await onLogin(await api<User>('/auth/login', 'POST', Object.fromEntries(form)))
    } catch (reason) {
      setError((reason as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function enterDemo() {
    setBusy(true)
    setError('')
    try {
      await onLogin(await api<User>('/auth/demo', 'POST', { role: 'ADMIN' }))
    } catch (reason) {
      setError((reason as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="login-page">
      <div className="login-art">
        <img src="/campus.jpg" alt="Lingkungan kampus dengan gedung dan pepohonan" />
        <div className="login-art-content">
          <div className="brand">
            <GraduationCap size={28} />
            edupilot AI
          </div>
          <h1>
            Good days.
            <br />
            Great futures.
          </h1>
          <span>School, in sync.</span>
        </div>
      </div>
      <div className="login-form">
        <span className="eyebrow">YOUR SCHOOL. YOUR SPACE.</span>
        <h1>
          Selamat datang
          <br />
          kembali<span className="heading-dot">.</span>
        </h1>
        <p>
          {target?.role
            ? `Masuk dengan akun ${roleNames[target.role]}.`
            : 'Masuk ke workspace sekolahmu.'}
        </p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              defaultValue={target?.email ?? ''}
              placeholder="nama@sekolah.sch.id"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={1}
              required
            />
          </label>
          <label>
            ID sekolah
            <input
              name="schoolId"
              defaultValue={
                target?.schoolId ?? (demo ? '8cdfd39e-1d3a-49e1-9af0-46c7773cb02a' : '')
              }
              required
            />
          </label>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <button className="button primary" disabled={busy}>
            {busy ? 'Menghubungkan...' : 'Masuk ke workspace'}
            <ArrowRight size={17} />
          </button>
        </form>
        {demo && (
          <button className="button secondary demo-login" onClick={enterDemo} disabled={busy}>
            Buka workspace demo <ArrowUpRight size={17} />
          </button>
        )}
        <span className="login-footer">EduPilot AI / 2026</span>
      </div>
    </div>
  )
}
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Workspace />
      </Suspense>
    </BrowserRouter>
  )
}
