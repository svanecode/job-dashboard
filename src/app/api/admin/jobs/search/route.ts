import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer()

    // Require admin
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) {
      return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
    }
    const { data: me } = await supabase
      .from('users')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle()
    if (!me || me.role !== 'admin') {
      return NextResponse.json({ error: 'Ikke autoriseret' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    if (!q) return NextResponse.json({ jobs: [] })

    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, company, location, publication_date, cfo_score')
      .is('deleted_at', null)
      .gte('cfo_score', 1)
      .or(`title.ilike.%${q}%,company.ilike.%${q}%,description.ilike.%${q}%`)
      .order('cfo_score', { ascending: false })
      .order('publication_date', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: 'Søgning fejlede' }, { status: 500 })
    }

    return NextResponse.json({ jobs: data || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Serverfejl' }, { status: 500 })
  }
}

