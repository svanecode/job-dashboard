-- Create saved_jobs table to track user saved jobs
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id TEXT NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Create job_comments table for user comments on jobs
CREATE TABLE IF NOT EXISTS job_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_saved_at ON saved_jobs(saved_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_comments_user_id ON job_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_job_comments_job_id ON job_comments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_comments_created_at ON job_comments(created_at DESC);

-- Create trigger to update updated_at for saved_jobs
DROP TRIGGER IF EXISTS update_saved_jobs_updated_at ON saved_jobs;
CREATE TRIGGER update_saved_jobs_updated_at 
  BEFORE UPDATE ON saved_jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at for job_comments
DROP TRIGGER IF EXISTS update_job_comments_updated_at ON job_comments;
CREATE TRIGGER update_job_comments_updated_at 
  BEFORE UPDATE ON job_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get saved jobs with job details
CREATE OR REPLACE FUNCTION get_saved_jobs(user_uuid UUID, include_expired BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
  saved_job_id UUID,
  job_id TEXT,
  title TEXT,
  company TEXT,
  location TEXT,
  publication_date DATE,
  description TEXT,
  score INTEGER,
  job_url TEXT,
  saved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  comment_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sj.id as saved_job_id,
    sj.job_id,
    j.title,
    j.company,
    j.location,
    j.publication_date,
    j.description,
    j.cfo_score as score,
    j.job_url,
    sj.saved_at,
    sj.notes,
    COUNT(jc.id) as comment_count
  FROM saved_jobs sj
  JOIN jobs j ON sj.job_id = j.job_id
  LEFT JOIN job_comments jc ON j.job_id = jc.job_id
  WHERE sj.user_id = user_uuid
    AND (include_expired OR j.deleted_at IS NULL) -- Filter på deleted_at hvis ikke include_expired
  GROUP BY sj.id, sj.job_id, j.title, j.company, j.location, j.publication_date, j.description, j.cfo_score, j.job_url, sj.saved_at, sj.notes
  ORDER BY sj.saved_at DESC;
END;
$$;

-- Create function to get job comments (visible to all users)
CREATE OR REPLACE FUNCTION get_job_comments(job_id_param TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jc.id,
    jc.user_id,
    jc.comment,
    jc.created_at,
    jc.updated_at,
    COALESCE(u.name, 'Anonymous') as user_name
  FROM job_comments jc
  LEFT JOIN public.users u ON jc.user_id = u.id
  WHERE jc.job_id = job_id_param
  ORDER BY jc.created_at DESC;
END;
$$; 