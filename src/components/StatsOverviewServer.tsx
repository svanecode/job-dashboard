// Server Component
import { getKpisServer } from '@/services/kpiService';
import ScoreSummaryCard from './ScoreSummaryCard';

export const revalidate = 60;

export default async function StatsOverviewServer() {
  const kpis = await getKpisServer(); // { urgent, high, low, total }
  const urgent = kpis.urgent ?? 0;
  const high   = kpis.high ?? 0;
  const total  = kpis.total ?? 0;
  const low    = kpis.low ?? Math.max(total - urgent - high, 0);

  return (
    <ScoreSummaryCard
      count3={urgent}
      count2={high}
      count1={low}
    />
  );
} 