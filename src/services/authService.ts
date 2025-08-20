import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
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

  // Get current user session with automatic refresh
  async getCurrentUser(): Promise<User | null> {
    try {
      // Først tjek om vi har en gyldig session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return null;
      }

      if (!session) {
        return null;
      }

      // Tjek om session snart udløber og forny hvis nødvendigt
      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const thirtyMinutes = 30 * 60 * 1000;

      if (timeUntilExpiry < thirtyMinutes) {
        console.log("Session udløber snart, fornyer...");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Session refresh fejlede:', refreshError);
          return null;
        }
        
        if (refreshData.session) {
          console.log("Session fornyet succesfuldt");
        }
      }

      // Hent brugerdata
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return null;
      }

      // Get user profile from database
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      if (!userData) {
        // Create user profile if it doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            name: user.email, // Use email as name if not provided
            role: 'user'
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          return null;
        }

        return {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name || newUser.email, // Use email as name if not provided
          role: newUser.role,
          created_at: newUser.created_at || new Date().toISOString(),
          updated_at: newUser.updated_at || new Date().toISOString()
        };
      }

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email, // Use email as fallback if name not provided
        role: userData.role,
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: userData.updated_at || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  // Sign in with email and password
  async signInWithPassword(email: string, password: string): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: 'Supabase ikke konfigureret' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, message: 'Ugyldig email eller adgangskode' };
        }
        return { success: false, message: 'Login fejlede' };
      }

      if (data.user) {
        return { success: true, message: 'Login succesfuld' };
      } else {
        return { success: false, message: 'Login fejlede' };
      }
    } catch (error) {
      console.error('Error in signInWithPassword:', error);
      return { success: false, message: 'Der opstod en fejl under login' };
    }
  },

  // Verify session with automatic refresh
  async verifySession(): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: 'Supabase ikke konfigureret' };
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session verification error:', error);
        return { success: false, message: 'Kunne ikke verificere session' };
      }

      if (session) {
        // Tjek om session snart udløber
        const expiresAt = new Date(session.expires_at! * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const oneHour = 60 * 60 * 1000;

        if (timeUntilExpiry < oneHour) {
          console.log("Session udløber snart, fornyer...");
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.warn("Session refresh fejlede:", refreshError);
            return { success: false, message: 'Session kunne ikke fornyes' };
          }
          
          if (refreshData.session) {
            console.log("Session fornyet succesfuldt");
            return { success: true, message: 'Session er gyldig og fornyet' };
          }
        }
        
        return { success: true, message: 'Session er gyldig' };
      } else {
        return { success: false, message: 'Ingen gyldig session' };
      }
    } catch (error) {
      console.error('Error in verifySession:', error);
      return { success: false, message: 'Der opstod en fejl under session verifikation' };
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