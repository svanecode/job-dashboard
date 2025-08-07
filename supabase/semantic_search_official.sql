-- Enhanced semantic search function for job matching
-- Based on the actual database schema with proper vector search

-- Match jobs using cosine distance with enhanced filtering
CREATE OR REPLACE FUNCTION match_jobs_semantic(
  query_embedding vector,
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10,
  min_score int DEFAULT 1,
  location_filter text DEFAULT NULL,
  company_filter text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  job_id text,
  title text,
  company text,
  location text,
  publication_date date,
  description text,
  cfo_score integer,
  job_url text,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT 
    jobs.id,
    jobs.job_id,
    jobs.title,
    jobs.company,
    jobs.location,
    jobs.publication_date,
    jobs.description,
    jobs.cfo_score,
    jobs.job_url,
    1 - (jobs.embedding <=> query_embedding) as similarity
  FROM jobs
  WHERE jobs.embedding IS NOT NULL
    AND jobs.deleted_at IS NULL
    AND jobs.cfo_score >= min_score
    AND jobs.embedding <=> query_embedding < 1 - match_threshold
    AND (location_filter IS NULL OR jobs.location ILIKE '%' || location_filter || '%')
    AND (company_filter IS NULL OR jobs.company ILIKE '%' || company_filter || '%')
  ORDER BY jobs.embedding <=> query_embedding ASC
  LIMIT LEAST(match_count, 200);
$$;

-- Hybrid search function that combines semantic and text search
CREATE OR REPLACE FUNCTION match_jobs_hybrid(
  query_embedding vector,
  search_text text,
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 10,
  min_score int DEFAULT 1
)
RETURNS TABLE (
  id bigint,
  job_id text,
  title text,
  company text,
  location text,
  publication_date date,
  description text,
  cfo_score integer,
  job_url text,
  similarity float,
  search_rank float
)
LANGUAGE sql
AS $$
  WITH semantic_results AS (
    SELECT 
      jobs.id,
      jobs.job_id,
      jobs.title,
      jobs.company,
      jobs.location,
      jobs.publication_date,
      jobs.description,
      jobs.cfo_score,
      jobs.job_url,
      1 - (jobs.embedding <=> query_embedding) as similarity,
      0 as search_rank
    FROM jobs
    WHERE jobs.embedding IS NOT NULL
      AND jobs.deleted_at IS NULL
      AND jobs.cfo_score >= min_score
      AND jobs.embedding <=> query_embedding < 1 - match_threshold
  ),
  text_results AS (
    SELECT 
      jobs.id,
      jobs.job_id,
      jobs.title,
      jobs.company,
      jobs.location,
      jobs.publication_date,
      jobs.description,
      jobs.cfo_score,
      jobs.job_url,
      0 as similarity,
      CASE 
        WHEN jobs.title ILIKE '%' || search_text || '%' THEN 0.8
        WHEN jobs.description ILIKE '%' || search_text || '%' THEN 0.6
        WHEN jobs.company ILIKE '%' || search_text || '%' THEN 0.4
        WHEN jobs.location ILIKE '%' || search_text || '%' THEN 0.3
        ELSE 0.1
      END as search_rank
    FROM jobs
    WHERE jobs.deleted_at IS NULL
      AND jobs.cfo_score >= min_score
      AND (
        jobs.title ILIKE '%' || search_text || '%'
        OR jobs.description ILIKE '%' || search_text || '%'
        OR jobs.company ILIKE '%' || search_text || '%'
        OR jobs.location ILIKE '%' || search_text || '%'
      )
  )
  SELECT 
    id,
    job_id,
    title,
    company,
    location,
    publication_date,
    description,
    cfo_score,
    job_url,
    similarity,
    search_rank
  FROM (
    SELECT * FROM semantic_results
    UNION ALL
    SELECT * FROM text_results
  ) combined_results
  ORDER BY (similarity + search_rank) DESC
  LIMIT LEAST(match_count, 200);
$$;

-- Function to get job recommendations based on a job ID
CREATE OR REPLACE FUNCTION get_job_recommendations(
  job_id_param text,
  match_count int DEFAULT 5,
  min_score int DEFAULT 1
)
RETURNS TABLE (
  id bigint,
  job_id text,
  title text,
  company text,
  location text,
  publication_date date,
  description text,
  cfo_score integer,
  job_url text,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT 
    jobs.id,
    jobs.job_id,
    jobs.title,
    jobs.company,
    jobs.location,
    jobs.publication_date,
    jobs.description,
    jobs.cfo_score,
    jobs.job_url,
    1 - (jobs.embedding <=> source_job.embedding) as similarity
  FROM jobs
  CROSS JOIN (
    SELECT embedding 
    FROM jobs 
    WHERE job_id = job_id_param 
      AND embedding IS NOT NULL
  ) source_job
  WHERE jobs.job_id != job_id_param
    AND jobs.embedding IS NOT NULL
    AND jobs.deleted_at IS NULL
    AND jobs.cfo_score >= min_score
  ORDER BY jobs.embedding <=> source_job.embedding ASC
  LIMIT match_count;
$$;

-- Simple text search function as fallback
CREATE OR REPLACE FUNCTION match_jobs_text(
  search_text text,
  match_count int DEFAULT 10,
  min_score int DEFAULT 1
)
RETURNS TABLE (
  id bigint,
  job_id text,
  title text,
  company text,
  location text,
  publication_date date,
  description text,
  cfo_score integer,
  job_url text,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT 
    jobs.id,
    jobs.job_id,
    jobs.title,
    jobs.company,
    jobs.location,
    jobs.publication_date,
    jobs.description,
    jobs.cfo_score,
    jobs.job_url,
    CASE 
      WHEN jobs.title ILIKE '%' || search_text || '%' THEN 0.9
      WHEN jobs.description ILIKE '%' || search_text || '%' THEN 0.7
      WHEN jobs.company ILIKE '%' || search_text || '%' THEN 0.5
      WHEN jobs.location ILIKE '%' || search_text || '%' THEN 0.4
      ELSE 0.2
    END as similarity
  FROM jobs
  WHERE jobs.deleted_at IS NULL
    AND jobs.cfo_score >= min_score
    AND (
      jobs.title ILIKE '%' || search_text || '%'
      OR jobs.description ILIKE '%' || search_text || '%'
      OR jobs.company ILIKE '%' || search_text || '%'
      OR jobs.location ILIKE '%' || search_text || '%'
    )
  ORDER BY similarity DESC
  LIMIT match_count;
$$; 