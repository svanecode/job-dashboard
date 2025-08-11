import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export const revalidate = 60

export async function GET() {
  const supabase = await supabaseServer()
  const { data, error } = await supabase
    .from('weekly_insights_public')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Kunne ikke hente indsigter' }, { status: 500 })
  }
  return NextResponse.json({ insight: data })
}

