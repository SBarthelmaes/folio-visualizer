export interface GTDItem {
  id: string
  text: string
  rawText: string  // clean display text (tags stripped)
  energyTag: string
  projectTags: string[]
  area: string | null
  done: boolean
  originalLine: string  // for write-back matching
}

const AREA_PROJECT_MAP: Record<string, string> = {
  FamilyPlanning: 'Connection',
  DevInfrastructure: 'Work Skills',
  SecondBrain: 'Work Skills',
  EngineeringAgent: 'Work Skills',
  Career: 'Work Skills',
  Investments: 'Investments',
  FinancingLife: 'Investments',
  NewFlat: 'Investments',
  CrossFit: 'Health',
  LivingLarder: 'Health',
  PhotoBooks: 'Wandering',
}

const AREA_KEYWORDS: Record<string, string[]> = {
  Health: ['crossfit', 'nutrition', 'sleep', 'recovery', 'health', 'physical', 'fitness', 'workout', 'gym'],
  Connection: ['fanny', 'family', 'friends', 'relationship', 'tim', 'mehlhose', 'village'],
  'Work Skills': ['trimble', 'supabase', 'vercel', 'github', 'ai', 'infrastructure', 'deploy', 'app', 'code', 'build', 'node', 'docker'],
  Investments: ['coinbase', 'finances', 'budget', 'subscription', 'invest', 'financial', 'money', 'ing', 'apple invoice'],
  Wandering: ['reading', 'exploration', 'ideas', 'wandering', 'book', 'octopus'],
}

function inferArea(text: string, projectTags: string[]): string | null {
  for (const tag of projectTags) {
    const mapped = AREA_PROJECT_MAP[tag]
    if (mapped) return mapped
  }

  const lower = text.toLowerCase()
  for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return area
  }

  return null
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function stripDisplayTags(text: string): string {
  return text
    .replace(/\+\w+/g, '')
    .replace(/@\w+/g, '')
    .replace(/due:\S+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function parseNextActions(markdown: string): GTDItem[] {
  const items: GTDItem[] = []
  const lines = markdown.split('\n')

  let currentEnergyTag = ''

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(@\w+)/)
    if (sectionMatch) {
      currentEnergyTag = sectionMatch[1]
      continue
    }

    const itemMatch = line.match(/^- \[([ x])\] (.+)/)
    if (!itemMatch || !currentEnergyTag) continue

    const done = itemMatch[1] === 'x'
    const text = itemMatch[2].trim()

    const projectTags = [...text.matchAll(/\+(\w+)/g)].map((m) => m[1])
    const area = inferArea(text, projectTags)
    const rawText = stripDisplayTags(text)

    items.push({
      id: simpleHash(line),
      text,
      rawText,
      energyTag: currentEnergyTag,
      projectTags,
      area,
      done,
      originalLine: line,
    })
  }

  return items
}

export function parseInbox(markdown: string): GTDItem[] {
  const items: GTDItem[] = []
  const lines = markdown.split('\n')

  for (const line of lines) {
    const itemMatch = line.match(/^- \[([ x])\] (.+)/)
    if (!itemMatch) continue

    const done = itemMatch[1] === 'x'
    const text = itemMatch[2].trim()
    const projectTags = [...text.matchAll(/\+(\w+)/g)].map((m) => m[1])
    const rawText = stripDisplayTags(text)

    items.push({
      id: simpleHash(line),
      text,
      rawText,
      energyTag: '',
      projectTags,
      area: null,
      done,
      originalLine: line,
    })
  }

  return items
}

export function toggleItemDone(markdown: string, originalLine: string, done: boolean): string {
  const newLine = done
    ? originalLine.replace('- [ ]', '- [x]')
    : originalLine.replace('- [x]', '- [ ]')
  return markdown.replace(originalLine, newLine)
}
