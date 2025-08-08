import { supabaseServer } from '@/lib/supabase/server';

export async function getKpisServer() {
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc('kpi_counts');
  
  if (error) throw error;
  
  // Handle array response - take the first element
  const kpiData = Array.isArray(data) ? data[0] : data;
  
  return kpiData as { urgent: number; high: number; low: number; total: number };
} 