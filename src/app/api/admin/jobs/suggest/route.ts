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
    const company = (searchParams.get('company') || '').trim()
    const title = (searchParams.get('title') || '').trim()

    // Suggest companies
    let companies: string[] = []
    if (company.length >= 1) {
      const { data } = await supabase
        .from('jobs')
        .select('company')
        .is('deleted_at', null)
        .gte('cfo_score', 1)
        .ilike('company', `%${company}%`)
        .order('company', { ascending: true })
        .limit(50)
      const uniq = new Set<string>()
      for (const row of data || []) {
        const c = (row as any).company as string | null
        if (c) uniq.add(c)
        if (uniq.size >= 10) break
      }
      companies = Array.from(uniq)
    }

    // Suggest titles
    let titles: string[] = []
    if (title.length >= 1) {
      const { data } = await supabase
        .from('jobs')
        .select('title')
        .is('deleted_at', null)
        .gte('cfo_score', 1)
        .ilike('title', `%${title}%`)
        .order('title', { ascending: true })
        .limit(50)
      const uniq = new Set<string>()
      for (const row of data || []) {
        const t = (row as any).title as string | null
        if (t) uniq.add(t)
        if (uniq.size >= 10) break
      }
      titles = Array.from(uniq)
    }

    // Jobs filtered by both (if provided) or either
    let jobs: any[] = []
    if (company || title) {
      let query = supabase
        .from('jobs')
        .select('id, title, company, location, publication_date, cfo_score')
        .is('deleted_at', null)
        .gte('cfo_score', 1)
      if (company) query = query.ilike('company', `%${company}%`)
      if (title) query = query.ilike('title', `%${title}%`)
      const { data } = await query
        .order('cfo_score', { ascending: false })
        .order('publication_date', { ascending: false })
        .limit(20)
      jobs = data || []
    }

    return NextResponse.json({ companies, titles, jobs })
  } catch (e) {
    return NextResponse.json({ error: 'Serverfejl' }, { status: 500 })
  }
}

