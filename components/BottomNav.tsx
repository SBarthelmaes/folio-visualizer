'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/',
    label: 'Next Actions',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    href: '/inbox',
    label: 'Inbox',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent)' : 'var(--muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-4 pb-safe"
      style={{
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        height: '64px',
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
      }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors"
            style={{ minWidth: 64 }}
          >
            {tab.icon(active)}
            <span
              className="text-xs font-medium"
              style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
