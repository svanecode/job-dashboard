import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { searchParams } = new URL(req.url)
    const weekYear = parseInt(searchParams.get('year') || '')
    const weekNumber = parseInt(searchParams.get('week') || '')
    if (!Number.isFinite(weekYear) || !Number.isFinite(weekNumber)) {
      return NextResponse.json({ error: 'Manglende/ugyldige parametre' }, { status: 400 })
    }

    // Require admin
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
    const { data: me } = await supabase.from('users').select('role').eq('id', auth.user.id).maybeSingle()
    if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Ikke autoriseret' }, { status: 403 })

    const { data, error } = await supabase
      .from('weekly_insights_public')
      .select('*')
      .eq('week_year', weekYear)
      .eq('week_number', weekNumber)
      .maybeSingle()

    if (error) return NextResponse.json({ error: 'Kunne ikke hente indsigt' }, { status: 500 })
    if (!data) return NextResponse.json({ insight: null })
    return NextResponse.json({ insight: data })
  } catch (e) {
    return NextResponse.json({ error: 'Serverfejl' }, { status: 500 })
  }
}

