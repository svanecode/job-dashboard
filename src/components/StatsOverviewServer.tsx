// Server Component
import { getKpisServer } from '@/services/kpiService';
import StatCard from './StatCard';

export const revalidate = 60;

export default async function StatsOverviewServer() {
  const kpis = await getKpisServer(); // { urgent, high, low, total }
  const urgent = kpis.urgent ?? 0;
  const high   = kpis.high ?? 0;
  const total  = kpis.total ?? 0;
  const low    = kpis.low ?? Math.max(total - urgent - high, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <StatCard 
        title="Akut Behov"
        count={urgent}
        level={3}
        icon="flame"
      />
      <StatCard 
        title="Relevant Behov"
        count={high}
        level={2}
        icon="trend"
      />
      <StatCard 
        title="Lav Relevans"
        count={low}
        level={1}
        icon="bag"
      />
    </div>
  );
} 