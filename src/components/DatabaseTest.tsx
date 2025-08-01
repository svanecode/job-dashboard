'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Job } from '@/types/job';

export default function DatabaseTest() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [sampleJobs, setSampleJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      if (!supabase) {
        setIsConnected(false);
        setError('Supabase ikke konfigureret');
        setIsLoading(false);
        return;
      }

      try {
        // Test 1: Tæl jobs
        const { count, error: countError } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null);

        if (countError) {
          throw countError;
        }

        setJobCount(count);

        // Test 2: Hent sample jobs
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .is('deleted_at', null)
          .order('cfo_score', { ascending: false })
          .limit(3);

        if (jobsError) {
          throw jobsError;
        }

        setSampleJobs(jobs || []);
        setIsConnected(true);
        setError(null);
      } catch (err: unknown) {
        setIsConnected(false);
        const errorMessage = err instanceof Error ? err.message : 'Ukendt fejl';
        setError(errorMessage);
        console.error('Database test error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    testConnection();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="animate-spin h-5 w-5 text-blue-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-blue-300">Tester database forbindelse...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-300">Database forbindelse fejlede</h3>
            <p className="text-sm text-red-400 mt-1">{error}</p>
            <div className="mt-3 text-sm text-red-400">
              <p><strong>Tjek:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>At du har oprettet en .env.local fil</li>
                <li>At dine Supabase credentials er korrekte</li>
                <li>At dit Supabase projekt er aktivt</li>
                <li>At jobs tabellen eksisterer</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <svg className="h-5 w-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-300">Database forbindelse succesfuld! 🎉</h3>
          <p className="text-sm text-green-400 mt-1">
            Fundet <strong className="text-green-200">{jobCount}</strong> jobs i databasen
          </p>
          
          {sampleJobs.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-green-300 mb-2">Sample jobs:</p>
              <div className="space-y-2">
                {sampleJobs.map((job) => (
                  <div key={job.id} className="bg-gray-700 rounded p-2 text-sm">
                    <div className="font-medium text-white">{job.title || 'Ingen titel'}</div>
                    <div className="text-gray-300">{job.company || 'Ukendt firma'}</div>
                    <div className="text-gray-400 text-xs">
                      Score: {job.cfo_score ?? 'Ikke scoret'} | 
                      Dato: {job.publication_date || 'Ukendt'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 