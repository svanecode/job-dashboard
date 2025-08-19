import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await supabaseServer();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notes } = body

    // Update the saved job
    const { data, error } = await supabase
      .from('saved_jobs')
      .update({ notes })
      .eq('id', id) // Use 'id' - that's the actual column name in the database
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating saved job:', error)
      return NextResponse.json({ error: 'Failed to update saved job' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in update saved job API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const supabase = await supabaseServer();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the saved job
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', id) // Use 'id' - that's the actual column name in the database
      .eq('user_id', user.id)

    if (error) {
      console.error('DELETE API: Error deleting saved job:', error)
      return NextResponse.json({ error: 'Failed to delete saved job' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE API: Error in delete saved job API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 