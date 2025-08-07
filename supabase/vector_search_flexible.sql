-- Create flexible function for similarity search
CREATE OR REPLACE FUNCTION match_jobs_similarity_flexible(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.01,
  match_count int DEFAULT 10,
  min_cfo_score int DEFAULT 1
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
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
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
    AND jobs.cfo_score >= min_cfo_score
    AND 1 - (jobs.embedding <=> query_embedding) > match_threshold
  ORDER BY jobs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 