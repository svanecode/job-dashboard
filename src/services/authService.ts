import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export const authService = {
  // Sign up new user
  async signUp(email: string, password: string, name: string): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: 'Supabase ikke konfigureret' };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });
      if (error) {
        console.error('Error signing up:', error);
        if (error.message.includes('already registered')) {
          return { success: false, message: 'Denne email er allerede registreret' };
        }
        return { success: false, message: 'Fejl ved registrering' };
      }
      return { success: true, message: 'Registrering succesfuld! Tjek din email for bekræftelse.' };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { success: false, message: 'Der opstod en fejl' };
    }
  },

  // Get current user session
  async getCurrentUser(): Promise<User | null> {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return null;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('AuthService: getCurrentUser - auth user result:', { 
        hasUser: !!user, 
        userId: user?.id, 
        error: error?.message 
      });
      
      if (!user) {
        console.log('No auth user found');
        return null;
      }

      console.log('Auth user found:', user.id, user.email);

      // Helper: timebox any DB call to avoid hanging the UI
      const withTimeout = async <T,>(promise: Promise<T>, ms: number, onTimeout: () => T): Promise<T> => {
        return await Promise.race([
          promise,
          new Promise<T>((resolve) => setTimeout(() => resolve(onTimeout()), ms)),
        ]);
      };

      // Check if user exists in users table (with timeout + safe fallback)
      const { data: userData, error: dbError } = await withTimeout(
        supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single(),
        3000,
        () => {
          console.warn('AuthService: getCurrentUser timed out fetching user profile. Falling back to auth user.');
          return { data: null as any, error: null as any } as any;
        }
      );

      if (dbError && dbError.code === 'PGRST116') {
        // User doesn't exist in users table, create them
        console.log('Creating user profile in database...');
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || 'Unknown',
            role: 'user'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          // Fall back to minimal user object to avoid blocking UI
          return {
            id: user.id,
            email: user.email ?? '',
            name: user.user_metadata?.name || user.email || 'User',
            role: 'user',
            created_at: user.created_at ?? new Date().toISOString(),
          } satisfies User;
        }

        console.log('User profile created:', newUser);
        return newUser;
      }

      if (dbError) {
        console.error('Error fetching user data:', dbError);
        // Fall back to minimal user object to avoid blocking UI
        return {
          id: user.id,
          email: user.email ?? '',
          name: user.user_metadata?.name || user.email || 'User',
          role: 'user',
          created_at: user.created_at ?? new Date().toISOString(),
        } satisfies User;
      }

      // If timed out fallback returned null-ish data, also fallback to auth user
      if (!userData) {
        console.warn('AuthService: No userData returned, using auth user fallback');
        return {
          id: user.id,
          email: user.email ?? '',
          name: user.user_metadata?.name || user.email || 'User',
          role: 'user',
          created_at: user.created_at ?? new Date().toISOString(),
        } satisfies User;
      }

      console.log('User data found:', userData);
      return userData as User;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Sign in with email and password
  async signInWithPassword(email: string, password: string): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: 'Supabase ikke konfigureret' };
    }

    try {
      console.log('AuthService: Attempting sign in with password for:', email);
      
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('AuthService: Sign in error:', error);
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, message: 'Forkert email eller password' };
        }
        return { success: false, message: 'Fejl ved login' };
      }

      console.log('AuthService: Sign in successful:', { 
        userId: data.user?.id, 
        hasSession: !!data.session,
        sessionExpiresAt: data.session?.expires_at 
      });

      // Verify session was created
      if (!data.session) {
        console.error('AuthService: No session created after sign in');
        return { success: false, message: 'Session kunne ikke oprettes' };
      }

      // Verify user was created
      if (!data.user) {
        console.error('AuthService: No user created after sign in');
        return { success: false, message: 'Bruger kunne ikke oprettes' };
      }

      // Wait a moment for session to be properly established
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify session is still valid
      const { data: { session: verifySession } } = await supabase.auth.getSession();
      if (!verifySession) {
        console.error('AuthService: Session lost after creation');
        return { success: false, message: 'Session kunne ikke bevares' };
      }

      console.log('AuthService: Session verification successful');
      return { success: true, message: 'Login succesfuld' };
    } catch (error) {
      console.error('Error in signInWithPassword:', error);
      return { success: false, message: 'Der opstod en fejl' };
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    if (!supabase) return;
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: 'Supabase ikke konfigureret' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.error('Error resetting password:', error);
        return { success: false, message: 'Fejl ved password reset' };
      }
      return { success: true, message: 'Password reset email sendt' };
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return { success: false, message: 'Der opstod en fejl' };
    }
  }
}; 