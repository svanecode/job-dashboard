'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      if (!supabase) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

             try {
         // Test connection by fetching a single row
         const { error: dbError } = await supabase
           .from('jobs')
           .select('id')
           .limit(1);

         setIsConnected(!dbError);
       } catch {
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  if (isLoading) {
    return null;
  }

  if (isConnected === null) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg text-sm font-medium shadow-lg ${
      isConnected 
        ? 'bg-green-900/80 text-green-200 border border-green-700 backdrop-blur-sm' 
        : 'bg-yellow-900/80 text-yellow-200 border border-yellow-700 backdrop-blur-sm'
    }`}>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-yellow-400'
        }`} />
        <span>
          {isConnected ? '🟢 Supabase forbundet' : '🟡 Bruger mock data'}
        </span>
      </div>
    </div>
  );
} 