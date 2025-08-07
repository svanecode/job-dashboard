-- Fix the get_job_comments function to join with public.users table
CREATE OR REPLACE FUNCTION get_job_comments(job_id_param TEXT)
RETURNS TABLE (
  id UUID,
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