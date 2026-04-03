import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  // On Vercel, use x-forwarded-host to get the canonical public URL
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? ''
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = `${proto}://${host}`

  console.log('[auth/callback] origin:', origin, 'code present:', !!code)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[auth/callback] exchangeCodeForSession error:', error?.message ?? 'none')
    if (!error) {
      return NextResponse.redirect(`${origin}/`)
    }
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
