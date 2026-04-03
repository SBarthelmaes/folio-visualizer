'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { GTDItem } from '@/lib/gtd-parser'

type Destination = 'next-actions' | 'projects' | 'someday' | 'waiting' | 'dismiss'

const DESTINATIONS: { value: Destination; label: string; emoji: string }[] = [
  { value: 'next-actions', label: 'Next Actions', emoji: '✓' },
  { value: 'projects', label: 'Projects', emoji: '📁' },
  { value: 'someday', label: 'Someday', emoji: '☁️' },
  { value: 'waiting', label: 'Waiting For', emoji: '⏳' },
  { value: 'dismiss', label: 'Dismiss', emoji: '✕' },
]

export default function InboxPage() {
  const [items, setItems] = useState<GTDItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [routing, setRouting] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<GTDItem | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/inbox')
      if (!res.ok) throw new Error()
      const data: GTDItem[] = await res.json()
      setItems(data)
    } catch {
      setError('Could not load inbox.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  async function routeItem(item: GTDItem, destination: Destination) {
    setRouting(item.id)
    setActiveItem(null)

    // Optimistic remove
    setItems((prev) => prev.filter((i) => i.id !== item.id))

    try {
      const res = await fetch('/api/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalLine: item.originalLine, destination }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revert
      setItems((prev) => [item, ...prev])
    } finally {
      setRouting(null)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          Inbox
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
          {items.length} to process
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--border)' }} />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-2xl">📭</p>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Inbox zero</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Nothing left to process</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <InboxCard
            key={item.id}
            item={item}
            routing={routing === item.id}
            active={activeItem?.id === item.id}
            onTap={() => setActiveItem(activeItem?.id === item.id ? null : item)}
            onRoute={(dest) => routeItem(item, dest)}
          />
        ))}
      </div>

      {/* Route picker overlay */}
      {activeItem && (
        <div
          className="fixed inset-0 z-40 flex items-end"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setActiveItem(null)}
        >
          <div
            className="w-full rounded-t-3xl p-6 space-y-3"
            style={{ background: 'var(--card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-medium mb-4" style={{ color: 'var(--muted)' }}>
              Route to...
            </p>
            <p className="text-sm font-medium mb-5 line-clamp-2" style={{ color: 'var(--text)' }}>
              {activeItem.rawText}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DESTINATIONS.map((dest) => (
                <button
                  key={dest.value}
                  onClick={() => routeItem(activeItem, dest.value)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-left transition-colors"
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span className="text-lg">{dest.emoji}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {dest.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InboxCard({
  item,
  routing,
  active,
  onTap,
  onRoute,
}: {
  item: GTDItem
  routing: boolean
  active: boolean
  onTap: () => void
  onRoute: (dest: Destination) => void
}) {
  const startX = useRef(0)

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientX - startX.current
    if (delta > 60) onRoute('next-actions')
    else if (delta < -60) onRoute('dismiss')
    else onTap()
  }

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-2xl transition-opacity cursor-pointer select-none"
      style={{
        background: active ? 'var(--accent-light)' : 'var(--card)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px var(--border)',
        opacity: routing ? 0.4 : 1,
        border: active ? '1px solid var(--accent)' : '1px solid transparent',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onTap}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          {item.rawText}
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  )
}
