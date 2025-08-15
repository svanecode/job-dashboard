import StatsOverviewServer from '@/components/StatsOverviewServer';
import { getJobsFirstPageServer } from '@/services/jobsServer';
import JobTable from '@/components/JobTable';
import ProtectedRoute from '@/components/ProtectedRoute';
import Pagination from '@/components/Pagination';
import JobModal from '@/components/JobModal';
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
  const pageParam = Array.isArray(sp?.page) ? sp.page[0] : sp?.page;
  const scoreParam = Array.isArray(sp?.score) ? sp.score[0] : sp?.score;
  const locationParam = Array.isArray(sp?.location) ? sp.location[0] : sp?.location;
  const qParam = Array.isArray(sp?.q) ? sp.q[0] : sp?.q;
  const sortParam = Array.isArray(sp?.sort) ? sp.sort[0] : sp?.sort;
  const dirParam = Array.isArray(sp?.dir) ? sp.dir[0] : sp?.dir;
  const pageSizeParam = Array.isArray(sp?.pageSize) ? sp.pageSize[0] : sp?.pageSize;

  const page = Number(pageParam);
  const score = scoreParam ? scoreParam.split(',').map(Number) : undefined;
  const location = locationParam ? locationParam.split(',') : undefined;
  const q = qParam || undefined;
  const pageSize = pageSizeParam ? Number(pageSizeParam) : 20;
  const sort: SortConfig = sortParam && ['score', 'company', 'title', 'location', 'date'].includes(sortParam) 
    ? { key: sortParam as 'score' | 'company' | 'title' | 'location' | 'date', dir: (dirParam as 'asc' | 'desc') || 'desc' }
    : { key: 'date', dir: 'desc' };

  let initial;
  try {
    initial = await getJobsFirstPageServer(
      { minScore: 1, score, location, q },
      sort,
      Number.isFinite(page) && page > 0 ? page : 1,
      pageSize
    );
  } catch (error) {
    console.error('Failed to fetch initial jobs:', error);
    // Provide fallback data to prevent SSR failure
    initial = { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }

  return (
    <ProtectedRoute>
      <UrlSyncWrapper>
        {/* Tilføj en container med max-width og centrering */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> 
          <main className="space-y-6">
            <div className="flex items-center justify-between">
              <AnimatedHeader />
            </div>

            <StatsOverviewServer />

            {/* Søgefelt */}
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <SearchInput />
              </div>
            </div>

            {/* TILFØJ EN VISUEL ADSKILLELSE HER */}
            <div className="border-t border-white/10 pt-6">
              <JobTable initialData={initial} initialPageSize={pageSize} />
              <Pagination />
            </div>

            <JobModal />
          </main>
        </div>
      </UrlSyncWrapper>
    </ProtectedRoute>
  );
}
