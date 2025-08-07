import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: { [key: string]: any }) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: { [key: string]: any }) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
        auth: {
          storageKey: 'supabase-auth' // Match the client configuration
        }
      }
    );
    
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
      .update({
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating saved job:', error)
      return NextResponse.json({ error: 'Failed to update saved job' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Saved job not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in update saved job API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    
    console.log('DELETE API: Attempting to delete saved job with ID:', params.id);
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            console.log(`DELETE API: Getting cookie ${name}:`, cookie?.value ? 'exists' : 'missing');
            return cookie?.value;
          },
          set(name: string, value: string, options: { [key: string]: any }) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: { [key: string]: any }) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
        auth: {
          storageKey: 'supabase-auth' // Match the client configuration
        }
      }
    );
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('DELETE API: Auth result:', { user: user?.id, error: userError?.message });
    
    if (userError || !user) {
      console.log('DELETE API: Returning 401 - userError:', userError?.message, 'user:', !!user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('DELETE API: Deleting saved job with id:', params.id, 'for user:', user.id);

    // Delete the saved job
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('DELETE API: Error deleting saved job:', error)
      return NextResponse.json({ error: 'Failed to delete saved job' }, { status: 500 })
    }

    console.log('DELETE API: Successfully deleted saved job:', params.id);
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE API: Error in delete saved job API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 