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
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No auth user found');
        return null;
      }

      console.log('Auth user found:', user.id, user.email);

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
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
          return null;
        }

        console.log('User profile created:', newUser);
        return newUser;
      }

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      console.log('User data found:', userData);
      return userData;
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
      // Sign in with email and password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Error signing in:', error);
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, message: 'Forkert email eller password' };
        }
        return { success: false, message: 'Fejl ved login' };
      }

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