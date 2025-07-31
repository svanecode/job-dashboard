import StatsOverview from '@/components/StatsOverview';
import FilterBar from '@/components/FilterBar';
import ResultsCount from '@/components/ResultsCount';
import JobTable from '@/components/JobTable';
import JobModal from '@/components/JobModal';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            KPMG CFO Interim Dashboard
          </h1>
          <p className="text-gray-600">
            Find virksomheder der har behov for CFO Interim Assistance
          </p>
        </div>

        {/* Stats Overview */}
        <StatsOverview />

        {/* Filter Bar */}
        <FilterBar />

        {/* Results Count */}
        <ResultsCount />

        {/* Job Table */}
        <JobTable />

        {/* Job Modal */}
        <JobModal />
      </div>
    </div>
  );
}
