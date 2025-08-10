import StatsOverviewServer from '@/components/StatsOverviewServer';
import { getJobsFirstPageServer } from '@/services/jobsServer';
import JobTable from '@/components/JobTable';
import ProtectedRoute from '@/components/ProtectedRoute';
import FilterBar from '@/components/FilterBar';
import MobileFilterBar from '@/components/MobileFilterBar';
import ResultsCount from '@/components/ResultsCount';
import Pagination from '@/components/Pagination';
import ChatBot from '@/components/ChatBot';
import UserMenu from '@/components/UserMenu';
import JobModal from '@/components/JobModal';
import AnimatedHeader from '@/components/AnimatedHeader';
import UrlSyncWrapper from '@/components/UrlSyncWrapper';

export const revalidate = 60;

export default async function Page() {
  const initial = await getJobsFirstPageServer(
    { minScore: 1 },
    { key: 'score', dir: 'desc' },
    1,
    20
  );

  return (
    <ProtectedRoute>
      <UrlSyncWrapper>
        <main className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <AnimatedHeader />
            <UserMenu />
          </div>

          <StatsOverviewServer />

          <div className="hidden md:block">
            <FilterBar />
          </div>
          <div className="md:hidden">
            <MobileFilterBar />
          </div>

          <ResultsCount />
          <JobTable initialData={initial} />
          <Pagination />

          <JobModal />
          <ChatBot />
        </main>
      </UrlSyncWrapper>
    </ProtectedRoute>
  );
}
