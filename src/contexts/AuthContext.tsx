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
  signOut: () => Promise<void>;
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

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  useEffect(() => {
    // 1. Tjek den nuværende session ved start
    const checkInitialSession = async () => {
      try {
        // Tilføj timeout på session check for at undgå at app'en hænger fast
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        const currentUser = session?.user ?? null;
        
        if (currentUser) {
          await refreshUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Fejl under initial session check:", error);
        setUser(null);
      } finally {
        // KRITISK: Sæt altid loading til false og initialized til true
        // uanset om der er en bruger eller ej
        setLoading(false);
        setInitialized(true);
      }
    };

    // Fallback timeout - sikrer at app'en altid bliver initialiseret
    const fallbackTimeout = setTimeout(() => {
      console.warn("AuthContext: Fallback timeout triggered - forcing initialization");
      setLoading(false);
      setInitialized(true);
    }, 6000);

    checkInitialSession().finally(() => {
      clearTimeout(fallbackTimeout);
    });

    // 2. Lyt efter fremtidige ændringer i login-status
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      try {
        const currentUser = session?.user ?? null;
        if (currentUser) {
          await refreshUser(currentUser);
        } else {
          setUser(null);
        }
        // Sæt loading til false ved hver auth state change
        setLoading(false);
      } catch (error) {
        console.error("Fejl under auth state change:", error);
        setUser(null);
        setLoading(false);
      }
    });

    // Ryd op i lytteren, når komponenten forsvinder
    return () => {
      clearTimeout(fallbackTimeout);
      authListener?.subscription.unsubscribe();
    };
  }, [refreshUser]); // Kør kun denne effekt én gang

  const value = { user, loading, initialized, refreshUser: () => refreshUser(user), signOut };

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