'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function TestAuthPage() {
  const { user, loading, initialized } = useAuth();
  const [authState, setAuthState] = useState<string>('Initializing...');

  useEffect(() => {
    if (loading && !initialized) {
      setAuthState('Loading and not initialized...');
    } else if (loading && initialized) {
      setAuthState('Loading but initialized...');
    } else if (!loading && !initialized) {
      setAuthState('Not loading and not initialized (ERROR!)');
    } else if (!loading && initialized && !user) {
      setAuthState('Ready - No user (should redirect to login)');
    } else if (!loading && initialized && user) {
      setAuthState(`Ready - User: ${user.email} (${user.role})`);
    }
  }, [user, loading, initialized]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Test Side</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Nuværende Status</h2>
            <p className="text-green-400">{authState}</p>
          </div>

          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Raw Values</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-blue-400">loading:</span> {loading.toString()}</p>
              <p><span className="text-blue-400">initialized:</span> {initialized.toString()}</p>
              <p><span className="text-blue-400">user:</span> {user ? `${user.email} (${user.role})` : 'null'}</p>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Handlinger</h2>
            <div className="space-x-4">
              <a 
                href="/" 
                className="inline-block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Gå til forsiden
              </a>
              <a 
                href="/login" 
                className="inline-block bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Gå til login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 