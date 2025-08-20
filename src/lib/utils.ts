import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Session refresh utility
export async function refreshSessionIfNeeded() {
  try {
    const { supabase } = await import('./supabase')
    
    if (!supabase) return false
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) return false
    
    // Tjek om session snart udløber (inden for 30 minutter)
    const expiresAt = new Date(session.expires_at! * 1000)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const thirtyMinutes = 30 * 60 * 1000

    if (timeUntilExpiry < thirtyMinutes) {
      console.log("Utility: Session udløber snart, fornyer...")
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.warn("Utility: Session refresh fejlede:", refreshError)
        return false
      }
      
      if (refreshData.session) {
        console.log("Utility: Session fornyet succesfuldt")
        return true
      }
    }
    
    return true
  } catch (error) {
    console.error("Utility: Fejl under session refresh:", error)
    return false
  }
}

// Tjek om bruger er logget ind
export async function isUserAuthenticated() {
  try {
    const { supabase } = await import('./supabase')
    
    if (!supabase) return false
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return false
    
    return true
  } catch (error) {
    console.error("Utility: Fejl under auth check:", error)
    return false
  }
}

// Hent bruger ID hvis logget ind
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { supabase } = await import('./supabase')
    
    if (!supabase) return null
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null
    
    return user.id
  } catch (error) {
    console.error("Utility: Fejl under user ID hentning:", error)
    return null
  }
}
