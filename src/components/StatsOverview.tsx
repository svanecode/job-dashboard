'use client';
import { useJobStore } from '@/store/jobStore';

export default function StatsOverview() {
  const { jobs, totalJobs } = useJobStore();

  // Count stats from current page jobs
  const stats = {
    urgent: jobs.filter(job => job.cfo_score === 3).length,
    high: jobs.filter(job => job.cfo_score === 2).length,
    total: totalJobs // Use total from server
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-4">Job Oversigt</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🔥</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-300">Akut behov</p>
              <p className="text-2xl font-bold text-green-100">{stats.urgent}</p>
              <p className="text-xs text-green-400">Score 3</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-300">Høj prioritet</p>
              <p className="text-2xl font-bold text-yellow-100">{stats.high}</p>
              <p className="text-xs text-yellow-400">Score 2</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-300">Total jobs</p>
              <p className="text-2xl font-bold text-blue-100">{stats.total}</p>
              <p className="text-xs text-blue-400">Alle score</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 