import { supabase } from '@/lib/supabase';
import { Job } from '@/types/job';
import { mockJobs } from '@/data/mockJobs';

export const jobService = {
  // Hent alle jobs
  async getAllJobs(): Promise<Job[]> {
    if (!supabase) {
      // Fallback til mock data hvis Supabase ikke er konfigureret
      return mockJobs;
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('score', { ascending: false })
      .order('publication_date', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      // Fallback til mock data ved fejl
      return mockJobs;
    }

    return data || [];
  },

  // Hent job efter ID
  async getJobById(id: string): Promise<Job | null> {
    if (!supabase) {
      // Fallback til mock data
      return mockJobs.find(job => job.id === id) || null;
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching job:', error);
      return null;
    }

    return data;
  },

  // Opret nyt job
  async createJob(job: Omit<Job, 'id'>): Promise<Job> {
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
  async updateJob(id: string, updates: Partial<Job>): Promise<Job> {
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

  // Slet job
  async deleteJob(id: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('jobs')
      .delete()
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
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower)
      );
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .or(`title.ilike.%${query}%,company.ilike.%${query}%,description.ilike.%${query}%`)
      .order('score', { ascending: false })
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
      return mockJobs.filter(job => job.score === score);
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('score', score)
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
        job.location.toLowerCase().includes(locationLower)
      );
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .ilike('location', `%${location}%`)
      .order('score', { ascending: false })
      .order('publication_date', { ascending: false });

    if (error) {
      console.error('Error filtering jobs by location:', error);
      throw error;
    }

    return data || [];
  }
}; 