import { create } from 'zustand'
import { Job, JobFilters } from '@/types/job'
import { type SortConfig } from '@/utils/sort'

interface JobStore {
  // State
  paginatedJobs: Job[]
  totalJobs: number
  totalPages: number
  currentPage: number
  jobsPerPage: number
  
  // Filters and sorting
  filters: JobFilters
  stagedFilters: JobFilters
  sort: SortConfig
  isInitialized: boolean
  
  // UI state
  rowDensity: 'comfortable' | 'compact'
  
  // Actions
  setInitialData: (data: {
    data: Job[]
    total: number
    totalPages: number
    page: number
    pageSize: number
  }) => void
  
  setFilters: (newFilters: Partial<JobFilters>) => void
  stageFilters: (newFilters: Partial<JobFilters>) => void
  setStagedFilters: (stagedFilters: JobFilters) => void
  applyFilters: () => void
  resetFilters: () => void
  
  setCurrentPage: (page: number) => void
  setJobsPerPage: (pageSize: number) => void
  setSort: (sort: SortConfig) => void
  setRowDensity: (density: 'comfortable' | 'compact') => void
  
  // Job modal
  selectedJob: Job | null
  isModalOpen: boolean
  openJobModal: (job: Job) => void
  closeJobModal: () => void
  
  // Saved jobs
  savedJobIds: Set<number>
  toggleSavedJob: (jobId: number) => void
  isJobSaved: (jobId: number) => boolean
}

export const useJobStore = create<JobStore>((set, get) => ({
  // Initial state
  paginatedJobs: [],
  totalJobs: 0,
  totalPages: 0,
  currentPage: 1,
  jobsPerPage: 20,
  
  // Filters and sorting
  filters: { jobStatus: 'active' }, // Sæt en klar standardværdi
  stagedFilters: {},
  sort: { key: 'date', dir: 'desc' },
  isInitialized: false,
  
  // UI state
  rowDensity: 'comfortable',
  
  // Actions
  setInitialData: (data) => {
    // Altid accepter nye data fra serveren - det er nu den eneste kilde
    console.log('🔍 jobStore.setInitialData - Setting new data from server:', { 
      page: data.page, 
      pageSize: data.pageSize, 
      count: data.data.length 
    });
    
    set({
      paginatedJobs: data.data,
      totalJobs: data.total,
      totalPages: data.totalPages,
      currentPage: data.page,
      jobsPerPage: data.pageSize,
      isInitialized: true,
    });
  },

  setFilters: (newFilters) => {
    const currentState = get();
    const newFiltersCombined = { ...currentState.filters, ...newFilters };
    
    // Tjek om filtrene faktisk er ændret
    const hasChanged = JSON.stringify(currentState.filters) !== JSON.stringify(newFiltersCombined);
    
    if (hasChanged) {
      console.log('🔍 jobStore.setFilters - Filters changed, updating state:', newFiltersCombined);
      set({
        filters: newFiltersCombined,
        currentPage: 1, // Nulstil altid til side 1 ved filterændring
      });
      // Fjernet fetchJobs() - serveren vil håndtere datahentning via URL ændring
    } else {
      console.log('🔍 jobStore.setFilters - No changes detected, skipping update');
    }
  },
  
  stageFilters: (newFilters) => {
    set((state) => ({
      stagedFilters: { ...state.stagedFilters, ...newFilters }
    }));
  },

  setStagedFilters: (stagedFilters) => {
    set({ stagedFilters });
  },
  
  applyFilters: (payload?: JobFilters) => {
    const filtersToApply = payload ?? get().stagedFilters ?? get().filters;
    const currentState = get();
    
    // Tjek om filtrene faktisk er ændret
    const hasChanged = JSON.stringify(currentState.filters) !== JSON.stringify(filtersToApply);
    
    if (hasChanged) {
      console.log('🔍 jobStore.applyFilters - Applying new filters:', filtersToApply);
      set({ filters: filtersToApply, stagedFilters: {}, currentPage: 1 });
      // Fjernet fetchJobs() - serveren vil håndtere datahentning via URL ændring
    } else {
      console.log('🔍 jobStore.applyFilters - No changes detected, skipping update');
    }
  },

  resetFilters: () => {
    console.log('🔍 jobStore.resetFilters - Resetting filters');
    set({ 
      filters: { jobStatus: 'active' }, // Nulstil til standard
      stagedFilters: {}, 
      currentPage: 1 
    });
  },

  setCurrentPage: (page) => {
    if (get().currentPage === page) return;
    console.log('🔍 jobStore.setCurrentPage - Page changed from', get().currentPage, 'to', page);
    set({ currentPage: page });
    // Fjernet fetchJobs() - serveren vil håndtere datahentning via URL ændring
  },

  setSort: (newSort) => {
    const currentState = get();
    if (JSON.stringify(currentState.sort) === JSON.stringify(newSort)) return;
    
    console.log('🔍 jobStore.setSort - Sort changed from', currentState.sort, 'to', newSort);
    set({ sort: newSort, currentPage: 1 });
    // Fjernet fetchJobs() - serveren vil håndtere datahentning via URL ændring
  },
  
  setJobsPerPage: (pageSize) => {
    if (get().jobsPerPage === pageSize) return;
    console.log('🔍 jobStore.setJobsPerPage - Page size changed from', get().jobsPerPage, 'to', pageSize);
    set({ jobsPerPage: pageSize, currentPage: 1 });
    // Fjernet fetchJobs() - serveren vil håndtere datahentning via URL ændring
  },
  
  setRowDensity: (density: 'comfortable' | 'compact') => {
    set({ rowDensity: density });
  },

  // Job modal
  selectedJob: null,
  isModalOpen: false,
  openJobModal: (job) => {
    // Valider at job-objektet har de nødvendige felter
    if (!job || !job.job_id) {
      console.error('jobStore.openJobModal: Invalid job object:', job);
      return;
    }
    
    console.log('jobStore.openJobModal: Opening modal for job:', {
      job_id: job.job_id,
      title: job.title,
      company: job.company
    });
    
    set({ selectedJob: job, isModalOpen: true });
  },
  closeJobModal: () => {
    set({ selectedJob: null, isModalOpen: false });
  },

  // Saved jobs
  savedJobIds: new Set(),
  toggleSavedJob: (jobId) => {
    set((state) => {
      const newSet = new Set(state.savedJobIds);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return { savedJobIds: newSet };
    });
  },
  isJobSaved: (jobId) => {
    return get().savedJobIds.has(jobId);
  },
})) 