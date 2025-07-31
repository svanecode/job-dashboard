import { create } from 'zustand';
import { Job, JobFilters } from '@/types/job';
import { mockJobs } from '@/data/mockJobs';

interface JobStore {
  jobs: Job[];
  filteredJobs: Job[];
  selectedJob: Job | null;
  filters: JobFilters;
  isModalOpen: boolean;
  
  // Actions
  setJobs: (jobs: Job[]) => void;
  setFilters: (filters: JobFilters) => void;
  setSelectedJob: (job: Job | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  openJobModal: (job: Job) => void;
  closeJobModal: () => void;
  applyFilters: () => void;
  resetFilters: () => void;
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: mockJobs,
  filteredJobs: mockJobs,
  selectedJob: null,
  filters: {},
  isModalOpen: false,

  setJobs: (jobs) => set({ jobs }),
  
  setFilters: (filters) => {
    set({ filters });
    get().applyFilters();
  },
  
  setSelectedJob: (job) => set({ selectedJob: job }),
  
  setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
  
  openJobModal: (job) => set({ selectedJob: job, isModalOpen: true }),
  
  closeJobModal: () => set({ selectedJob: null, isModalOpen: false }),
  
  applyFilters: () => {
    const { jobs, filters } = get();
    let filtered = [...jobs];

    // Filter by score
    if (filters.score !== undefined) {
      filtered = filtered.filter(job => job.score === filters.score);
    }

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by score DESC, then by date DESC
    filtered.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime();
    });

    set({ filteredJobs: filtered });
  },
  
  resetFilters: () => {
    set({ filters: {} });
    get().applyFilters();
  }
})); 