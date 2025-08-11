import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer()

    // Require admin
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
    const { data: me } = await supabase.from('users').select('role').eq('id', auth.user.id).maybeSingle()
    if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Ikke autoriseret' }, { status: 403 })

    const { data, error } = await supabase
      .from('weekly_insights')
      .select('id, week_year, week_number, title, published_at, created_at')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: 'Kunne ikke hente liste' }, { status: 500 })

    return NextResponse.json({ insights: data || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Serverfejl' }, { status: 500 })
  }
}

