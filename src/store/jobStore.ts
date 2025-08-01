import { create } from 'zustand';
import { Job, JobFilters } from '@/types/job';
import { jobService } from '@/services/jobService';

interface JobStore {
  jobs: Job[];
  filteredJobs: Job[];
  selectedJob: Job | null;
  filters: JobFilters;
  isModalOpen: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setJobs: (jobs: Job[]) => void;
  setFilters: (filters: JobFilters) => void;
  setSelectedJob: (job: Job | null) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  openJobModal: (job: Job) => void;
  closeJobModal: () => void;
  applyFilters: () => void;
  resetFilters: () => void;
  
  // Async actions
  fetchJobs: () => Promise<void>;
  searchJobs: (query: string) => Promise<void>;
  createJob: (job: Omit<Job, 'id'>) => Promise<void>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  filteredJobs: [],
  selectedJob: null,
  filters: {},
  isModalOpen: false,
  isLoading: false,
  error: null,

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
  },

  // Async actions
  fetchJobs: async () => {
    set({ isLoading: true, error: null });
    try {
      const jobs = await jobService.getAllJobs();
      set({ jobs, filteredJobs: jobs, isLoading: false });
    } catch (error) {
      set({ error: 'Fejl ved hentning af jobs', isLoading: false });
      console.error('Error fetching jobs:', error);
    }
  },

  searchJobs: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const jobs = await jobService.searchJobs(query);
      set({ jobs, filteredJobs: jobs, isLoading: false });
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
      set({ jobs: updatedJobs, filteredJobs: updatedJobs, isLoading: false });
    } catch (error) {
      set({ error: 'Fejl ved oprettelse af job', isLoading: false });
      console.error('Error creating job:', error);
    }
  },

  updateJob: async (id: string, updates: Partial<Job>) => {
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

  deleteJob: async (id: string) => {
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