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
} 