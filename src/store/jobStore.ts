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
  totalJobs: number;
  totalPages: number;
  
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
  fetchJobsByScore: (score: number) => Promise<void>;
  fetchJobsByLocation: (location: string) => Promise<void>;
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
  totalJobs: 0,
  totalPages: 0,

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
    const { filters } = get();
    
    // For now, we'll use the most specific filter
    // In a real implementation, you'd want to combine filters
    if (filters.searchText) {
      get().searchJobs(filters.searchText);
    } else if (filters.score !== undefined) {
      get().fetchJobsByScore(filters.score);
    } else if (filters.location) {
      get().fetchJobsByLocation(filters.location);
    } else {
      get().fetchJobs();
    }
  },
  
  resetFilters: () => {
    set({ filters: {}, currentPage: 1 });
    get().fetchJobs();
  },

  // Async actions
  fetchJobs: async () => {
    const { currentPage, jobsPerPage } = get();
    set({ isLoading: true, error: null });
    
    try {
      const response = await jobService.getAllJobs({ page: currentPage, pageSize: jobsPerPage });
      set({ 
        jobs: response.data,
        paginatedJobs: response.data,
        totalJobs: response.total,
        totalPages: response.totalPages,
        isLoading: false 
      });
    } catch (error) {
      set({ error: 'Fejl ved hentning af jobs', isLoading: false });
      console.error('Error fetching jobs:', error);
    }
  },

  fetchJobsByScore: async (score: number) => {
    const { currentPage, jobsPerPage } = get();
    set({ isLoading: true, error: null });
    
    try {
      const response = await jobService.getJobsByScore(score, { page: currentPage, pageSize: jobsPerPage });
      set({ 
        jobs: response.data,
        paginatedJobs: response.data,
        totalJobs: response.total,
        totalPages: response.totalPages,
        isLoading: false 
      });
    } catch (error) {
      set({ error: 'Fejl ved hentning af jobs', isLoading: false });
      console.error('Error fetching jobs by score:', error);
    }
  },

  fetchJobsByLocation: async (location: string) => {
    const { currentPage, jobsPerPage } = get();
    set({ isLoading: true, error: null });
    
    try {
      const response = await jobService.getJobsByLocation(location, { page: currentPage, pageSize: jobsPerPage });
      set({ 
        jobs: response.data,
        paginatedJobs: response.data,
        totalJobs: response.total,
        totalPages: response.totalPages,
        isLoading: false 
      });
    } catch (error) {
      set({ error: 'Fejl ved hentning af jobs', isLoading: false });
      console.error('Error fetching jobs by location:', error);
    }
  },

  searchJobs: async (query: string) => {
    const { currentPage, jobsPerPage } = get();
    set({ isLoading: true, error: null });
    
    try {
      const response = await jobService.searchJobs(query, { page: currentPage, pageSize: jobsPerPage });
      set({ 
        jobs: response.data,
        paginatedJobs: response.data,
        totalJobs: response.total,
        totalPages: response.totalPages,
        isLoading: false 
      });
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
      get().fetchJobs(); // Refresh with current pagination
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
      get().fetchJobs(); // Refresh with current pagination
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
      get().fetchJobs(); // Refresh with current pagination
    } catch (error) {
      set({ error: 'Fejl ved sletning af job', isLoading: false });
      console.error('Error deleting job:', error);
    }
  }
})); 