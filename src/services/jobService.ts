import { supabase } from '@/lib/supabase';
import { Job } from '@/types/job';
import { mockJobs } from '@/data/mockJobs';
import { type SortConfig } from '@/utils/sort';
import { aiQueryProcessor } from './aiQueryProcessor';

interface PaginationParams {
  page: number;
  pageSize: number;
  sort?: SortConfig;
}

interface PaginatedResponse {
  data: Job[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const jobService = {
  // Hent alle jobs med pagination (kun ikke-slettede jobs med CFO score >= 1)
  async getAllJobs(params?: PaginationParams): Promise<PaginatedResponse> {
    if (!supabase) {
      // Fallback til mock data hvis Supabase ikke er konfigureret
      const scoredJobs = mockJobs.filter(job => (job.cfo_score || 0) >= 1);
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
    const sort = params?.sort || { key: 'score', dir: 'desc' };

    // Først hent total count
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('cfo_score', 1);

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

    // Build query with sorting
    let query = supabase
      .from('jobs')
      .select('*')
      .is('deleted_at', null)
      .gte('cfo_score', 1);

    // Apply sorting
    switch (sort.key) {
      case 'score':
        query = query.order('cfo_score', { ascending: sort.dir === 'asc' });
        break;
      case 'company':
        query = query.order('company', { ascending: sort.dir === 'asc' });
        break;
      case 'title':
        query = query.order('title', { ascending: sort.dir === 'asc' });
        break;
      case 'location':
        query = query.order('location', { ascending: sort.dir === 'asc' });
        break;
      case 'date':
        query = query.order('publication_date', { ascending: sort.dir === 'asc' });
        break;
      default:
        query = query.order('cfo_score', { ascending: false });
    }

    // Add secondary sort for stable sorting
    if (sort.key !== 'date') {
      query = query.order('publication_date', { ascending: false });
    }

    // Apply pagination
    const { data, error } = await query.range(from, to);

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
        (job.cfo_score || 0) >= 1 && (
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
    const sort = params?.sort || { key: 'score', dir: 'desc' };

    // Først hent total count for søgning
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('cfo_score', 1)
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

    // Build query with search and sorting
    let searchQuery = supabase
      .from('jobs')
      .select('*')
      .is('deleted_at', null)
      .gte('cfo_score', 1)
      .or(`title.ilike.%${query}%,company.ilike.%${query}%,description.ilike.%${query}%`);

    // Apply sorting
    switch (sort.key) {
      case 'score':
        searchQuery = searchQuery.order('cfo_score', { ascending: sort.dir === 'asc' });
        break;
      case 'company':
        searchQuery = searchQuery.order('company', { ascending: sort.dir === 'asc' });
        break;
      case 'title':
        searchQuery = searchQuery.order('title', { ascending: sort.dir === 'asc' });
        break;
      case 'location':
        searchQuery = searchQuery.order('location', { ascending: sort.dir === 'asc' });
        break;
      case 'date':
        searchQuery = searchQuery.order('publication_date', { ascending: sort.dir === 'asc' });
        break;
      default:
        searchQuery = searchQuery.order('cfo_score', { ascending: false });
    }

    // Add secondary sort for stable sorting
    if (sort.key !== 'date') {
      searchQuery = searchQuery.order('publication_date', { ascending: false });
    }

    // Apply pagination
    const { data, error } = await searchQuery.range(from, to);

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
    const sort = params?.sort || { key: 'date', dir: 'desc' };

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

    // Build query with score filter and sorting
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('cfo_score', score)
      .is('deleted_at', null);

    // Apply sorting
    switch (sort.key) {
      case 'score':
        query = query.order('cfo_score', { ascending: sort.dir === 'asc' });
        break;
      case 'company':
        query = query.order('company', { ascending: sort.dir === 'asc' });
        break;
      case 'title':
        query = query.order('title', { ascending: sort.dir === 'asc' });
        break;
      case 'location':
        query = query.order('location', { ascending: sort.dir === 'asc' });
        break;
      case 'date':
        query = query.order('publication_date', { ascending: sort.dir === 'asc' });
        break;
      default:
        query = query.order('publication_date', { ascending: false });
    }

    // Add secondary sort for stable sorting
    if (sort.key !== 'date') {
      query = query.order('publication_date', { ascending: false });
    }

    // Apply pagination
    const { data, error } = await query.range(from, to);

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
        (job.cfo_score || 0) >= 1 && (job.location?.toLowerCase().includes(locationLower) || false)
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
    const sort = params?.sort || { key: 'score', dir: 'desc' };

    // Først hent total count for location filter
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .ilike('location', `%${location}%`)
      .is('deleted_at', null)
      .gte('cfo_score', 1);

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

    // Build query with location filter and sorting
    let query = supabase
      .from('jobs')
      .select('*')
      .ilike('location', `%${location}%`)
      .is('deleted_at', null)
      .gte('cfo_score', 1);

    // Apply sorting
    switch (sort.key) {
      case 'score':
        query = query.order('cfo_score', { ascending: sort.dir === 'asc' });
        break;
      case 'company':
        query = query.order('company', { ascending: sort.dir === 'asc' });
        break;
      case 'title':
        query = query.order('title', { ascending: sort.dir === 'asc' });
        break;
      case 'location':
        query = query.order('location', { ascending: sort.dir === 'asc' });
        break;
      case 'date':
        query = query.order('publication_date', { ascending: sort.dir === 'asc' });
        break;
      default:
        query = query.order('cfo_score', { ascending: false });
    }

    // Add secondary sort for stable sorting
    if (sort.key !== 'date') {
      query = query.order('publication_date', { ascending: false });
    }

    // Apply pagination
    const { data, error } = await query.range(from, to);

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

  // Filtrer jobs efter dato med pagination
  async getJobsByDate(daysAgo: number, params?: PaginationParams): Promise<PaginatedResponse> {
    if (!supabase) {
      // Fallback til mock data
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      const scoredJobs = mockJobs.filter(job => 
        (job.cfo_score || 0) >= 1 && 
        job.publication_date && 
        new Date(job.publication_date) >= cutoffDate
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
    const sort = params?.sort || { key: 'date', dir: 'desc' };

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];

    // Først hent total count for date filter
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .gte('publication_date', cutoffDateString)
      .is('deleted_at', null)
      .gte('cfo_score', 1);

    if (countError) {
      console.error('Error counting jobs by date:', countError);
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }

    // Build query with date filter and sorting
    let query = supabase
      .from('jobs')
      .select('*')
      .gte('publication_date', cutoffDateString)
      .is('deleted_at', null)
      .gte('cfo_score', 1);

    // Apply sorting
    switch (sort.key) {
      case 'score':
        query = query.order('cfo_score', { ascending: sort.dir === 'asc' });
        break;
      case 'company':
        query = query.order('company', { ascending: sort.dir === 'asc' });
        break;
      case 'title':
        query = query.order('title', { ascending: sort.dir === 'asc' });
        break;
      case 'location':
        query = query.order('location', { ascending: sort.dir === 'asc' });
        break;
      case 'date':
        query = query.order('publication_date', { ascending: sort.dir === 'asc' });
        break;
      default:
        query = query.order('publication_date', { ascending: false });
    }

    // Add secondary sort for stable sorting
    if (sort.key !== 'date') {
      query = query.order('publication_date', { ascending: false });
    }

    // Apply pagination
    const { data, error } = await query.range(from, to);

    if (error) {
      console.error('Error filtering jobs by date:', error);
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
  },

  // Semantic search using vector embeddings
  async searchJobsSemantic(
    query: string, 
    params?: PaginationParams & {
      matchThreshold?: number;
      minScore?: number;
      locationFilter?: string;
      companyFilter?: string;
    }
  ): Promise<PaginatedResponse> {
    if (!supabase) {
      // Fallback to text search for mock data
      return this.searchJobs(query, params);
    }

    try {
      // Preprocess query for Danish text with AI
      const processedQuery = await this.preprocessDanishQuery(query);
      
      // Generate embedding for the processed query
      const { generateEmbeddingForText } = await import('./embeddingService');
      const queryEmbedding = await generateEmbeddingForText(processedQuery);

      const page = params?.page || 1;
      const pageSize = params?.pageSize || 30; // Get top 30 results
      const matchThreshold = params?.matchThreshold || 0.01; // Very low threshold
      const minScore = params?.minScore || 1; // Minimum score filter of 1
      const locationFilter = params?.locationFilter || null;
      const companyFilter = params?.companyFilter || null;

      // Use semantic search function
      const { data: searchResults, error } = await supabase.rpc('match_jobs_semantic', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: pageSize,
        min_score: minScore,
        location_filter: locationFilter,
        company_filter: companyFilter
      });

      if (error) {
        console.error('Semantic search error:', error);
        // Fallback to text search
        return this.searchJobs(query, params);
      }

      // If no results from semantic search, try text search
      if (!searchResults || searchResults.length === 0) {
        console.log('No semantic results, trying text search fallback');
        return this.searchJobs(query, params);
      }

      // For semantic search, we don't have total count easily, so we'll estimate
      // In a production system, you might want to implement a separate count function
      const estimatedTotal = searchResults?.length || 0;

      return {
        data: searchResults || [],
        total: estimatedTotal,
        page,
        pageSize,
        totalPages: Math.ceil(estimatedTotal / pageSize)
      };
    } catch (error) {
      console.error('Error in semantic search:', error);
      // Fallback to text search
      return this.searchJobs(query, params);
    }
  },

  // Helper function to preprocess Danish queries with AI
  async preprocessDanishQuery(query: string): Promise<string> {
    try {
      const { preprocessQuery } = await import('./queryPreprocessor');
      const result = await preprocessQuery(query);
      console.log('AI preprocessing result:', {
        original: result.originalQuery,
        processed: result.processedQuery,
        corrections: result.corrections,
        confidence: result.confidence
      });
      return result.processedQuery;
    } catch (error) {
      console.error('AI preprocessing failed, using fallback:', error);
      // Fallback to basic preprocessing
      return this.preprocessDanishQueryFallback(query);
    }
  },

  // Fallback preprocessing function
  preprocessDanishQueryFallback(query: string): string {
    // Remove common Danish words that don't add semantic meaning
    const danishStopWords = [
      'søger', 'leder', 'ønsker', 'vil', 'kan', 'skal', 'har', 'er', 'var', 'være',
      'og', 'eller', 'men', 'for', 'med', 'til', 'fra', 'om', 'på', 'i', 'at',
      'en', 'et', 'den', 'det', 'der', 'som', 'hvor', 'hvem', 'hvad', 'hvorfor',
      'job', 'arbejde', 'stilling', 'position', 'rolle', 'funktion'
    ];
    
    let processedQuery = query.toLowerCase();
    
    // Handle common abbreviations and variations
    const abbreviations = {
      'nordk': 'nordisk',
      'novo': 'novo nordisk',
      'offentlig': 'offentlig sektor',
      'kommuner': 'kommune kommunal offentlig sektor',
      'tøjfirmaer': 'tøj mode fashion detailhandel',
      'cfo': 'chief financial officer',
      'cto': 'chief technology officer',
      'ceo': 'chief executive officer',
      'hr': 'human resources',
      'it': 'information technology'
    };
    
    // Replace abbreviations
    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      processedQuery = processedQuery.replace(regex, full);
    });
    
    // Remove stop words
    danishStopWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      processedQuery = processedQuery.replace(regex, '');
    });
    
    // Clean up extra spaces
    processedQuery = processedQuery.replace(/\s+/g, ' ').trim();
    
    // If query is empty after preprocessing, use original query
    if (!processedQuery) {
      return query.toLowerCase();
    }
    
    return processedQuery;
  },

  // Intelligent AI-powered hybrid search
  async searchJobsHybrid(
    query: string,
    params?: PaginationParams & {
      matchThreshold?: number;
      minScore?: number;
    }
  ): Promise<PaginatedResponse> {
    if (!supabase) {
      // Fallback to text search for mock data
      return this.searchJobs(query, params);
    }

    try {
      // Use AI query processor to analyze and process the query
      const processedQuery = await aiQueryProcessor.processQuery(query);
      
      console.log('AI Query Processing result:', {
        original: processedQuery.original,
        processed: processedQuery.processed,
        strategy: processedQuery.searchStrategy,
        confidence: processedQuery.confidence,
        corrections: processedQuery.corrections
      });

      // If AI found relevant jobs directly, return them
      if (processedQuery.relevantJobs && processedQuery.relevantJobs.length > 0) {
        console.log('AI found relevant jobs directly:', processedQuery.relevantJobs.length);
        return {
          data: processedQuery.relevantJobs,
          total: processedQuery.relevantJobs.length,
          page: params?.page || 1,
          pageSize: params?.pageSize || 30,
          totalPages: Math.ceil(processedQuery.relevantJobs.length / (params?.pageSize || 30))
        };
      }

      // Execute search based on AI strategy
      switch (processedQuery.searchStrategy.method) {
        case 'semantic':
          return this.searchJobsSemantic(processedQuery.searchStrategy.query, params);
        
        case 'text':
          return this.searchJobsText(processedQuery.searchStrategy.query, params);
        
        case 'direct':
          // AI suggested direct search but no results found
          console.log('AI suggested direct search but no results found, falling back to hybrid');
          break;
        
        case 'hybrid':
        default:
          // Continue with hybrid search
          break;
      }

      // Generate embedding for the processed query
      const { generateEmbeddingForText } = await import('./embeddingService');
      const queryEmbedding = await generateEmbeddingForText(processedQuery.processed);

      const page = params?.page || 1;
      const pageSize = params?.pageSize || 30;
      const matchThreshold = params?.matchThreshold || 0.01;
      const minScore = params?.minScore || 1;

      // Use hybrid search function
      const { data: searchResults, error } = await supabase.rpc('match_jobs_hybrid', {
        query_embedding: queryEmbedding,
        search_text: processedQuery.processed,
        match_threshold: matchThreshold,
        match_count: pageSize,
        min_score: minScore
      });

      if (error) {
        console.error('Hybrid search error:', error);
        return this.searchJobs(processedQuery.processed, params);
      }

      // Check if results are relevant
      const hasRelevantResults = searchResults && searchResults.length > 0 && 
        searchResults.some((job: any) => (job.similarity || 0) > 0.1);

      if (!hasRelevantResults) {
        console.log('No relevant hybrid results, trying text search fallback');
        return this.searchJobsText(processedQuery.processed, params);
      }

      const estimatedTotal = searchResults?.length || 0;

      return {
        data: searchResults || [],
        total: estimatedTotal,
        page,
        pageSize,
        totalPages: Math.ceil(estimatedTotal / pageSize)
      };

    } catch (error) {
      console.error('Error in AI-powered hybrid search:', error);
      // Fallback to basic text search
      return this.searchJobs(query, params);
    }
  },

  // Text search with similarity scoring
  async searchJobsText(
    query: string,
    params?: PaginationParams & {
      minScore?: number;
    }
  ): Promise<PaginatedResponse> {
    if (!supabase) {
      // Fallback to text search for mock data
      return this.searchJobs(query, params);
    }

    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const minScore = params?.minScore || 1;

      // Use text search function
      const { data: searchResults, error } = await supabase.rpc('match_jobs_text', {
        search_text: query,
        match_count: pageSize,
        min_score: minScore
      });

      if (error) {
        console.error('Text search error:', error);
        // Fallback to regular search
        return this.searchJobs(query, params);
      }

      const estimatedTotal = searchResults?.length || 0;

      return {
        data: searchResults || [],
        total: estimatedTotal,
        page,
        pageSize,
        totalPages: Math.ceil(estimatedTotal / pageSize)
      };
    } catch (error) {
      console.error('Error in text search:', error);
      // Fallback to regular search
      return this.searchJobs(query, params);
    }
  },

  // Get job recommendations based on a specific job
  async getJobRecommendations(
    jobId: string,
    params?: PaginationParams & {
      minScore?: number;
    }
  ): Promise<PaginatedResponse> {
    if (!supabase) {
      // Fallback to mock data
      const mockJob = mockJobs.find(job => job.job_id === jobId);
      if (!mockJob) {
        return {
          data: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0
        };
      }

      // Simple mock recommendations based on company or location
      const recommendations = mockJobs.filter(job => 
        job.id !== mockJob.id && 
        (job.cfo_score || 0) >= (params?.minScore || 1) &&
        (job.company === mockJob.company || job.location === mockJob.location)
      ).slice(0, 5);

      return {
        data: recommendations,
        total: recommendations.length,
        page: 1,
        pageSize: 20,
        totalPages: 1
      };
    }

    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const minScore = params?.minScore || 1;

      // Use job recommendations function
      const { data: recommendations, error } = await supabase.rpc('get_job_recommendations', {
        job_id_param: jobId,
        match_count: pageSize,
        min_score: minScore
      });

      if (error) {
        console.error('Job recommendations error:', error);
        return {
          data: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0
        };
      }

      const estimatedTotal = recommendations?.length || 0;

      return {
        data: recommendations || [],
        total: estimatedTotal,
        page,
        pageSize,
        totalPages: Math.ceil(estimatedTotal / pageSize)
      };
    } catch (error) {
      console.error('Error getting job recommendations:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0
      };
    }
  }
}; 