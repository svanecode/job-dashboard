import { buildJobsQuery, runPaged, type BaseFilters, type SortConfig } from './jobQuery';
import { Job } from '@/types/job';
import { supabase } from '@/lib/supabase';
import { aiQueryProcessor } from './aiQueryProcessor';

export type JobFilters = BaseFilters & {
  page?: number;
  pageSize?: number;
  sort?: SortConfig;
};

export async function getAllJobs(filters: JobFilters = {}) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const {
    page = 1,
    pageSize = 20,
    sort = { key: 'score', dir: 'desc' },
    ...base
  } = filters;

  // Convert daysAgo to dateFrom if present
  if (base.daysAgo && base.daysAgo > 0) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - base.daysAgo);
    base.dateFrom = dateFrom.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    console.log(`🔍 Converting daysAgo: ${base.daysAgo} to dateFrom: ${base.dateFrom}`);
    delete base.daysAgo; // Remove daysAgo as it's not supported by the query builder
  }
  
  // Debug logging
  if (base.dateFrom || base.dateTo) {
    console.log(`🔍 Date filters - dateFrom: ${base.dateFrom}, dateTo: ${base.dateTo}`);
  }

  const query = buildJobsQuery(base, sort);
  return runPaged(query, page, pageSize);
}

export async function getJobById(id: number): Promise<Job | null> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Error fetching job:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return null;
  }

  return data;
}

export async function getJobByJobId(jobId: string): Promise<Job | null> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Add cache-busting to prevent stale data
  const timestamp = Date.now();
  console.log(`🔍 Fetching job with job_id: ${jobId} at ${timestamp}`);

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('job_id', jobId)
    .is('deleted_at', null)
    .single();

  if (error) {
    console.error('Error fetching job by job_id:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return null;
  }

  if (data) {
    console.log(`✅ Job found: ${data.title} at ${data.company_name}`);
  } else {
    console.log(`❌ No job found for job_id: ${jobId}`);
  }

  return data;
}

export async function getJobsByIds(ids: number[]): Promise<Job[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  if (!ids || ids.length === 0) return [];

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .in('id', ids)
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching jobs by ids:', error);
    return [];
  }

  return data || [];
}

export async function createJob(job: Omit<Job, 'id' | 'created_at' | 'deleted_at' | 'scored_at' | 'job_info' | 'last_seen'>): Promise<Job> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
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
}

export async function updateJob(id: number, updates: Partial<Job>): Promise<Job> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
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
}

export async function deleteJob(id: number): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { error } = await supabase
    .from('jobs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deleting job:', error);
    throw error;
  }
}

export async function searchJobs(query: string, params?: JobFilters): Promise<{ data: Job[]; total: number; page: number; pageSize: number; totalPages: number }> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const {
    page = 1,
    pageSize = 20,
    sort = { key: 'score', dir: 'desc' },
    ...base
  } = params || {};

  let searchQuery = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
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

  const { data, error, count } = await searchQuery.range(
    (page - 1) * pageSize,
    ((page - 1) * pageSize) + pageSize - 1
  );

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
}

export async function searchJobsSemantic(
  query: string, 
  params?: JobFilters & {
    matchThreshold?: number;
    minScore?: number;
    locationFilter?: string;
    companyFilter?: string;
    minContentLength?: number; // Tilføj ny parameter
  }
): Promise<{ data: Job[]; total: number; page: number; pageSize: number; totalPages: number }> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const {
    page = 1,
    pageSize = 20, // Giv modellen flere kandidater
    matchThreshold = 0.3, // Tilbage til 0.3 (bedre coverage)
    minScore = 1,
    locationFilter = null,
    companyFilter = null,
    minContentLength = 0, // Midlertidigt deaktiveret - alle jobs har tomme beskrivelser
    ...base
  } = params || {};

  // Preprocess query for Danish text with AI
  const processedQuery = await preprocessDanishQuery(query);
  
  // Generate embedding for the processed query
  const { generateEmbeddingForText } = await import('./embeddingService');
  const queryEmbedding = await generateEmbeddingForText(processedQuery);

  const { data: searchResults, error } = await supabase.rpc('match_jobs_semantic_perfect', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: pageSize,
    min_score: minScore,
    location_filter: locationFilter,
    company_filter: companyFilter
  });

  // Apply minContentLength filter after RPC call since it's not supported in the function
  let filteredResults = searchResults;
  if (minContentLength && minContentLength > 0) {
    // Debug: Log description lengths before filtering
    console.log('Debug: Description lengths before filtering:', searchResults?.map((job: any) => ({
      job_id: job.job_id,
      title: job.title,
      descriptionLength: job.description?.length || 0,
      hasDescription: !!job.description,
      hasEmbedding: !!job.embedding
    })) || []);
    
    filteredResults = searchResults?.filter((job: any) => 
      job.description && job.description.length >= minContentLength
    ) || [];
    console.log(`Filtered ${searchResults?.length || 0} results to ${filteredResults.length} with minContentLength >= ${minContentLength}`);
  }

  if (error) {
    console.error('Semantic search error:', error);
    // Fallback to text search
    return searchJobs(query, params);
  }

  // If no results from semantic search, try text search
  if (!filteredResults || filteredResults.length === 0) {
    console.log('No semantic results after filtering, trying text search fallback');
    return searchJobs(query, params);
  }

  // The new match_jobs_semantic_perfect function already filters out jobs without descriptions
  // So we don't need the fallback logic anymore
  console.log(`Semantic search returned ${filteredResults.length} jobs with descriptions`);

  // For semantic search, we don't have total count easily, so we'll estimate
  // In a production system, you might want to implement a separate count function
  const estimatedTotal = filteredResults?.length || 0;
  // Re-rank by score, similarity, recency and dedupe
  const ranked = (filteredResults || []).slice().sort((a: any, b: any) => {
    const scoreDiff = (b.cfo_score ?? 0) - (a.cfo_score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    const simDiff = (b.similarity ?? 0) - (a.similarity ?? 0);
    if (simDiff !== 0) return simDiff;
    const da = new Date(a.publication_date || 0).getTime();
    const db = new Date(b.publication_date || 0).getTime();
    return db - da;
  });
  const seen = new Set<string>();
  const deduped: Job[] = [];
  for (const job of ranked) {
    const key = (job as any).job_id || `${job.title}::${job.company}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(job);
  }

  return {
    data: deduped,
    total: deduped.length,
    page,
    pageSize,
    totalPages: Math.ceil(deduped.length / pageSize)
  };
}

export async function preprocessDanishQuery(query: string): Promise<string> {
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
    return preprocessDanishQueryFallback(query);
  }
}

export function preprocessDanishQueryFallback(query: string): string {
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
}

export async function searchJobsHybrid(
  query: string,
  params?: JobFilters & {
    matchThreshold?: number;
    minScore?: number;
  }
): Promise<{ data: Job[]; total: number; page: number; pageSize: number; totalPages: number }> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

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
      return searchJobsSemantic(processedQuery.searchStrategy.query, params);
    
    case 'text':
      return searchJobsText(processedQuery.searchStrategy.query, params);
    
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

  const { data: searchResults, error } = await supabase.rpc('match_jobs_hybrid', {
    query_embedding: queryEmbedding,
    search_text: processedQuery.processed,
    match_threshold: params?.matchThreshold || 0.01,
    match_count: params?.pageSize || 30,
    min_score: params?.minScore || 1
  });

  if (error) {
    console.error('Hybrid search error:', error);
    return searchJobs(processedQuery.processed, params);
  }

  // Check if results are relevant
  const hasRelevantResults = searchResults && searchResults.length > 0 && 
    searchResults.some((job: Job & { similarity?: number }) => (job.similarity || 0) > 0.1);

  if (!hasRelevantResults) {
    console.log('No relevant hybrid results, trying text search fallback');
    return searchJobsText(processedQuery.processed, params);
  }

  const estimatedTotal = searchResults?.length || 0;
  const rankedH = (searchResults || []).slice().sort((a: any, b: any) => {
    const scoreDiff = (b.cfo_score ?? 0) - (a.cfo_score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    const simDiff = (b.similarity ?? 0) - (a.similarity ?? 0);
    if (simDiff !== 0) return simDiff;
    const da = new Date(a.publication_date || 0).getTime();
    const db = new Date(b.publication_date || 0).getTime();
    return db - da;
  });
  const seenH = new Set<string>();
  const dedupedH: Job[] = [];
  for (const job of rankedH) {
    const key = (job as any).job_id || `${job.title}::${job.company}`;
    if (seenH.has(key)) continue;
    seenH.add(key);
    dedupedH.push(job);
  }

  return {
    data: dedupedH,
    total: dedupedH.length,
    page: params?.page || 1,
    pageSize: params?.pageSize || 30,
    totalPages: Math.ceil(dedupedH.length / (params?.pageSize || 30))
  };

}

export async function searchJobsText(
  query: string,
  params?: JobFilters & {
    minScore?: number;
  }
): Promise<{ data: Job[]; total: number; page: number; pageSize: number; totalPages: number }> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const {
    page = 1,
    pageSize = 20,
    minScore = 1,
    ...base
  } = params || {};

  const { data: searchResults, error } = await supabase.rpc('match_jobs_text', {
    search_text: query,
    match_count: pageSize,
    min_score: minScore
  });

  if (error) {
    console.error('Text search error:', error);
    // Fallback to regular search
    return searchJobs(query, params);
  }

  const estimatedTotal = searchResults?.length || 0;
  const rankedT = (searchResults || []).slice().sort((a: any, b: any) => {
    const scoreDiff = (b.cfo_score ?? 0) - (a.cfo_score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    const da = new Date(a.publication_date || 0).getTime();
    const db = new Date(b.publication_date || 0).getTime();
    return db - da;
  });
  const seenT = new Set<string>();
  const dedupedT: Job[] = [];
  for (const job of rankedT) {
    const key = (job as any).job_id || `${job.title}::${job.company}`;
    if (seenT.has(key)) continue;
    seenT.add(key);
    dedupedT.push(job);
  }

  return {
    data: dedupedT,
    total: dedupedT.length,
    page,
    pageSize,
    totalPages: Math.ceil(dedupedT.length / pageSize)
  };
}

export async function getJobStatistics(): Promise<{
  totalUrgentJobs: number;
  totalHighPriorityJobs: number;
  totalLowPriorityJobs: number;
}> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data: statsData, error } = await supabase
    .from('jobs')
    .select('cfo_score')
    .is('deleted_at', null)
    .gte('cfo_score', 1);

  if (error) {
    console.error('Error fetching job statistics:', error);
    return {
      totalUrgentJobs: 0,
      totalHighPriorityJobs: 0,
      totalLowPriorityJobs: 0,
    };
  }

  // Calculate statistics from all jobs
  const totalUrgentJobs = statsData?.filter((job: { cfo_score: number }) => job.cfo_score === 3).length || 0;
  const totalHighPriorityJobs = statsData?.filter((job: { cfo_score: number }) => job.cfo_score === 2).length || 0;
  const totalLowPriorityJobs = statsData?.filter((job: { cfo_score: number }) => job.cfo_score === 1).length || 0;

  return {
    totalUrgentJobs,
    totalHighPriorityJobs,
    totalLowPriorityJobs,
  };
}

export async function getJobRecommendations(
  jobId: string,
  params?: JobFilters & {
    minScore?: number;
  }
): Promise<{ data: Job[]; total: number; page: number; pageSize: number; totalPages: number }> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data: recommendations, error } = await supabase.rpc('get_job_recommendations', {
    job_id_param: jobId,
    match_count: params?.pageSize || 20,
    min_score: params?.minScore || 1
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
    page: 1,
    pageSize: 20,
    totalPages: Math.ceil(estimatedTotal / (params?.pageSize || 20))
  };
} 