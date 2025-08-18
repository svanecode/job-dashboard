'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('ProtectedRoute - State:', { loading, initialized, user: user ? 'exists' : 'null', requireAdmin });
    
    // Only check after loading is complete AND we have a definitive user state
    if (!loading && initialized) {
      if (!user) {
        console.log('ProtectedRoute - No user, redirecting to login');
        router.push('/login');
      } else if (requireAdmin && user.role !== 'admin') {
        console.log('ProtectedRoute - Not admin, redirecting to home');
        router.push('/');
      } else {
        console.log('ProtectedRoute - User authenticated, allowing access');
      }
    } else {
      console.log('ProtectedRoute - Still waiting:', { loading, initialized });
    }
  }, [user, loading, initialized, requireAdmin, router]);

  // Show loader only during initial auth resolution
  if (!initialized) {
    console.log('ProtectedRoute - Showing initial loader (not initialized)');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show loader only if still loading AND we have a user (to avoid flash)
  if (loading && user) {
    console.log('ProtectedRoute - Showing loading spinner (loading with user)');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not loading and no user, redirect should happen, but show fallback
  if (!loading && !user) {
    console.log('ProtectedRoute - No user after loading, showing login link');
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        <div className="text-center">
          <p className="mb-4">Du skal være logget ind for at se denne side</p>
          <a href="/login" className="underline text-indigo-400 hover:text-indigo-300">Log ind</a>
        </div>
      </div>
    );
  }

  if (requireAdmin && user && user.role !== 'admin') {
    console.log('ProtectedRoute - User not admin, will redirect');
    return null; // Will redirect to home
  }

  console.log('ProtectedRoute - Rendering protected content');
  return <>{children}</>;
} 