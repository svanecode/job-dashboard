import StatsOverviewServer from '@/components/StatsOverviewServer';
import { getJobsFirstPageServer } from '@/services/jobsServer';
import JobTable from '@/components/JobTable';
import ProtectedRoute from '@/components/ProtectedRoute';
import Pagination from '@/components/Pagination';
import UnifiedJobModal from '@/components/UnifiedJobModal';
import AnimatedHeader from '@/components/AnimatedHeader';
import UrlSyncWrapper from '@/components/UrlSyncWrapper';
import SearchInput from '@/components/SearchInput';
import type { SortConfig } from '@/utils/sort';

export const revalidate = 60;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams;
  
  // Parse search parameters for initial data
  const page = Array.isArray(sp.page) 
    ? parseInt(sp.page[0]) 
    : parseInt(sp.page || '1');
  
  const pageSize = Array.isArray(sp.pageSize) 
    ? parseInt(sp.pageSize[0]) 
    : parseInt(sp.pageSize || '20');
  
  const sort: SortConfig = {
    key: Array.isArray(sp.sort) 
      ? (sp.sort[0] as any) || 'date'
      : (sp.sort as any) || 'date',
    dir: Array.isArray(sp.dir) 
      ? (sp.dir[0] as 'asc' | 'desc') || 'desc'
      : (sp.dir as 'asc' | 'desc') || 'desc',
  };
  
  const score = Array.isArray(sp.score) 
    ? sp.score.map(s => parseInt(s)).filter(n => !isNaN(n))
    : sp.score ? [parseInt(sp.score)].filter(n => !isNaN(n)) : undefined;
  
  const location = Array.isArray(sp.location) 
    ? sp.location
    : sp.location ? [sp.location] : undefined;
  
  const q = Array.isArray(sp.q) 
    ? sp.q[0] 
    : sp.q;
  
  // Parse jobStatus filter
  const jobStatus = (sp.jobStatus as 'active' | 'expired') || 'active';

  const initial = await getJobsFirstPageServer(
      { 
        minScore: 1, 
        score, 
        location, 
        q,
        jobStatus 
      },
      sort,
      Number.isFinite(page) && page > 0 ? page : 1,
      pageSize
  );

  return (
    <ProtectedRoute>
      <UrlSyncWrapper>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8"> 
          <main className="space-y-6">
            <AnimatedHeader />
            <StatsOverviewServer />
            <SearchInput />

            <div className="border-t border-white/10 pt-6">
              {/* Send kun initialData. jobStore og hooks håndterer resten */}
              <JobTable initialData={initial} /> 
              <Pagination />
            </div>

            <UnifiedJobModal />
          </main>
        </div>
      </UrlSyncWrapper>
    </ProtectedRoute>
  );
}
