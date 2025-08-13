import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        authenticated: false, 
        error: userError?.message || 'No user found' 
      })
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ 
        authenticated: true, 
        user: { id: user.id, email: user.email },
        profileError: profileError.message 
      })
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: userProfile 
    })
  } catch (error) {
    console.error('Error in test-auth API:', error)
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Internal server error' 
    })
  }
} 