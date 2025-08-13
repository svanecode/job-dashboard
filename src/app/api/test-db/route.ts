import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Test database connection by getting a simple count
    const { count, error } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed',
        details: error.message 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      jobCount: count 
    })
  } catch (error) {
    console.error('Error in test-db API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
} 