import { createClient } from '@/lib/supabase/server'
import { getFileContent, updateFileContent } from '@/lib/github'
import { parseInbox, toggleItemDone } from '@/lib/gtd-parser'
import { NextRequest } from 'next/server'

const INBOX_PATH = 'gtd/INBOX.md'
const NEXT_ACTIONS_PATH = 'gtd/NEXT-ACTIONS.md'
const PROJECTS_PATH = 'gtd/PROJECTS.md'
const SOMEDAY_PATH = 'gtd/SOMEDAY.md'
const WAITING_PATH = 'gtd/WAITING-FOR.md'

const ROUTE_PATHS: Record<string, string> = {
  'next-actions': NEXT_ACTIONS_PATH,
  projects: PROJECTS_PATH,
  someday: SOMEDAY_PATH,
  waiting: WAITING_PATH,
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await getFileContent(INBOX_PATH)
  const items = parseInbox(content).filter((item) => !item.done)
  return Response.json(items)
}

// Route item from inbox to another GTD list, or dismiss (delete from inbox)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { originalLine, destination } = await request.json()
  // destination: 'dismiss' | 'next-actions' | 'projects' | 'someday' | 'waiting'

  if (!originalLine || !destination) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Remove from inbox (mark as done)
  const { content: inboxContent, sha: inboxSha } = await getFileContent(INBOX_PATH)
  const updatedInbox = toggleItemDone(inboxContent, originalLine, true)
  await updateFileContent(INBOX_PATH, updatedInbox, inboxSha, 'Process inbox item via Folio app')

  // Append to destination file (if not just dismissing)
  if (destination !== 'dismiss' && ROUTE_PATHS[destination]) {
    const itemText = originalLine.replace(/^- \[[ x]\] /, '').trim()
    const newLine = `- [ ] ${itemText}`

    const { content: destContent, sha: destSha } = await getFileContent(ROUTE_PATHS[destination])
    const updatedDest = destContent.trimEnd() + '\n' + newLine + '\n'
    await updateFileContent(
      ROUTE_PATHS[destination],
      updatedDest,
      destSha,
      `Route inbox item to ${destination} via Folio app`
    )
  }

  return Response.json({ ok: true })
}
