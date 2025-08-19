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
    // Only check after loading is complete AND we have a definitive user state
    if (!loading && initialized) {
      if (!user) {
        router.push('/login');
      } else if (requireAdmin && user.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, loading, initialized, requireAdmin, router]);

  // Show loader only during initial auth resolution
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show loader only if still loading AND we have a user (to avoid flash)
  if (loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not loading and no user, redirect should happen, but show fallback
  if (!loading && !user) {
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
    return null; // Will redirect to home
  }

  return <>{children}</>;
} 