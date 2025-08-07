# Vector Search Setup Guide

## ⚠️ VIGTIGT: Dette skal køres i Supabase!

Vector search fungerer IKKE før du har kørt SQL'en nedenfor i Supabase Dashboard.

For at få vector search til at virke i chatbot'en, skal du køre følgende SQL i Supabase:

## 1. Gå til Supabase Dashboard

1. Åbn https://supabase.com/dashboard
2. Vælg dit projekt
3. Gå til "SQL Editor"

## 2. Kør Vector Search Function

Kopier og kør følgende SQL:

```sql
-- Create function for similarity search with your table structure
CREATE OR REPLACE FUNCTION match_jobs_similarity(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
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
    AND jobs.cfo_score >= 1
    AND 1 - (jobs.embedding <=> query_embedding) > match_threshold
  ORDER BY jobs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## 3. Test Function

Efter du har kørt funktionen, kan du teste den:

```sql
-- Test with a simple embedding
SELECT * FROM match_jobs_similarity(
  '[0.1, 0.2, 0.3, ...]'::vector(1536), -- Dette er bare et eksempel
  0.1, -- Low threshold for testing
  5    -- Get 5 results
);
```

## 4. Verificer Setup

Tjek at alt er korrekt:

```sql
-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'match_jobs_similarity';

-- Check if jobs have embeddings
SELECT COUNT(*) as total_jobs, 
       COUNT(embedding) as jobs_with_embeddings,
       COUNT(CASE WHEN cfo_score >= 1 THEN 1 END) as high_score_jobs
FROM jobs 
WHERE deleted_at IS NULL;
```

## 5. Hvad Sker Der Nu

Efter du har kørt SQL'en:

- ✅ **Vector search** vil fungere først
- ✅ **Fallback search** vil kun bruges hvis vector search fejler
- ✅ **Bedre relevans** - Vector search giver mere præcise resultater
- ✅ **Hurtigere** - Vector search er optimeret med indexes

## 6. Test Chatbot

Efter setup, test chatbot'en med:
- "CFO stillinger"
- "Interim jobs"
- "Controller stillinger"

Vector search skulle nu fungere og give bedre resultater end fallback search! 🎉 