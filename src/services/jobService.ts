import { supabase } from '@/lib/supabase';
import { Job } from '@/types/job';
import { mockJobs } from '@/data/mockJobs';

export const jobService = {
  // Hent alle jobs (kun ikke-slettede jobs)
  async getAllJobs(): Promise<Job[]> {
    if (!supabase) {
      // Fallback til mock data hvis Supabase ikke er konfigureret
      return mockJobs;
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .is('deleted_at', null) // Kun ikke-slettede jobs
      .order('cfo_score', { ascending: false })
      .order('publication_date', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      // Fallback til mock data ved fejl
      return mockJobs;
    }

    return data || [];
  },

  // Hent job efter ID
  async getJobById(id: number): Promise<Job | null> {
    if (!supabase) {
      // Fallback til mock data
      return mockJobs.find(job => job.id === id) || null;
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Error fetching job:', error);
      return null;
    }

    return data;
  },

  // Opret nyt job
  async createJob(job: Omit<Job, 'id' | 'created_at' | 'deleted_at' | 'scored_at' | 'job_info' | 'last_seen'>): Promise<Job> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert([job])
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      throw error;
    }

    return data;
  },

  // Opdater job
  async updateJob(id: number, updates: Partial<Job>): Promise<Job> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating job:', error);
      throw error;
    }

    return data;
  },

  // Slet job (soft delete)
  async deleteJob(id: number): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('jobs')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },

  // Søg jobs
  async searchJobs(query: string): Promise<Job[]> {
    if (!supabase) {
      // Fallback til mock data med lokal søgning
      const searchLower = query.toLowerCase();
      return mockJobs.filter(job =>
        (job.title?.toLowerCase().includes(searchLower) || false) ||
        (job.company?.toLowerCase().includes(searchLower) || false) ||
        (job.description?.toLowerCase().includes(searchLower) || false)
      );
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .is('deleted_at', null)
      .or(`title.ilike.%${query}%,company.ilike.%${query}%,description.ilike.%${query}%`)
      .order('cfo_score', { ascending: false })
      .order('publication_date', { ascending: false });

    if (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }

    return data || [];
  },

  // Filtrer jobs efter score
  async getJobsByScore(score: number): Promise<Job[]> {
    if (!supabase) {
      // Fallback til mock data
      return mockJobs.filter(job => job.cfo_score === score);
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('cfo_score', score)
      .is('deleted_at', null)
      .order('publication_date', { ascending: false });

    if (error) {
      console.error('Error filtering jobs by score:', error);
      throw error;
    }

    return data || [];
  },

  // Filtrer jobs efter lokation
  async getJobsByLocation(location: string): Promise<Job[]> {
    if (!supabase) {
      // Fallback til mock data
      const locationLower = location.toLowerCase();
      return mockJobs.filter(job => 
        job.location?.toLowerCase().includes(locationLower) || false
      );
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .ilike('location', `%${location}%`)
      .is('deleted_at', null)
      .order('cfo_score', { ascending: false })
      .order('publication_date', { ascending: false });

    if (error) {
      console.error('Error filtering jobs by location:', error);
      throw error;
    }

    return data || [];
  },

  // Hent jobs med høj prioritet (score 3)
  async getHighPriorityJobs(): Promise<Job[]> {
    if (!supabase) {
      return mockJobs.filter(job => job.cfo_score === 3);
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('cfo_score', 3)
      .is('deleted_at', null)
      .order('publication_date', { ascending: false });

    if (error) {
      console.error('Error fetching high priority jobs:', error);
      return [];
    }

    return data || [];
  }
}; 