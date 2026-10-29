import type { ButtonHTMLAttributes, ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import { X, LoaderCircle, Search, Inbox, ArrowUpRight } from 'lucide-react'
import { initials } from '../lib/api'

export function IconButton({
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button type="button" className="icon-button" aria-label={label} {...props}>
            {children}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip" sideOffset={7}>
            {label}
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
export function Avatar({
  name,
  index = 0,
  small = false,
}: {
  name: string
  index?: number
  small?: boolean
}) {
  return (
    <span className={`avatar avatar-${index % 5} ${small ? 'avatar-small' : ''}`}>
      {initials(name)}
    </span>
  )
}
export function Badge({ children, tone = 'green' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}
export function Empty({ title = 'Belum ada data', detail }: { title?: string; detail?: string }) {
  return (
    <div className="empty">
      <Inbox size={30} />
      <h3>{title}</h3>
      {detail && <p>{detail}</p>}
    </div>
  )
}
export function Loading() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" size={28} />
      <span>Menyiapkan ruang kerjamu...</span>
    </div>
  )
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(state: boolean) => {
        if (!state) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal">
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>
                {description ?? 'SMA Nusantara / Tahun ajaran 2026/2027'}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="icon-button" aria-label="Tutup dialog">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari nama, NIS, atau kelas...',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="search-input">
      <Search size={17} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </label>
  )
}
export function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>
          {title}
          <span className="heading-dot">.</span>
        </h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  )
}
export function SectionTitle({
  title,
  children,
  action,
}: {
  title: string
  children?: ReactNode
  action?: () => void
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {children}
      </div>
      {action && (
        <button className="text-button" onClick={action}>
          Lihat semua <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  )
}
