-- Performance optimization indexes for jobs table
-- These indexes will significantly improve query performance

-- Composite index for the most common query pattern
-- This covers: deleted_at IS NULL AND cfo_score >= 1 with sorting
CREATE INDEX IF NOT EXISTS idx_jobs_performance_main 
ON jobs (deleted_at, cfo_score DESC, publication_date DESC) 
WHERE deleted_at IS NULL;

-- Index for score filtering
CREATE INDEX IF NOT EXISTS idx_jobs_cfo_score 
ON jobs (cfo_score DESC) 
WHERE deleted_at IS NULL;

-- Index for location filtering
CREATE INDEX IF NOT EXISTS idx_jobs_location_filter 
ON jobs (location, cfo_score DESC) 
WHERE deleted_at IS NULL AND cfo_score >= 1;

-- Index for company filtering
CREATE INDEX IF NOT EXISTS idx_jobs_company_filter 
ON jobs (company, cfo_score DESC) 
WHERE deleted_at IS NULL AND cfo_score >= 1;

-- Index for date filtering
CREATE INDEX IF NOT EXISTS idx_jobs_date_filter 
ON jobs (publication_date DESC, cfo_score DESC) 
WHERE deleted_at IS NULL AND cfo_score >= 1;

-- Index for text search (if using ILIKE)
CREATE INDEX IF NOT EXISTS idx_jobs_title_search 
ON jobs USING gin (to_tsvector('danish', title)) 
WHERE deleted_at IS NULL AND cfo_score >= 1;

CREATE INDEX IF NOT EXISTS idx_jobs_company_search 
ON jobs USING gin (to_tsvector('danish', company)) 
WHERE deleted_at IS NULL AND cfo_score >= 1;

CREATE INDEX IF NOT EXISTS idx_jobs_description_search 
ON jobs USING gin (to_tsvector('danish', description)) 
WHERE deleted_at IS NULL AND cfo_score >= 1;

-- Statistics view for faster statistics calculation (optional)
-- This view can be used for more complex statistics if needed
CREATE OR REPLACE VIEW jobs_statistics AS
SELECT 
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN cfo_score = 3 THEN 1 END) as total_urgent_jobs,
  COUNT(CASE WHEN cfo_score = 2 THEN 1 END) as total_high_priority_jobs,
  COUNT(CASE WHEN cfo_score = 1 THEN 1 END) as total_low_priority_jobs
FROM jobs 
WHERE deleted_at IS NULL AND cfo_score >= 1; 