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
    { minScore: 1 },              // standardfilter
    { key: 'score', dir: 'desc' },// standard sort
    1,                            // page
    20                            // pageSize
  );

  return (
    <ProtectedRoute>
      <UrlSyncWrapper>
        <main className="bg-radial relative min-h-screen text-slate-200 overflow-x-hidden w-full max-w-full">
          {/* Noise overlay */}
          <div className="noise" />

          {/* UserMenu - Fixed position with high z-index */}
          <div className="fixed top-6 right-4 md:top-10 md:right-8 z-[9999]">
            <UserMenu />
          </div>

          {/* Main content */}
          <div className="relative z-10 overflow-x-hidden w-full max-w-full">
            {/* Header - Mobile container, Desktop centered */}
            <div className="container-mobile md:container mx-auto py-6 md:py-10 overflow-hidden w-full max-w-full">
              <div className="flex justify-between items-start mb-8">
                <AnimatedHeader />
              </div>
            </div>

            {/* Main content area - All components with same width */}
            <div className="container-mobile md:container mx-auto overflow-hidden w-full max-w-full">
              {/* Score Summary Card - Server rendered */}
              <section className="mb-3 md:mb-4">
                <StatsOverviewServer />
              </section>

              {/* Desktop Filter Bar - Floating glass card */}
              <section className="mt-4 md:mt-6 mb-6">
                <FilterBar />
              </section>

              {/* Results Count */}
              <div className="mb-4">
                <ResultsCount />
              </div>

              {/* Job Table - Handles responsive display internally */}
              <div className="mb-6">
                <JobTable initialData={initial} />
              </div>

              {/* Pagination */}
              <div className="mb-6">
                <Pagination />
              </div>
            </div>
          </div>

          {/* Mobile Filter Bar - Hidden on desktop */}
          <div className="md:hidden">
            <MobileFilterBar />
          </div>

          {/* Job Modal */}
          <JobModal />

          {/* ChatBot */}
          <ChatBot />
        </main>
      </UrlSyncWrapper>
    </ProtectedRoute>
  );
}
