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
    console.log('ProtectedRoute - loading:', loading, 'user:', user);
    // Only check after loading is complete AND we have a definitive user state
    if (!loading && user !== undefined) {
      if (!user) {
        console.log('ProtectedRoute - No user, redirecting to login');
        router.push('/login');
      } else if (requireAdmin && user.role !== 'admin') {
        console.log('ProtectedRoute - Not admin, redirecting to home');
        router.push('/');
      } else {
        console.log('ProtectedRoute - User authenticated, allowing access');
      }
    }
  }, [user, loading, requireAdmin, router]);

  // Only show full-screen loader during the initial auth resolution
  if (!initialized || loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    // Failsafe: show a quick link to login if redirect doesn't happen
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        <a href="/login" className="underline">Log ind</a>
      </div>
    );
  }

  if (requireAdmin && user.role !== 'admin') {
    return null; // Will redirect to home
  }

  return <>{children}</>;
} 