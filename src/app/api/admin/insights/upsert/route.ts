import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const { week_year, week_number, title, intro, published_at, items, slug, tags, hero_image_url, is_featured } = payload || {}

    if (!week_year || !week_number || !title) {
      return NextResponse.json({ error: 'Manglende felter' }, { status: 400 })
    }

    const supabase = await supabaseServer()

    // Require admin
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) {
      return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
    }
    const { data: me, error: meError } = await supabase
      .from('users')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle()
    if (meError) {
      return NextResponse.json({ error: 'Kunne ikke læse bruger' }, { status: 500 })
    }
    if (!me || me.role !== 'admin') {
      return NextResponse.json({ error: 'Ikke autoriseret' }, { status: 403 })
    }

    const { data, error } = await supabase
      .rpc('upsert_weekly_insight_with_items', {
        p_week_year: week_year,
        p_week_number: week_number,
        p_title: title,
        p_intro: intro || '',
        p_published_at: published_at,
        p_items: items || [],
        p_slug: slug || null,
        p_tags: tags || null,
        p_hero_image_url: hero_image_url || null,
        p_is_featured: is_featured ?? null,
      })

    if (error) {
      return NextResponse.json({ error: 'Kunne ikke gemme indsigt', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Serverfejl'
    return NextResponse.json({ error: 'Serverfejl', details: msg }, { status: 500 })
  }
}

