-- Perfect semantic search function that returns all job fields correctly
-- This fixes the issue where descriptions were coming back as NULL

CREATE OR REPLACE FUNCTION match_jobs_semantic_perfect(
  query_embedding vector,
  match_threshold float DEFAULT 0.3,
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
    COALESCE(jobs.description, '') as description, -- Ensure description is never NULL
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
    AND jobs.description IS NOT NULL -- Only return jobs with actual descriptions
    AND LENGTH(TRIM(jobs.description)) > 0 -- Ensure description is not just whitespace
  ORDER BY jobs.embedding <=> query_embedding ASC
  LIMIT LEAST(match_count, 200);
$$;

-- Alternative function that includes jobs without embeddings as fallback
CREATE OR REPLACE FUNCTION match_jobs_semantic_with_fallback(
  query_embedding vector,
  search_text text DEFAULT '',
  match_threshold float DEFAULT 0.3,
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
  similarity float,
  search_type text
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
      COALESCE(jobs.description, '') as description,
      jobs.cfo_score,
      jobs.job_url,
      1 - (jobs.embedding <=> query_embedding) as similarity,
      'semantic' as search_type
    FROM jobs
    WHERE jobs.embedding IS NOT NULL
      AND jobs.deleted_at IS NULL
      AND jobs.cfo_score >= min_score
      AND jobs.embedding <=> query_embedding < 1 - match_threshold
      AND (location_filter IS NULL OR jobs.location ILIKE '%' || location_filter || '%')
      AND (company_filter IS NULL OR jobs.company ILIKE '%' || company_filter || '%')
      AND jobs.description IS NOT NULL
      AND LENGTH(TRIM(jobs.description)) > 0
  ),
  text_fallback AS (
    SELECT 
      jobs.id,
      jobs.job_id,
      jobs.title,
      jobs.company,
      jobs.location,
      jobs.publication_date,
      COALESCE(jobs.description, '') as description,
      jobs.cfo_score,
      jobs.job_url,
      0.5 as similarity, -- Default similarity for text search
      'text_fallback' as search_type
    FROM jobs
    WHERE jobs.deleted_at IS NULL
      AND jobs.cfo_score >= min_score
      AND (location_filter IS NULL OR jobs.location ILIKE '%' || location_filter || '%')
      AND (company_filter IS NULL OR jobs.company ILIKE '%' || company_filter || '%')
      AND jobs.description IS NOT NULL
      AND LENGTH(TRIM(jobs.description)) > 0
      AND (
        jobs.title ILIKE '%' || search_text || '%'
        OR jobs.description ILIKE '%' || search_text || '%'
        OR jobs.company ILIKE '%' || search_text || '%'
        OR jobs.location ILIKE '%' || search_text || '%'
      )
      AND jobs.id NOT IN (SELECT id FROM semantic_results) -- Avoid duplicates
  )
  SELECT * FROM (
    SELECT * FROM semantic_results
    UNION ALL
    SELECT * FROM text_fallback
  ) combined_results
  ORDER BY 
    CASE 
      WHEN combined_results.search_type = 'semantic' THEN 0 
      ELSE 1 
    END,
    combined_results.similarity DESC
  LIMIT LEAST(match_count, 200);
$$;

-- Function to check embedding status
CREATE OR REPLACE FUNCTION check_embedding_status()
RETURNS TABLE (
  total_jobs bigint,
  jobs_with_embeddings bigint,
  jobs_with_descriptions bigint,
  jobs_with_both bigint,
  jobs_with_neither bigint
)
LANGUAGE sql
AS $$
  SELECT 
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as jobs_with_embeddings,
    COUNT(CASE WHEN description IS NOT NULL AND LENGTH(TRIM(description)) > 0 THEN 1 END) as jobs_with_descriptions,
    COUNT(CASE WHEN embedding IS NOT NULL AND description IS NOT NULL AND LENGTH(TRIM(description)) > 0 THEN 1 END) as jobs_with_both,
    COUNT(CASE WHEN (embedding IS NULL OR description IS NULL OR LENGTH(TRIM(description)) = 0) THEN 1 END) as jobs_with_neither
  FROM jobs
  WHERE deleted_at IS NULL;
$$;

-- Function to get sample jobs with their embedding/description status
CREATE OR REPLACE FUNCTION get_sample_jobs_status(limit_count int DEFAULT 10)
RETURNS TABLE (
  job_id text,
  title text,
  company text,
  has_embedding boolean,
  has_description boolean,
  description_length int,
  cfo_score integer
)
LANGUAGE sql
AS $$
  SELECT 
    jobs.job_id,
    jobs.title,
    jobs.company,
    jobs.embedding IS NOT NULL as has_embedding,
    (jobs.description IS NOT NULL AND LENGTH(TRIM(jobs.description)) > 0) as has_description,
    LENGTH(COALESCE(jobs.description, '')) as description_length,
    jobs.cfo_score
  FROM jobs
  WHERE jobs.deleted_at IS NULL
  ORDER BY jobs.id DESC
  LIMIT limit_count;
$$; 