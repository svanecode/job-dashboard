import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer()

    // Support both form POST and JSON
    let email: string | null = null
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await req.json()
      email = (body?.email || '').trim()
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      email = String(form.get('email') || '').trim()
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Ugyldig e-mail' }, { status: 400 })
    }

    const { error } = await supabase
      .from('insights_subscribers')
      .insert({ email })
      .select()
      .single()

    if (error && !error.message.includes('duplicate')) {
      return NextResponse.json({ error: 'Kunne ikke tilmelde' }, { status: 500 })
    }

    return NextResponse.redirect(new URL('/insights?subscribed=1', req.url), { status: 303 })
  } catch (err) {
    return NextResponse.json({ error: 'Serverfejl' }, { status: 500 })
  }
}

