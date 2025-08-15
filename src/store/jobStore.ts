import { create } from 'zustand'
import { Job, JobFilters } from '@/types/job'
import { 
  getAllJobs, 
  getJobStatistics, 
  createJob as createJobService,
  updateJob as updateJobService,
  deleteJob as deleteJobService
} from '@/services/jobService'
import { type SortConfig } from '@/utils/sort'

// Cache configuration for daily job updates
// - Job data: 5 minutes cache (increased from 2 minutes)
// - Statistics: 10 minutes cache (increased from 5 minutes)

interface JobStore {
  // Data
  jobs: Job[]
  paginatedJobs: Job[]
  totalJobs: number
  totalPages: number
  currentPage: number
  jobsPerPage: number
  
  // Statistics (across all pages)
  totalUrgentJobs: number
  totalHighPriorityJobs: number
  totalLowPriorityJobs: number
  
  // UI State
  isLoading: boolean
  error: string | null
  selectedJob: Job | null
  isModalOpen: boolean
  rowDensity?: 'comfortable' | 'compact'
  
  // Filters
  filters: JobFilters
  stagedFilters?: JobFilters
  
  // Sorting
  sort: SortConfig
  
  // Cache
  lastFetchTime: number
  cacheKey: string
  lastStatsFetchTime: number
  isInitialized: boolean
  
  // Actions
  setFilters: (filters: Partial<JobFilters>) => void
  setStagedFilters: (filters: JobFilters) => void
  resetFilters: () => void
  applyFilters: (payload?: JobFilters) => void
  setCurrentPage: (page: number) => void
  setSort: (sort: SortConfig) => void
  setJobsPerPage: (jobsPerPage: number) => void
  setRowDensity?: (density: 'comfortable' | 'compact') => void
  initializeFromURL: () => void
  initializeFromParams: (filters: Partial<JobFilters>, page?: number) => void
  clearCache: () => void
  setInitialData: (data: { data: Job[]; total: number; page: number; pageSize: number; totalPages: number }) => void
  
  // Data fetching
  fetchJobs: () => Promise<void>
  fetchStatistics: () => Promise<void>
  
  // CRUD operations
  createJob: (job: Omit<Job, 'id'>) => Promise<void>
  updateJob: (id: number, job: Partial<Job>) => Promise<void>
  deleteJob: (id: number) => Promise<void>
  
  // Modal
  openJobModal: (job: Job) => void
  closeJobModal: () => void
}

export const useJobStore = create<JobStore>((set, get) => ({
  // Initial state
  jobs: [],
  paginatedJobs: [],
  totalJobs: 0,
  totalPages: 0,
  currentPage: 1,
  jobsPerPage: 20,
  
  // Statistics (across all pages)
  totalUrgentJobs: 0,
  totalHighPriorityJobs: 0,
  totalLowPriorityJobs: 0,
  
  isLoading: false,
  error: null,
  selectedJob: null,
  isModalOpen: false,
  rowDensity: 'comfortable',
  
  filters: {
    q: '',
    searchText: '', // Legacy compatibility
    score: undefined,
    location: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    daysAgo: undefined,
  },
  
  stagedFilters: undefined,
  
  sort: { key: 'date', dir: 'desc' },
  
  // Cache
  lastFetchTime: 0,
  cacheKey: '',
  lastStatsFetchTime: 0,
  isInitialized: false,
  
  // Initialize filters from URL
  initializeFromURL: () => {
    const { isInitialized } = get()
    if (isInitialized) return // Prevent double initialization
    
    // Mark as initialized and fetch data
    set({ isInitialized: true })
    setTimeout(() => {
      get().fetchJobs()
      get().fetchStatistics()
    }, 100)
  },

  // Initialize directly from provided params (SSR-provided or parsed searchParams)
  initializeFromParams: (params, page) => {
    const { isInitialized } = get()
    if (isInitialized) return
    
    const mergedFilters: JobFilters = {
      ...get().filters,
      ...params,
    }
    
    set({ 
      filters: mergedFilters, 
      currentPage: page && page > 0 ? page : 1, 
      isInitialized: true 
    })
    
    // Fetch using these filters immediately
    setTimeout(() => get().applyFilters(mergedFilters), 0)
  },
  
  // Filter actions
  setFilters: (newFilters) => {
    console.log('JobStore: setFilters called with:', newFilters);
    
    set((state) => {
      let updatedFilters = { ...state.filters, ...newFilters }
      
      // Handle score toggle: if same score is selected, remove it
      if ('score' in newFilters && newFilters.score === state.filters.score) {
        updatedFilters = { ...updatedFilters, score: undefined }
      }
      
      console.log('JobStore: Updated filters:', updatedFilters);
      
      return {
        filters: updatedFilters,
        currentPage: 1, // Reset to first page when filters change
      }
    })
    
    // Clear cache and fetch jobs with new filters
    console.log('JobStore: Clearing cache and fetching jobs');
    set({ cacheKey: '', lastFetchTime: 0 })
    get().fetchJobs()
  },
  
  setStagedFilters: (stagedFilters) => {
    set({ stagedFilters })
  },
  
  resetFilters: () => {
    const emptyFilters = {
      q: undefined,
      searchText: undefined,
      score: undefined,
      location: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      daysAgo: undefined,
    }
    
    set((state) => ({
      filters: emptyFilters,
      stagedFilters: emptyFilters,
      currentPage: 1,
    }))
    
    // Fetch all jobs and statistics again after resetting filters
    get().fetchJobs()
    get().fetchStatistics()
  },
  
  applyFilters: (payload) => {
    const filtersToApply = payload ?? get().stagedFilters ?? get().filters
    
    // Update actual filters with staged filters
    set({ filters: filtersToApply, stagedFilters: filtersToApply, currentPage: 1 })
    
    // Clear cache to ensure fresh data
    set({ cacheKey: '', lastFetchTime: 0 })
    
    // Always use the centralized fetchJobs method
    get().fetchJobs()
  },
  
  setCurrentPage: (page) => {
    const { currentPage: oldPage } = get()
    
    // Don't do anything if we're already on the requested page
    if (page === oldPage) {
      return
    }
    
    set({ currentPage: page })
    
    // Clear cache for this specific page to force fresh data
    set({ cacheKey: '', lastFetchTime: 0 })
    
    // Use the centralized fetchJobs method with the new page
    get().fetchJobs()
  },
  
  setSort: (newSort) => {
    set({ sort: newSort })
    // Clear cache and re-fetch data with new sort config
    set({ cacheKey: '', lastFetchTime: 0 })
    get().fetchJobs()
  },

  setJobsPerPage: (newJobsPerPage: number) => {
    console.log('JobStore: setJobsPerPage called with:', newJobsPerPage)
    set({ jobsPerPage: newJobsPerPage, currentPage: 1 })
    console.log('JobStore: jobsPerPage updated to:', newJobsPerPage)
    
    // Mark that user has chosen a page size (for persistence across Fast Refresh)
    if (typeof window !== 'undefined') {
      localStorage.setItem('userPageSizeChoice', 'true')
    }
    
    // Clear cache and re-fetch data with new page size
    set({ cacheKey: '', lastFetchTime: 0 })
    get().fetchJobs()
  },

  setRowDensity: (density) => {
    set({ rowDensity: density })
  },

  clearCache: () => {
    set({ 
      lastFetchTime: 0, 
      cacheKey: '', 
      lastStatsFetchTime: 0 
    })
  },
  
  // Data fetching
  fetchStatistics: async () => {
    const { lastStatsFetchTime } = get()
    const now = Date.now()
    
    // Check if we can use cached statistics (cache for 10 minutes)
    if ((now - lastStatsFetchTime) < 600000) {
      return
    }
    
    try {
      const statistics = await getJobStatistics()
      
      set({
        totalUrgentJobs: statistics.totalUrgentJobs,
        totalHighPriorityJobs: statistics.totalHighPriorityJobs,
        totalLowPriorityJobs: statistics.totalLowPriorityJobs,
        lastStatsFetchTime: now,
      })
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  },

  // Centralized job fetching - always uses current filters, sort, and pagination
  fetchJobs: async () => {
    const { currentPage, jobsPerPage, sort, filters, lastFetchTime, cacheKey } = get()
    console.log('JobStore: fetchJobs called with filters:', filters);
    
    const newCacheKey = `${currentPage}-${jobsPerPage}-${sort.key}-${sort.dir}-${JSON.stringify(filters)}`
    const now = Date.now()
    
    // Only use cache if we have a valid cache key and it matches the current request
    if (cacheKey && cacheKey === newCacheKey && (now - lastFetchTime) < 300000) {
      return
    }
    
    set({ isLoading: true, error: null })
    const loadingTimeout = setTimeout(() => {
      // Failsafe to ensure UI does not hang on spinner if something stalls
      set({ isLoading: false })
    }, 5000)
    
    try {
      // Convert filters to the correct format for getAllJobs
      const baseFilters = {
        q: filters.q,
        score: Array.isArray(filters.score) ? filters.score : filters.score ? [filters.score] : undefined,
        location: Array.isArray(filters.location) ? filters.location : filters.location ? [filters.location] : undefined,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        minScore: (filters.score && (Array.isArray(filters.score) ? filters.score.length > 0 : true)) ? undefined : 1, // Kun sæt minScore hvis der ikke er score-filtre
      }
      
      const response = await getAllJobs({ 
        page: currentPage, 
        pageSize: jobsPerPage,
        sort,
        ...baseFilters
      })
      
      set({
        jobs: response.data,
        paginatedJobs: response.data,
        totalJobs: response.total,
        totalPages: response.totalPages,
        isLoading: false,
        lastFetchTime: now,
        cacheKey: newCacheKey,
      })
    } catch (error) {
      console.error('Error fetching jobs:', error)
      set({
        error: 'Fejl ved indlæsning af jobs',
        isLoading: false,
      })
    }
    finally {
      clearTimeout(loadingTimeout)
    }
  },
  
  // CRUD operations
  createJob: async (job) => {
    try {
      await createJobService(job)
      get().clearCache() // Clear cache to force refresh
      get().fetchJobs() // Refresh data
      get().fetchStatistics() // Refresh statistics
    } catch (error) {
      console.error('Error creating job:', error)
      set({ error: 'Fejl ved oprettelse af job' })
    }
  },
  
  updateJob: async (id, job) => {
    try {
      await updateJobService(id, job)
      get().clearCache() // Clear cache to force refresh
      get().fetchJobs() // Refresh data
      get().fetchStatistics() // Refresh statistics
    } catch (error) {
      console.error('Error updating job:', error)
      set({ error: 'Fejl ved opdatering af job' })
    }
  },
  
  deleteJob: async (id) => {
    try {
      await deleteJobService(id)
      get().clearCache() // Clear cache to force refresh
      get().fetchJobs() // Refresh data
      get().fetchStatistics() // Refresh statistics
    } catch (error) {
      console.error('Error deleting job:', error)
      set({ error: 'Fejl ved sletning af job' })
    }
  },
  
  // Modal actions
  openJobModal: (job) => {
    set({ selectedJob: job, isModalOpen: true })
  },
  
  closeJobModal: () => {
    // Only close modal, don't affect pagination data
    set({ selectedJob: null, isModalOpen: false })
  },

  setInitialData: (data) => {
    set({
      jobs: data.data,
      paginatedJobs: data.data,
      totalJobs: data.total,
      totalPages: data.totalPages,
      currentPage: data.page,
      jobsPerPage: data.pageSize,
      isLoading: false,
      error: null,
      lastFetchTime: Date.now(),
      cacheKey: `${data.page}-${data.pageSize}-score-desc`,
    })
  },
})) 