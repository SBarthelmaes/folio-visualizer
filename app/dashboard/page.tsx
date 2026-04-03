'use client'

import { useEffect, useState } from 'react'
import type { GTDItem } from '@/lib/gtd-parser'

const AREAS = ['Health', 'Connection', 'Work Skills', 'Investments', 'Wandering']
const AREA_COLORS: Record<string, string> = {
  Health: '#22c55e',
  Connection: '#f59e0b',
  'Work Skills': '#3b82f6',
  Investments: '#8b5cf6',
  Wandering: '#ec4899',
}

export default function DashboardPage() {
  const [items, setItems] = useState<GTDItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/next-actions')
      .then((r) => r.json())
      .then((data: GTDItem[]) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openItems = items.filter((i) => !i.done)
  const total = openItems.length

  const byArea = AREAS.map((area) => ({
    area,
    count: openItems.filter((i) => i.area === area).length,
    color: AREA_COLORS[area],
  }))

  const byEnergy = ['@deep', '@quick', '@home', '@errand', '@work', '@one'].map((tag) => ({
    tag,
    count: openItems.filter((i) => i.energyTag === tag).length,
  })).filter((e) => e.count > 0)

  const maxCount = Math.max(...byArea.map((a) => a.count), 1)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
          {total} open actions
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--border)' }} />
          ))}
        </div>
      )}

      {!loading && (
        <>
          {/* By Area */}
          <div
            className="rounded-2xl p-5 mb-4"
            style={{ background: 'var(--card)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px var(--border)' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Open by area
            </h2>
            <div className="space-y-3">
              {byArea.map(({ area, count, color }) => (
                <div key={area}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                      {area}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {count}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(count / maxCount) * 100}%`,
                        background: color,
                        minWidth: count > 0 ? 8 : 0,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Energy */}
          <div
            className="rounded-2xl p-5 mb-4"
            style={{ background: 'var(--card)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px var(--border)' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Open by context
            </h2>
            <div className="flex flex-wrap gap-2">
              {byEnergy.map(({ tag, count }) => (
                <div
                  key={tag}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'var(--accent-light)' }}
                >
                  <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                    {tag}
                  </span>
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--accent)', color: '#fff', fontSize: '11px' }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--card)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px var(--border)' }}
            >
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Total open</p>
              <p className="text-3xl font-semibold mt-1" style={{ color: 'var(--text)' }}>{total}</p>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--card)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px var(--border)' }}
            >
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Completed</p>
              <p className="text-3xl font-semibold mt-1" style={{ color: 'var(--text)' }}>
                {items.filter((i) => i.done).length}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
