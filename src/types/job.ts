export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  publication_date: string;
  description: string;
  score: 0 | 1 | 2 | 3;
  job_url: string;
}

export interface JobFilters {
  score?: number;
  location?: string;
  searchText?: string;
} 