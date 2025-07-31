'use client';
import { useJobStore } from '@/store/jobStore';

export default function StatsOverview() {
  const { jobs } = useJobStore();
  
  const stats = {
    urgent: jobs.filter(job => job.score === 3).length,
    high: jobs.filter(job => job.score === 2).length,
    total: jobs.length
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Oversigt</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🔥</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Akut behov</p>
              <p className="text-2xl font-bold text-green-900">{stats.urgent}</p>
              <p className="text-xs text-green-600">Score 3</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">Høj prioritet</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.high}</p>
              <p className="text-xs text-yellow-600">Score 2</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Total jobs</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-xs text-blue-600">Alle score</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 