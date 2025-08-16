// src/contexts/AuthContext.tsx
'use client'
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/services/authService';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean; // Denne vil nu kun være 'true' ved den allerførste indlæsning
  initialized: boolean; // Tilføjet tilbage for kompatibilitet
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Starter som 'true'
  const [initialized, setInitialized] = useState(false);

  const refreshUser = useCallback(async (currentUser: any) => {
    if (currentUser) {
      try {
        const userProfile = await authService.getCurrentUser();
        setUser(userProfile);
      } catch (error) {
        console.error("Fejl under hentning af brugerprofil:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // 1. Tjek den nuværende session ved start
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      if (currentUser) {
        await refreshUser(currentUser);
      } else {
        setUser(null);
      }
      // Sæt kun loading til 'false' EFTER det første tjek er færdigt
      setLoading(false);
      setInitialized(true);
    };

    checkInitialSession();

    // 2. Lyt efter fremtidige ændringer i login-status
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        await refreshUser(currentUser);
      } else {
        setUser(null);
      }
    });

    // Ryd op i lytteren, når komponenten forsvinder
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [refreshUser]); // Kør kun denne effekt én gang

  const value = { user, loading, initialized, refreshUser: () => refreshUser(user) };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
    }
  return context;
}; 