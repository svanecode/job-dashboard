import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { insight_item_id, job_ids } = await req.json()
    if (!insight_item_id || !Array.isArray(job_ids)) {
      return NextResponse.json({ error: 'Manglende felter' }, { status: 400 })
    }

    const supabase = await supabaseServer()

    // Require admin
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return NextResponse.json({ error: 'Ikke logget ind' }, { status: 401 })
    const { data: me } = await supabase.from('users').select('role').eq('id', auth.user.id).maybeSingle()
    if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Ikke autoriseret' }, { status: 403 })

    // Replace mapping
    const { error: delErr } = await supabase.from('weekly_insight_item_jobs').delete().eq('insight_item_id', insight_item_id)
    if (delErr) return NextResponse.json({ error: 'Sletning fejlede' }, { status: 500 })

    const records = job_ids.map((jid: number, idx: number) => ({ insight_item_id, job_id: jid, position: idx + 1 }))
    if (records.length > 0) {
      const { error: insErr } = await supabase.from('weekly_insight_item_jobs').insert(records)
      if (insErr) return NextResponse.json({ error: 'Indsættelse fejlede' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Serverfejl' }, { status: 500 })
  }
}

