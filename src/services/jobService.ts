import { supabase } from '@/lib/supabase';
import { Job } from '@/types/job';
import { mockJobs } from '@/data/mockJobs';

interface PaginationParams {
  page: number;
  pageSize: number;
}

interface PaginatedResponse {
  data: Job[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const jobService = {
  // Hent alle jobs med pagination (kun ikke-slettede jobs med CFO score > 0)
  async getAllJobs(params?: PaginationParams): Promise<PaginatedResponse> {
    if (!supabase) {
      // Fallback til mock data hvis Supabase ikke er konfigureret
      const scoredJobs = mockJobs.filter(job => (job.cfo_score || 0) > 0);
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        data: scoredJobs.slice(startIndex, endIndex),
        total: scoredJobs.length,
        page,
        pageSize,
        totalPages: Math.ceil(scoredJobs.length / pageSize)
      };
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Først hent total count
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gt('cfo_score', 0);

    if (countError) {
      console.error('Error counting jobs:', countError);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }

    // Derefter hent paginated data
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .is('deleted_at', null)
      .gt('cfo_score', 0) // Kun jobs med CFO score > 0
      .order('cfo_score', { ascending: false })
      .order('publication_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching jobs:', error);
      return {
        data: [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
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

  // Søg jobs med pagination
  async searchJobs(query: string, params?: PaginationParams): Promise<PaginatedResponse> {
    if (!supabase) {
      // Fallback til mock data med lokal søgning
      const searchLower = query.toLowerCase();
      const scoredJobs = mockJobs.filter(job => 
        (job.cfo_score || 0) > 0 && (
          (job.title?.toLowerCase().includes(searchLower) || false) ||
          (job.company?.toLowerCase().includes(searchLower) || false) ||
          (job.description?.toLowerCase().includes(searchLower) || false)
        )
      );
      
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        data: scoredJobs.slice(startIndex, endIndex),
        total: scoredJobs.length,
        page,
        pageSize,
        totalPages: Math.ceil(scoredJobs.length / pageSize)
      };
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Først hent total count for søgning
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gt('cfo_score', 0)
      .or(`title.ilike.%${query}%,company.ilike.%${query}%,description.ilike.%${query}%`);

    if (countError) {
      console.error('Error counting search results:', countError);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }

    // Derefter hent paginated søgeresultater
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .is('deleted_at', null)
      .gt('cfo_score', 0)
      .or(`title.ilike.%${query}%,company.ilike.%${query}%,description.ilike.%${query}%`)
      .order('cfo_score', { ascending: false })
      .order('publication_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error searching jobs:', error);
      return {
        data: [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  },

  // Filtrer jobs efter score med pagination
  async getJobsByScore(score: number, params?: PaginationParams): Promise<PaginatedResponse> {
    if (!supabase) {
      // Fallback til mock data
      const scoredJobs = mockJobs.filter(job => job.cfo_score === score);
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        data: scoredJobs.slice(startIndex, endIndex),
        total: scoredJobs.length,
        page,
        pageSize,
        totalPages: Math.ceil(scoredJobs.length / pageSize)
      };
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Først hent total count for score filter
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('cfo_score', score)
      .is('deleted_at', null);

    if (countError) {
      console.error('Error counting jobs by score:', countError);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }

    // Derefter hent paginated data
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('cfo_score', score)
      .is('deleted_at', null)
      .order('publication_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error filtering jobs by score:', error);
      return {
        data: [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  },

  // Filtrer jobs efter lokation med pagination
  async getJobsByLocation(location: string, params?: PaginationParams): Promise<PaginatedResponse> {
    if (!supabase) {
      // Fallback til mock data
      const locationLower = location.toLowerCase();
      const scoredJobs = mockJobs.filter(job => 
        (job.cfo_score || 0) > 0 && (job.location?.toLowerCase().includes(locationLower) || false)
      );
      
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        data: scoredJobs.slice(startIndex, endIndex),
        total: scoredJobs.length,
        page,
        pageSize,
        totalPages: Math.ceil(scoredJobs.length / pageSize)
      };
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Først hent total count for location filter
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .ilike('location', `%${location}%`)
      .is('deleted_at', null)
      .gt('cfo_score', 0);

    if (countError) {
      console.error('Error counting jobs by location:', countError);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }

    // Derefter hent paginated data
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .ilike('location', `%${location}%`)
      .is('deleted_at', null)
      .gt('cfo_score', 0)
      .order('cfo_score', { ascending: false })
      .order('publication_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error filtering jobs by location:', error);
      return {
        data: [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  },

  // Hent jobs med høj prioritet (score 3) med pagination
  async getHighPriorityJobs(params?: PaginationParams): Promise<PaginatedResponse> {
    if (!supabase) {
      const highPriorityJobs = mockJobs.filter(job => job.cfo_score === 3);
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        data: highPriorityJobs.slice(startIndex, endIndex),
        total: highPriorityJobs.length,
        page,
        pageSize,
        totalPages: Math.ceil(highPriorityJobs.length / pageSize)
      };
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Først hent total count for high priority jobs
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('cfo_score', 3)
      .is('deleted_at', null);

    if (countError) {
      console.error('Error counting high priority jobs:', countError);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }

    // Derefter hent paginated data
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('cfo_score', 3)
      .is('deleted_at', null)
      .order('publication_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching high priority jobs:', error);
      return {
        data: [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }
}; 