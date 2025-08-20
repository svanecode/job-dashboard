// src/contexts/AuthContext.tsx
'use client'
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/services/authService';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionCheckBlocked, setSessionCheckBlocked] = useState(false);
  
  // Refs til at forhindre race conditions
  const hasInitialized = useRef(false);
  const isInitializing = useRef(false);
  const sessionRefreshTimeout = useRef<NodeJS.Timeout | null>(null);

  const refreshUser = useCallback(async (currentUser: any) => {
    console.log("refreshUser kaldt med:", currentUser?.email || "null");
    
    if (!currentUser) {
      console.warn("refreshUser kaldt med null/undefined - ignorerer");
      return;
    }
    
    // Forhindre multiple samtidige kald
    if (isProcessing) {
      console.log("refreshUser allerede i gang - ignorerer");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const userProfile: User = {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Ukendt',
        company: currentUser.user_metadata?.company,
        role: currentUser.user_metadata?.role || 'user',
        created_at: new Date(currentUser.created_at).toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setUser(userProfile);
      console.log("Bruger opdateret fra session:", userProfile.email);
    } catch (error) {
      console.error("Fejl under opdatering af bruger fra session:", error);
      try {
        const userProfile = await authService.getCurrentUser();
        setUser(userProfile);
      } catch (fallbackError) {
        console.error("Fallback authService fejlede også:", fallbackError);
        setUser(null);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  // Funktion til at tjekke og forny session med debouncing
  const checkAndRefreshSession = useCallback(async () => {
    try {
      if (sessionCheckBlocked) {
        console.log("Session check blokeret globalt - venter...");
        return null;
      }
      
      // Tjek cooldown - vent mindst 30 sekunder mellem refresh forsøg
      const currentTimestamp = Date.now();
      const timeSinceLastRefresh = currentTimestamp - lastRefreshAttempt;
      const cooldownPeriod = 30 * 1000;
      
      if (timeSinceLastRefresh < cooldownPeriod) {
        console.log(`Session refresh cooldown: Vent ${Math.ceil((cooldownPeriod - timeSinceLastRefresh) / 1000)} sekunder`);
        return null;
      }
      
      // Clear existing timeout
      if (sessionRefreshTimeout.current) {
        clearTimeout(sessionRefreshTimeout.current);
      }
      
      // Set new timeout for debouncing
      sessionRefreshTimeout.current = setTimeout(() => {
        sessionRefreshTimeout.current = null;
      }, 5000);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Fejl under session check:", error);
        return null;
      }
      
      if (!session) {
        console.log("Ingen session fundet");
        return null;
      }
      
      // Tjek om session er ved at udløbe (mindre end 5 minutter tilbage)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      if (timeUntilExpiry < 300) { // 5 minutter
        console.log("Session udløber snart, fornyer...");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error("Fejl under session refresh:", refreshError);
          return null;
        }
        
        if (refreshData.session) {
          setLastRefreshAttempt(currentTimestamp);
          return refreshData.session.user;
        }
      }
      
      return session.user;
    } catch (error) {
      console.error("Fejl under session check/refresh:", error);
      return null;
    }
  }, [lastRefreshAttempt, sessionCheckBlocked]);

  useEffect(() => {
    // Forhindre multiple initialization
    if (hasInitialized.current || isInitializing.current) {
      console.log("AuthContext allerede initialiseret eller initialiserer - ignorerer");
      return;
    }
    
    isInitializing.current = true;
    
    const initializeAuth = async () => {
      try {
        console.log("🔍 AuthContext initialisering starter...");
        
        // Emergency stop - hvis der er for mange session checks, stop midlertidigt
        let sessionCheckCount = 0;
        const maxSessionChecks = 10;
        
        const emergencyStop = setInterval(() => {
          if (sessionCheckCount > maxSessionChecks) {
            console.warn("🚨 EMERGENCY STOP: For mange session checks - blokerer i 1 minut");
            setSessionCheckBlocked(true);
            setTimeout(() => {
              setSessionCheckBlocked(false);
              console.log("✅ Emergency stop fjernet - session checks genoptaget");
            }, 60000);
          }
          sessionCheckCount = 0;
        }, 60000);
        
        // 1. Tjek den nuværende session ved start
        const checkInitialSession = async () => {
          try {
            sessionCheckCount++;
            console.log(`🔍 Session check #${sessionCheckCount} starter...`);
            
            const currentUser = await checkAndRefreshSession();
            
            console.log("Session check resultat:", currentUser ? `Bruger fundet: ${currentUser.email}` : "Ingen bruger");
            
            if (currentUser) {
              console.log("Kalder refreshUser med:", currentUser.email);
              await refreshUser(currentUser);
              console.log("refreshUser gennemført");
            } else {
              console.log("Sætter bruger til null - ingen gyldig session fundet");
              setUser(null);
            }
          } catch (error) {
            console.warn("Session check fejl - fortsætter uden bruger:", error);
            setUser(null);
          } finally {
            setLoading(false);
            setInitialized(true);
            hasInitialized.current = true;
            isInitializing.current = false;
          }
        };

        // Fallback timeout
        const fallbackTimeout = setTimeout(() => {
          console.warn("AuthContext: Fallback timeout triggered - forcing initialization");
          setLoading(false);
          setInitialized(true);
          hasInitialized.current = true;
          isInitializing.current = false;
        }, 30000);

        await checkInitialSession();
        clearTimeout(fallbackTimeout);

        // 2. Lyt efter fremtidige ændringer i login-status
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
          try {
            console.log("Auth state change:", event, session?.user?.id);
            
            if (isProcessing) {
              console.log("Auth state change: Processing allerede i gang - ignorerer");
              return;
            }
            
            if (event === 'TOKEN_REFRESHED') {
              console.log("Token fornyet automatisk");
              if (session?.user) {
                await refreshUser(session.user);
              }
            } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
              const currentUser = session?.user ?? null;
              if (currentUser) {
                await refreshUser(currentUser);
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
            }
            
            setLoading(false);
          } catch (error) {
            console.error("Fejl under auth state change:", error);
            setUser(null);
            setLoading(false);
          }
        });

        // 3. Periodisk session check hver 30. minut
        const sessionCheckInterval = setInterval(async () => {
          try {
            if (user || isProcessing) {
              console.log("Periodisk session check: Skipper - bruger eksisterer allerede eller processing i gang");
              return;
            }
            
            console.log("Periodisk session check: Starter...");
            const currentUser = await checkAndRefreshSession();
            if (currentUser && !user) {
              console.log("Periodisk session check: Bruger fundet, opdaterer...");
              await refreshUser(currentUser);
            }
          } catch (error) {
            console.warn("Periodisk session check fejlede:", error);
          }
        }, 30 * 60 * 1000);

        // Cleanup function
        return () => {
          clearTimeout(fallbackTimeout);
          clearInterval(sessionCheckInterval);
          clearInterval(emergencyStop);
          if (sessionRefreshTimeout.current) {
            clearTimeout(sessionRefreshTimeout.current);
          }
          authListener?.subscription.unsubscribe();
          console.log("AuthContext cleanup: Alle timers og listeners stoppet");
        };
      } catch (error) {
        console.error("Fejl under AuthContext initialisering:", error);
        setLoading(false);
        setInitialized(true);
        hasInitialized.current = true;
        isInitializing.current = false;
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, []); // Empty dependency array - kun kør én gang

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