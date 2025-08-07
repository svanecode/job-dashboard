export interface Job {
  id: number;
  job_id: string;
  title: string | null;
  job_url: string | null;
  company: string | null;
  company_url: string | null;
  location: string | null;
  publication_date: string | null;
  description: string | null;
  created_at: string | null;
  deleted_at: string | null;
  cfo_score: number | null;
  scored_at: string | null;
  job_info: string | null;
  last_seen: string | null;
}

export interface JobFilters {
  score?: number;
  location?: string;
  searchText?: string;
  daysAgo?: number;
}

export interface SavedJob {
  saved_job_id: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  publication_date: string;
  description: string;
  score: number;
  job_url: string;
  saved_at: string;
  notes?: string;
  comment_count: number;
}

export interface JobComment {
  id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  job_id: string;
  job_title?: string;
  job_url?: string;
  company?: string;
}

export interface SaveJobData {
  job_id: string;
  notes?: string;
}

export interface UpdateSavedJobData {
  notes?: string;
} 