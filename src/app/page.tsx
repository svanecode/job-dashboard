import StatsOverviewServer from '@/components/StatsOverviewServer';
import { getJobsFirstPageServer } from '@/services/jobsServer';
import JobTable from '@/components/JobTable';
import ProtectedRoute from '@/components/ProtectedRoute';
import FilterPopupButton from '@/components/FilterPopupButton';
import ResultsCount from '@/components/ResultsCount';
import Pagination from '@/components/Pagination';
import JobModal from '@/components/JobModal';
import AnimatedHeader from '@/components/AnimatedHeader';
import UrlSyncWrapper from '@/components/UrlSyncWrapper';

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

  const page = Number(pageParam);
  const score = scoreParam ? scoreParam.split(',').map(Number) : undefined;
  const location = locationParam ? locationParam.split(',') : undefined;
  const q = qParam || undefined;

  let initial;
  try {
    initial = await getJobsFirstPageServer(
      { minScore: 1, score, location, q },
      { key: 'score', dir: 'desc' },
      Number.isFinite(page) && page > 0 ? page : 1,
      20
    );
  } catch (error) {
    console.error('Failed to fetch initial jobs:', error);
    // Provide fallback data to prevent SSR failure
    initial = { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }

  return (
    <ProtectedRoute>
      <UrlSyncWrapper>
        <main className="space-y-6">
          <div className="flex items-center justify-between">
            <AnimatedHeader />
          </div>

          <StatsOverviewServer />

          <div className="flex items-center justify-between">
            <ResultsCount />
            <FilterPopupButton />
          </div>
          <JobTable initialData={initial} />
          <Pagination />

          <JobModal />
        </main>
      </UrlSyncWrapper>
    </ProtectedRoute>
  );
}
