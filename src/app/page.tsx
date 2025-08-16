'use client'; // VIGTIGT: Gør siden til en Client Component

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Job } from '@/types/job';

import ProtectedRoute from '@/components/ProtectedRoute';
import JobTable from '@/components/JobTable';
// StatsOverviewServer removed temporarily as it's a Server Component
import FilterBarDesktop from '@/components/FilterBarDesktop';

// Skeleton component for loading state
function Skeleton() {
  return (
    <div className="w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-4 animate-pulse max-w-full overflow-hidden">
      <div className="h-20 bg-white/10 rounded"></div>
    </div>
  );
}

// Indre komponent der bruger useSearchParams
function PageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobsData, setJobsData] = useState<any>(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Kør kun datahentning, når vi ved, om brugeren er logget ind.
    if (authLoading) {
      return; // Vent, indtil login-tjek er færdigt.
    }

    // Hvis ingen bruger, skal vi ikke hente data (ProtectedRoute vil omdirigere).
    if (!user) {
      setJobsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      setJobsLoading(true);
      setError(null);
      try {
        // Vi bruger den nye jobs API-rute til at hente data sikkert.
        const response = await fetch(`/api/jobs?${searchParams.toString()}`);
        if (!response.ok) {
          throw new Error('Kunne ikke hente jobdata fra serveren.');
        }
        const data = await response.json();
        setJobsData(data);
      } catch (err) {
        console.error("Fejl under hentning af jobs:", err);
        setError("Der opstod en fejl. Prøv venligst at genindlæse siden.");
      } finally {
        setJobsLoading(false);
      }
    };

    fetchInitialData();
  }, [user, authLoading, searchParams]); // Genindlæs data, hvis bruger eller filtre ændres.

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      <Skeleton />
      <Skeleton />
      <Skeleton />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* StatsOverviewServer removed temporarily - will add client-side version later */}
      <FilterBarDesktop />

      {jobsLoading || authLoading ? (
        renderLoadingSkeleton()
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : jobsData ? (
        <JobTable initialData={jobsData} />
      ) : (
        <div className="text-center text-neutral-500">Ingen jobdata fundet.</div>
      )}
    </div>
  );
}

// Hovedkomponent der indkapsler PageContent i Suspense
export default function Page() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Loading...</div>}>
        <PageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
