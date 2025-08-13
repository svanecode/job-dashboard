'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { authService, User } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const refreshUser = async () => {
    try {
      console.log('AuthContext: Refreshing user...');
      const currentUser = await authService.getCurrentUser();
      console.log('AuthContext: User refresh result:', currentUser?.id);
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      return null;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        // Use getUser() to ensure server-authenticated user data
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('AuthContext: Initial user check:', {
          hasUser: !!user,
          userId: user?.id,
          error: error?.message
        });

        if (user) {
          console.log('AuthContext: Found user, refreshing profile');
          const refreshedUser = await refreshUser();
          if (refreshedUser) {
            setUser(refreshedUser);
          } else {
            console.warn('AuthContext: Failed to refresh user, clearing state');
            setUser(null);
          }
        } else {
          console.log('AuthContext: No authenticated user found');
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    getInitialSession();

    // Helper to check user profile in the background with a short timeout
    const checkUserProfileNonBlocking = () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        // Fire-and-forget; do not block UI loading state on this
        fetch('/api/check-user', { signal: controller.signal })
          .catch(() => {})
          .finally(() => clearTimeout(timeoutId));
      } catch {
        // Ignore
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('AuthContext: Auth state change:', event, 'session:', !!session, 'userId:', session?.user?.id);
        
        if (session?.user) {
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            // During initial sign-in/session, briefly show loading while we refresh the user
            console.log('AuthContext: Processing SIGNED_IN/INITIAL_SESSION event');
            setLoading(true);
            try {
              const refreshedUser = await refreshUser();
              console.log('AuthContext: User refreshed after sign in:', refreshedUser?.id);
              if (refreshedUser) {
                setUser(refreshedUser);
              }
            } finally {
              setLoading(false);
              setInitialized(true);
            }
            // Run profile check in the background
            checkUserProfileNonBlocking();
          } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            // Do not block UI on silent refreshes; update user in the background
            console.log('AuthContext: Processing TOKEN_REFRESHED/USER_UPDATED event');
            const refreshedUser = await refreshUser();
            if (refreshedUser) {
              setUser(refreshedUser);
            }
            checkUserProfileNonBlocking();
            setInitialized(true);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing user state');
          setUser(null);
          setLoading(false);
          setInitialized(true);
        } else {
          console.log('AuthContext: Unhandled auth event:', event, 'session:', !!session);
        }
      }
    );

    // Also handle storage events for cross-tab session sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'supabase-auth') {
        // Re-read session when auth storage changes
        getInitialSession();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const value = {
    user,
    loading,
    initialized,
    signOut,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 