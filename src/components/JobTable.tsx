'use client';
import { useJobStore } from '@/store/jobStore';
import ScoreBadge from './ScoreBadge';
import { Job } from '@/types/job';

export default function JobTable() {
  const { paginatedJobs, openJobModal } = useJobStore();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK');
  };

  const handleRowClick = (job: Job) => {
    openJobModal(job);
  };

  if (paginatedJobs.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
          </svg>
          <p className="text-gray-300 text-lg">Ingen jobs fundet med de valgte filtre</p>
          <p className="text-gray-400 text-sm">Prøv at ændre dine søgekriterier</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Firma
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Titel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Lokation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Dato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Link
              </th>
            </tr>
          </thead>
                          <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {paginatedJobs.map((job) => (
              <tr
                key={job.id}
                onClick={() => handleRowClick(job)}
                className="hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <ScoreBadge score={job.cfo_score} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{job.company || 'Ukendt firma'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-white font-medium">{job.title || 'Ingen titel'}</div>
                  <div className="text-sm text-gray-400 truncate max-w-xs">
                    {job.description ? job.description.substring(0, 100) + '...' : 'Ingen beskrivelse'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{job.location || 'Ukendt lokation'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{job.publication_date ? formatDate(job.publication_date) : 'Ukendt dato'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {job.job_url ? (
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Åbn →
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">Ingen link</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 