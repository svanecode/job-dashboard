'use client';
import { useJobStore } from '@/store/jobStore';

export default function ResultsCount() {
  const { filteredJobs, jobs } = useJobStore();

  // Only count jobs with CFO score
  const scoredJobs = jobs.filter(job => job.cfo_score !== null);
  const totalJobs = scoredJobs.length;
  const filteredCount = filteredJobs.length;
  const isFiltered = filteredCount !== totalJobs;

  return (
    <div className="mb-4">
      <p className="text-sm text-gray-400">
        {isFiltered ? (
          <>
            Viser <span className="font-medium text-white">{filteredCount}</span> af <span className="font-medium text-white">{totalJobs}</span> jobs
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