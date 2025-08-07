import { create } from 'zustand'
import { Job, JobFilters } from '@/types/job'
import { jobService } from '@/services/jobService'
import { mockJobs } from '@/data/mockJobs'
import { type SortConfig } from '@/utils/sort'

// Cache configuration for daily job updates
// - Job data: 2 minutes cache
// - Statistics: 5 minutes cache
// - URL filters: 500ms debounce

// URL synchronization utilities
const parseFiltersFromURL = (): Partial<JobFilters> => {
  if (typeof window === 'undefined') return {}
  
  const urlParams = new URLSearchParams(window.location.search)
  return {
    searchText: urlParams.get('q') || undefined,
    location: urlParams.get('loc') || undefined,
    score: urlParams.get('score') ? parseInt(urlParams.get('score')!) : undefined,
    daysAgo: urlParams.get('days') ? parseInt(urlParams.get('days')!) : undefined,
  }
}

const updateURLWithFilters = (filters: JobFilters) => {
  if (typeof window === 'undefined') return
  
  const url = new URL(window.location.href)
  const params = url.searchParams
  
  // Clear existing filter params
  params.delete('q')
  params.delete('loc')
  params.delete('score')
  params.delete('days')
  
  // Add new filter params
  if (filters.searchText) params.set('q', filters.searchText)
  if (filters.location) params.set('loc', filters.location)
  if (filters.score !== undefined) params.set('score', filters.score.toString())
  if (filters.daysAgo !== undefined) params.set('days', filters.daysAgo.toString())
  
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
  
  // Actions
  setFilters: (filters: Partial<JobFilters>) => void
  setStagedFilters: (filters: JobFilters) => void
  resetFilters: () => void
  applyFilters: (payload?: JobFilters) => void
  setCurrentPage: (page: number) => void
  setSort: (sort: SortConfig) => void
  initializeFromURL: () => void
  clearCache: () => void
  
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
    score: undefined,
    location: '',
    searchText: '',
    daysAgo: undefined,
  },
  
  stagedFilters: undefined,
  
  sort: { key: 'score', dir: 'desc' },
  
  // Cache
  lastFetchTime: 0,
  cacheKey: '',
  lastStatsFetchTime: 0,
  
  // Initialize filters from URL
  initializeFromURL: () => {
    const urlFilters = parseFiltersFromURL()
    if (Object.keys(urlFilters).length > 0) {
      set((state) => ({
        filters: { ...state.filters, ...urlFilters }
      }))
      // Apply filters after initialization
      setTimeout(() => get().applyFilters(), 100)
    } else {
      // If no filters, just fetch jobs and statistics
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
      
      // Update URL with new filters (debounced)
      if (typeof window !== 'undefined') {
        clearTimeout((window as Window & { filterTimeout?: NodeJS.Timeout }).filterTimeout)
        ;(window as Window & { filterTimeout?: NodeJS.Timeout }).filterTimeout = setTimeout(() => {
          updateURLWithFilters(updatedFilters)
        }, 500)
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
      score: undefined,
      location: '',
      searchText: '',
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
      params.delete('loc')
      params.delete('score')
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
    set({ filters: filtersToApply, stagedFilters: filtersToApply })
    
    // Always fetch statistics (they don't change with filters)
    get().fetchStatistics()
    
    // Apply filters in priority order
    if (filtersToApply.searchText) {
      get().searchJobs(filtersToApply.searchText)
    } else if (filtersToApply.score !== undefined) {
      get().fetchJobsByScore(filtersToApply.score)
    } else if (filtersToApply.location) {
      get().fetchJobsByLocation(filtersToApply.location)
    } else if (filtersToApply.daysAgo !== undefined) {
      get().fetchJobsByDate(filtersToApply.daysAgo)
    } else {
      get().fetchJobs()
    }
  },
  
  setCurrentPage: (page) => {
    set({ currentPage: page })
    get().applyFilters() // Re-fetch data for new page
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
    
    // Check if we can use cached statistics (cache for 5 minutes - suitable for daily job updates)
    if ((now - lastStatsFetchTime) < 300000) {
      return
    }
    
    try {
      const statistics = await jobService.getJobStatistics()
      
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
    
    // Check if we can use cached data (cache for 2 minutes - suitable for daily job updates)
    if (cacheKey === newCacheKey && (now - lastFetchTime) < 120000) {
      return
    }
    
    set({ isLoading: true, error: null })
    try {
      const response = await jobService.getAllJobs({ 
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
      const response = await jobService.searchJobs(query, { 
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
      const response = await jobService.getJobsByScore(score, { 
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
      const response = await jobService.getJobsByLocation(location, { 
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
      const response = await jobService.getJobsByDate(daysAgo, { 
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
      await jobService.createJob(job)
      get().applyFilters() // Refresh data and statistics
    } catch (error) {
      console.error('Error creating job:', error)
      set({ error: 'Fejl ved oprettelse af job' })
    }
  },
  
  updateJob: async (id, job) => {
    try {
      await jobService.updateJob(id, job)
      get().applyFilters() // Refresh data and statistics
    } catch (error) {
      console.error('Error updating job:', error)
      set({ error: 'Fejl ved opdatering af job' })
    }
  },
  
  deleteJob: async (id) => {
    try {
      await jobService.deleteJob(id)
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
    set({ selectedJob: null, isModalOpen: false })
  },
})) 