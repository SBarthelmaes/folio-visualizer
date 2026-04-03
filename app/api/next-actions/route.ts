import { createClient } from '@/lib/supabase/server'
import { getFileContent, updateFileContent } from '@/lib/github'
import { parseNextActions, toggleItemDone } from '@/lib/gtd-parser'
import { NextRequest } from 'next/server'

const FILE_PATH = 'gtd/NEXT-ACTIONS.md'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await getFileContent(FILE_PATH)
  const items = parseNextActions(content)
  return Response.json(items)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { originalLine, done } = await request.json()
  if (!originalLine || typeof done !== 'boolean') {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { content, sha } = await getFileContent(FILE_PATH)
  const updated = toggleItemDone(content, originalLine, done)

  await updateFileContent(
    FILE_PATH,
    updated,
    sha,
    done ? 'Complete task via Folio app' : 'Reopen task via Folio app'
  )

  return Response.json({ ok: true })
}
