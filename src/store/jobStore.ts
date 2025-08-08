import { create } from 'zustand'
import { Job, JobFilters } from '@/types/job'
import { 
  getAllJobs, 
  getJobStatistics, 
  searchJobs, 
  getJobsByScore, 
  getJobsByLocation, 
  getJobsByDate,
  createJob as createJobService,
  updateJob as updateJobService,
  deleteJob as deleteJobService
} from '@/services/jobService'
import { type SortConfig } from '@/utils/sort'

// Cache configuration for daily job updates
// - Job data: 5 minutes cache (increased from 2 minutes)
// - Statistics: 10 minutes cache (increased from 5 minutes)
// - URL filters: 500ms debounce

// URL synchronization utilities
const parseFiltersFromURL = (): Partial<JobFilters> => {
  if (typeof window === 'undefined') return {}
  
  const urlParams = new URLSearchParams(window.location.search)
  return {
    q: urlParams.get('q') || undefined,
    searchText: urlParams.get('q') || undefined, // Legacy compatibility
    location: urlParams.get('location') ? urlParams.get('location')!.split(',') : undefined,
    score: urlParams.get('score') ? urlParams.get('score')!.split(',').map(Number) : undefined,
    dateFrom: urlParams.get('from') || undefined,
    dateTo: urlParams.get('to') || undefined,
    daysAgo: urlParams.get('days') ? parseInt(urlParams.get('days')!) : undefined, // Legacy
  }
}

const updateURLWithFilters = (filters: JobFilters) => {
  if (typeof window === 'undefined') return
  
  const url = new URL(window.location.href)
  const params = url.searchParams
  
  // Clear existing filter params
  params.delete('q')
  params.delete('location')
  params.delete('score')
  params.delete('from')
  params.delete('to')
  params.delete('days') // Legacy
  
  // Add new filter params
  if (filters.q) params.set('q', filters.q)
  if (filters.location) {
    const locationArray = Array.isArray(filters.location) ? filters.location : [filters.location]
    if (locationArray.length > 0) params.set('location', locationArray.join(','))
  }
  if (filters.score) {
    const scoreArray = Array.isArray(filters.score) ? filters.score : [filters.score]
    if (scoreArray.length > 0) params.set('score', scoreArray.join(','))
  }
  if (filters.dateFrom) params.set('from', filters.dateFrom)
  if (filters.dateTo) params.set('to', filters.dateTo)
  
  // Update URL without full navigation
  window.history.replaceState({}, '', url.toString())
}

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
  initializeFromURL: () => void
  clearCache: () => void
  setInitialData: (data: { data: Job[]; total: number; page: number; pageSize: number; totalPages: number }) => void
  
  // Data fetching
  fetchJobs: () => Promise<void>
  fetchStatistics: () => Promise<void>
  searchJobs: (query: string) => Promise<void>
  fetchJobsByScore: (score: number) => Promise<void>
  fetchJobsByLocation: (location: string) => Promise<void>
  fetchJobsByDate: (daysAgo: number) => Promise<void>
  
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
  
  sort: { key: 'score', dir: 'desc' },
  
  // Cache
  lastFetchTime: 0,
  cacheKey: '',
  lastStatsFetchTime: 0,
  isInitialized: false,
  
  // Initialize filters from URL
  initializeFromURL: () => {
    const { isInitialized } = get()
    if (isInitialized) return // Prevent double initialization
    
    const urlFilters = parseFiltersFromURL()
    if (Object.keys(urlFilters).length > 0) {
      set((state) => ({
        filters: { ...state.filters, ...urlFilters },
        isInitialized: true
      }))
      // Apply filters after initialization
      setTimeout(() => get().applyFilters(), 100)
    } else {
      // If no filters, just fetch jobs and statistics
      set({ isInitialized: true })
      setTimeout(() => {
        get().fetchJobs()
        get().fetchStatistics()
      }, 100)
    }
  },
  
  // Filter actions
  setFilters: (newFilters) => {
    set((state) => {
      let updatedFilters = { ...state.filters, ...newFilters }
      
      // Handle score toggle: if same score is selected, remove it
      if ('score' in newFilters && newFilters.score === state.filters.score) {
        updatedFilters = { ...updatedFilters, score: undefined }
      }
      
      return {
        filters: updatedFilters,
        currentPage: 1, // Reset to first page when filters change
      }
    })
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
    
    // Clear URL params
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      const params = url.searchParams
      params.delete('q')
      params.delete('location')
      params.delete('score')
      params.delete('from')
      params.delete('to')
      params.delete('days')
      window.history.replaceState({}, '', url.toString())
    }
    
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
    
    // Apply filters in priority order
    if (filtersToApply.searchText) {
      get().searchJobs(filtersToApply.searchText)
    } else if (filtersToApply.score !== undefined) {
      // Handle both single score and array of scores
      const scoreValue = Array.isArray(filtersToApply.score) ? filtersToApply.score[0] : filtersToApply.score
      if (scoreValue !== undefined) {
        get().fetchJobsByScore(scoreValue)
      }
    } else if (filtersToApply.location) {
      // Handle both single location and array of locations
      const locationValue = Array.isArray(filtersToApply.location) ? filtersToApply.location[0] : filtersToApply.location
      if (locationValue) {
        get().fetchJobsByLocation(locationValue)
      }
    } else if (filtersToApply.daysAgo !== undefined) {
      get().fetchJobsByDate(filtersToApply.daysAgo)
    } else {
      get().fetchJobs()
    }
  },
  
  setCurrentPage: (page) => {
    const { currentPage: oldPage, jobsPerPage, sort, filters } = get()
    
    // Don't do anything if we're already on the requested page
    if (page === oldPage) {
      return
    }
    
    set({ currentPage: page })
    
    // Clear cache for this specific page to force fresh data
    const newCacheKey = `${page}-${jobsPerPage}-${sort.key}-${sort.dir}`
    set({ cacheKey: '', lastFetchTime: 0 })
    
    // Re-fetch data for new page based on current filters
    if (filters.searchText) {
      get().searchJobs(filters.searchText)
    } else if (filters.score !== undefined) {
      // Handle both single score and array of scores
      const scoreValue = Array.isArray(filters.score) ? filters.score[0] : filters.score
      if (scoreValue !== undefined) {
        get().fetchJobsByScore(scoreValue)
      }
    } else if (filters.location) {
      // Handle both single location and array of locations
      const locationValue = Array.isArray(filters.location) ? filters.location[0] : filters.location
      if (locationValue) {
        get().fetchJobsByLocation(locationValue)
      }
    } else if (filters.daysAgo !== undefined) {
      get().fetchJobsByDate(filters.daysAgo)
    } else {
      get().fetchJobs()
    }
  },
  
  setSort: (newSort) => {
    set({ sort: newSort })
    // Re-fetch data with new sort config
    get().applyFilters()
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
    
    // Check if we can use cached statistics (cache for 10 minutes - increased from 5 minutes)
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

  fetchJobs: async () => {
    const { currentPage, jobsPerPage, sort, lastFetchTime, cacheKey } = get()
    const newCacheKey = `${currentPage}-${jobsPerPage}-${sort.key}-${sort.dir}`
    const now = Date.now()
    
    // Only use cache if we have a valid cache key and it matches the current request
    if (cacheKey && cacheKey === newCacheKey && (now - lastFetchTime) < 300000) {
      return
    }
    
    set({ isLoading: true, error: null })
    try {
      const response = await getAllJobs({ 
        page: currentPage, 
        pageSize: jobsPerPage,
        sort 
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
  },
  
  searchJobs: async (query: string) => {
    set({ isLoading: true, error: null })
    try {
      const { currentPage, jobsPerPage, sort } = get()
      const response = await searchJobs(query, { 
        page: currentPage, 
        pageSize: jobsPerPage,
        sort 
      })
      
      set({
        jobs: response.data,
        paginatedJobs: response.data,
        totalJobs: response.total,
        totalPages: response.totalPages,
        isLoading: false,
        // Clear cache for search results to ensure fresh data
        cacheKey: '',
        lastFetchTime: 0,
      })
    } catch (error) {
      console.error('Error searching jobs:', error)
      set({
        error: 'Fejl ved søgning',
        isLoading: false,
      })
    }
  },
  
  fetchJobsByScore: async (score: number) => {
    set({ isLoading: true, error: null })
    try {
      const { currentPage, jobsPerPage, sort } = get()
      const response = await getJobsByScore(score, { 
        page: currentPage, 
        pageSize: jobsPerPage,
        sort 
      })
      
      set({
        jobs: response.data,
        paginatedJobs: response.data,
        totalJobs: response.total,
        totalPages: response.totalPages,
        isLoading: false,
        // Clear cache for filtered results to ensure fresh data
        cacheKey: '',
        lastFetchTime: 0,
      })
    } catch (error) {
      console.error('Error fetching jobs by score:', error)
      set({
        error: 'Fejl ved indlæsning af jobs',
        isLoading: false,
      })
    }
  },
  
  fetchJobsByLocation: async (location: string) => {
    set({ isLoading: true, error: null })
    try {
      const { currentPage, jobsPerPage, sort } = get()
      const response = await getJobsByLocation(location, { 
        page: currentPage, 
        pageSize: jobsPerPage,
        sort 
      })
      
      set({
        jobs: response.data,
        paginatedJobs: response.data,
        totalJobs: response.total,
        totalPages: response.totalPages,
        isLoading: false,
        // Clear cache for filtered results to ensure fresh data
        cacheKey: '',
        lastFetchTime: 0,
      })
    } catch (error) {
      console.error('Error fetching jobs by location:', error)
      set({
        error: 'Fejl ved indlæsning af jobs',
        isLoading: false,
      })
    }
  },
  
  fetchJobsByDate: async (daysAgo: number) => {
    set({ isLoading: true, error: null })
    try {
      const { currentPage, jobsPerPage, sort } = get()
      const response = await getJobsByDate(daysAgo, { 
        page: currentPage, 
        pageSize: jobsPerPage,
        sort 
      })
      
      set({
        jobs: response.data,
        paginatedJobs: response.data,
        totalJobs: response.total,
        totalPages: response.totalPages,
        isLoading: false,
        // Clear cache for filtered results to ensure fresh data
        cacheKey: '',
        lastFetchTime: 0,
      })
    } catch (error) {
      console.error('Error fetching jobs by date:', error)
      set({
        error: 'Fejl ved indlæsning af jobs',
        isLoading: false,
      })
    }
  },
  
  // CRUD operations
  createJob: async (job) => {
    try {
      await createJobService(job)
      get().clearCache() // Clear cache to force refresh
      get().applyFilters() // Refresh data and statistics
    } catch (error) {
      console.error('Error creating job:', error)
      set({ error: 'Fejl ved oprettelse af job' })
    }
  },
  
  updateJob: async (id, job) => {
    try {
      await updateJobService(id, job)
      get().clearCache() // Clear cache to force refresh
      get().applyFilters() // Refresh data and statistics
    } catch (error) {
      console.error('Error updating job:', error)
      set({ error: 'Fejl ved opdatering af job' })
    }
  },
  
  deleteJob: async (id) => {
    try {
      await deleteJobService(id)
      get().clearCache() // Clear cache to force refresh
      get().applyFilters() // Refresh data and statistics
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