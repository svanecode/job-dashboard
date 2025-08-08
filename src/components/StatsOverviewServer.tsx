// Server Component
import { getKpisServer } from '@/services/kpiService';
import ScoreSummaryCard from './ScoreSummaryCard';

export const revalidate = 60;

export default async function StatsOverviewServer() {
  try {
    const kpis = await getKpisServer(); // { urgent, high, low, total }
    
    // Add safety checks and fallback values
    const urgent = kpis?.urgent ?? 0;
    const high = kpis?.high ?? 0;
    const low = kpis?.low ?? 0;
    const total = kpis?.total ?? 0;
    
    return (
      <ScoreSummaryCard
        count3={urgent}
        count2={high}
        count1={low}
      />
    );
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    // Fallback to zero values if there's an error
    return (
      <ScoreSummaryCard
        count3={0}
        count2={0}
        count1={0}
      />
    );
  }
} 