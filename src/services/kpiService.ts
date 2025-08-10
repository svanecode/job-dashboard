import { supabaseServer } from '@/lib/supabase/server';

export type Kpis = { urgent: number; high: number; low: number; total: number };

export async function getKpisServer(): Promise<Kpis> {
  const sb = supabaseServer();

  // Count per score directly to avoid any RPC drift
  const [urgentRes, highRes, lowRes] = await Promise.all([
    sb
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('cfo_score', 3),
    sb
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('cfo_score', 2),
    sb
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('cfo_score', 1),
  ]);

  const urgent = urgentRes.error ? 0 : urgentRes.count ?? 0;
  const high = highRes.error ? 0 : highRes.count ?? 0;
  const low = lowRes.error ? 0 : lowRes.count ?? 0;
  const total = urgent + high + low;

  return { urgent, high, low, total };
}