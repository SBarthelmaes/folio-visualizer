'use client'

import { useEffect, useState, useCallback } from 'react'
import type { GTDItem } from '@/lib/gtd-parser'

const ENERGY_TAGS = ['@deep', '@quick', '@home', '@errand', '@work', '@one']
const AREAS = ['Health', 'Connection', 'Work Skills', 'Investments', 'Wandering']

export default function NextActionsPage() {
  const [items, setItems] = useState<GTDItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [energyFilter, setEnergyFilter] = useState<string | null>(null)
  const [areaFilter, setAreaFilter] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/next-actions')
      if (!res.ok) throw new Error('Failed to load')
      const data: GTDItem[] = await res.json()
      setItems(data)
    } catch {
      setError('Could not load next actions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  async function toggleDone(item: GTDItem) {
    const newDone = !item.done
    setCompleting(item.id)

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, done: newDone } : i))
    )

    try {
      const res = await fetch('/api/next-actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalLine: item.originalLine, done: newDone }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revert on failure
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, done: item.done } : i))
      )
    } finally {
      setCompleting(null)
    }
  }

  const filtered = items.filter((item) => {
    if (item.done) return false
    if (energyFilter && item.energyTag !== energyFilter) return false
    if (areaFilter && item.area !== areaFilter) return false
    return true
  })

  const activeTags = [...new Set(items.filter((i) => !i.done).map((i) => i.energyTag))]

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          Next Actions
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
          {filtered.length} open
        </p>
      </div>

      {/* Energy filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: 'none' }}>
        <FilterChip
          label="All"
          active={energyFilter === null}
          onClick={() => setEnergyFilter(null)}
        />
        {ENERGY_TAGS.filter((t) => activeTags.includes(t)).map((tag) => (
          <FilterChip
            key={tag}
            label={tag}
            active={energyFilter === tag}
            onClick={() => setEnergyFilter(energyFilter === tag ? null : tag)}
          />
        ))}
      </div>

      {/* Area filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: 'none' }}>
        <FilterChip
          label="All areas"
          active={areaFilter === null}
          onClick={() => setAreaFilter(null)}
          small
        />
        {AREAS.map((area) => (
          <FilterChip
            key={area}
            label={area}
            active={areaFilter === area}
            onClick={() => setAreaFilter(areaFilter === area ? null : area)}
            small
          />
        ))}
      </div>

      {/* Items */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl animate-pulse"
              style={{ background: 'var(--border)' }}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center py-8">{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-2xl">✓</p>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            All clear
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            No open actions for these filters
          </p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((item) => (
          <ActionCard
            key={item.id}
            item={item}
            onToggle={toggleDone}
            completing={completing === item.id}
          />
        ))}
      </div>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
  small,
}: {
  label: string
  active: boolean
  onClick: () => void
  small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full font-medium transition-colors"
      style={{
        padding: small ? '4px 12px' : '6px 14px',
        fontSize: small ? '12px' : '13px',
        background: active ? 'var(--accent)' : 'var(--card)',
        color: active ? '#fff' : 'var(--muted)',
        border: active ? 'none' : '1px solid var(--border)',
        boxShadow: active ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {label}
    </button>
  )
}

function ActionCard({
  item,
  onToggle,
  completing,
}: {
  item: GTDItem
  onToggle: (item: GTDItem) => void
  completing: boolean
}) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-2xl transition-opacity"
      style={{
        background: 'var(--card)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px var(--border)',
        opacity: completing ? 0.5 : 1,
      }}
    >
      {/* Checkbox — 44px minimum tap target */}
      <button
        onClick={() => onToggle(item)}
        disabled={completing}
        className="shrink-0 flex items-center justify-center rounded-lg transition-colors"
        style={{
          width: 44,
          height: 44,
          margin: '-4px 0',
        }}
        aria-label={item.done ? 'Mark incomplete' : 'Mark complete'}
      >
        <span
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 24,
            height: 24,
            border: `2px solid ${item.done ? 'var(--accent)' : 'var(--border)'}`,
            background: item.done ? 'var(--accent)' : 'transparent',
            transition: 'all 0.15s ease',
          }}
        >
          {item.done && (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <polyline points="2 6.5 5.5 10 11 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </button>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-1">
        <p
          className="text-sm leading-snug"
          style={{
            color: item.done ? 'var(--done)' : 'var(--text)',
            textDecoration: item.done ? 'line-through' : 'none',
          }}
        >
          {item.rawText}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span
            className="text-xs font-medium rounded-full px-2 py-0.5"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            {item.energyTag}
          </span>
          {item.area && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {item.area}
            </span>
          )}
          {item.projectTags.map((tag) => (
            <span key={tag} className="text-xs" style={{ color: 'var(--muted)' }}>
              +{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
