'use client';
import { useJobStore } from '@/store/jobStore';

export default function ResultsCount() {
  const { totalJobs, jobs } = useJobStore();

  const currentJobsCount = jobs.length;
  const isFiltered = currentJobsCount !== totalJobs;

  return (
    <div className="mb-4">
      <p className="text-sm text-gray-400">
                     {isFiltered ? (
               <>
                 Viser <span className="font-medium text-white">{currentJobsCount}</span> af <span className="font-medium text-white">{totalJobs}</span> jobs
               </>
             ) : (
               <>
                 Viser alle <span className="font-medium text-white">{totalJobs}</span> jobs
               </>
             )}
      </p>
    </div>
  );
} 