import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ user: null, error: 'Not authenticated' })
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ user: null, error: 'Profile not found' })
    }

    return NextResponse.json({ user: userProfile })
  } catch (error) {
    console.error('Error in check-user API:', error)
    return NextResponse.json({ user: null, error: 'Internal server error' })
  }
} 