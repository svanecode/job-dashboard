import { create } from 'zustand';
import { Job, JobFilters } from '@/types/job';
import { jobService } from '@/services/jobService';

interface JobStore {
  jobs: Job[];
  filteredJobs: Job[];
  paginatedJobs: Job[];
  selectedJob: Job | null;
  filters: JobFilters;
  isModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  jobsPerPage: number;
  
  // Actions
  setJobs: (jobs: Job[]) => void;
  setFilters: (filters: JobFilters) => void;
  setSelectedJob: (job: Job | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  openJobModal: (job: Job) => void;
  closeJobModal: () => void;
  applyFilters: () => void;
  resetFilters: () => void;
  setCurrentPage: (page: number) => void;
  
  // Async actions
  fetchJobs: () => Promise<void>;
  searchJobs: (query: string) => Promise<void>;
  createJob: (job: Omit<Job, 'id'>) => Promise<void>;
  updateJob: (id: number, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: number) => Promise<void>;
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  filteredJobs: [],
  paginatedJobs: [],
  selectedJob: null,
  filters: {},
  isModalOpen: false,
  isLoading: false,
  error: null,
  currentPage: 1,
  jobsPerPage: 20,

  setJobs: (jobs) => set({ jobs }),
  
  setFilters: (filters) => {
    set({ filters, currentPage: 1 }); // Reset to first page when filters change
    get().applyFilters();
  },
  
  setSelectedJob: (job) => set({ selectedJob: job }),
  
  setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
  
  openJobModal: (job) => set({ selectedJob: job, isModalOpen: true }),
  
  closeJobModal: () => set({ selectedJob: null, isModalOpen: false }),
  
  setCurrentPage: (page: number) => {
    set({ currentPage: page });
    get().applyFilters();
  },
  
  applyFilters: () => {
    const { jobs, filters, currentPage, jobsPerPage } = get();
    
    // First, filter out jobs without CFO score
    let filtered = jobs.filter(job => job.cfo_score !== null);

    // Filter by score
    if (filters.score !== undefined) {
      filtered = filtered.filter(job => job.cfo_score === filters.score);
    }

    // Filter by location
    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location?.toLowerCase().includes(filters.location!.toLowerCase()) || false
      );
    }

    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(job =>
        (job.title?.toLowerCase().includes(searchLower) || false) ||
        (job.company?.toLowerCase().includes(searchLower) || false) ||
        (job.description?.toLowerCase().includes(searchLower) || false)
      );
    }

    // Sort by score DESC, then by date DESC
    filtered.sort((a, b) => {
      const scoreA = a.cfo_score ?? -1;
      const scoreB = b.cfo_score ?? -1;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      const dateA = a.publication_date ? new Date(a.publication_date).getTime() : 0;
      const dateB = b.publication_date ? new Date(b.publication_date).getTime() : 0;
      return dateB - dateA;
    });

    // Apply pagination
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    set({ filteredJobs: filtered, paginatedJobs: paginated });
  },
  
  resetFilters: () => {
    set({ filters: {}, currentPage: 1 });
    get().applyFilters();
  },

  // Async actions
  fetchJobs: async () => {
    set({ isLoading: true, error: null });
    try {
      const jobs = await jobService.getAllJobs();
      set({ jobs, isLoading: false });
      get().applyFilters(); // Apply filters and pagination
    } catch (error) {
      set({ error: 'Fejl ved hentning af jobs', isLoading: false });
      console.error('Error fetching jobs:', error);
    }
  },

  searchJobs: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const jobs = await jobService.searchJobs(query);
      set({ jobs, isLoading: false });
      get().applyFilters(); // Apply filters and pagination
    } catch (error) {
      set({ error: 'Fejl ved søgning', isLoading: false });
      console.error('Error searching jobs:', error);
    }
  },

  createJob: async (job: Omit<Job, 'id'>) => {
    set({ isLoading: true, error: null });
    try {
      const newJob = await jobService.createJob(job);
      const { jobs } = get();
      const updatedJobs = [newJob, ...jobs];
      set({ jobs: updatedJobs, isLoading: false });
      get().applyFilters(); // Apply filters and pagination
    } catch (error) {
      set({ error: 'Fejl ved oprettelse af job', isLoading: false });
      console.error('Error creating job:', error);
    }
  },

  updateJob: async (id: number, updates: Partial<Job>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedJob = await jobService.updateJob(id, updates);
      const { jobs } = get();
      const updatedJobs = jobs.map(job => job.id === id ? updatedJob : job);
      set({ jobs: updatedJobs, isLoading: false });
      get().applyFilters(); // Re-apply filters to update filteredJobs
    } catch (error) {
      set({ error: 'Fejl ved opdatering af job', isLoading: false });
      console.error('Error updating job:', error);
    }
  },

  deleteJob: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await jobService.deleteJob(id);
      const { jobs } = get();
      const updatedJobs = jobs.filter(job => job.id !== id);
      set({ jobs: updatedJobs, isLoading: false });
      get().applyFilters(); // Re-apply filters to update filteredJobs
    } catch (error) {
      set({ error: 'Fejl ved sletning af job', isLoading: false });
      console.error('Error deleting job:', error);
    }
  }
})); 