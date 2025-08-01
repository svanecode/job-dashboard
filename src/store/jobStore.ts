import { create } from 'zustand'
import { Job, JobFilters } from '@/types/job'
import { jobService } from '@/services/jobService'
import { mockJobs } from '@/data/mockJobs'
import { type SortConfig } from '@/utils/sort'

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
  
  // UI State
  isLoading: boolean
  error: string | null
  selectedJob: Job | null
  isModalOpen: boolean
  
  // Filters
  filters: JobFilters
  
  // Sorting
  sort: SortConfig
  
  // Actions
  setFilters: (filters: Partial<JobFilters>) => void
  resetFilters: () => void
  applyFilters: () => void
  setCurrentPage: (page: number) => void
  setSort: (sort: SortConfig) => void
  
  // Data fetching
  fetchJobs: () => Promise<void>
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
  
  sort: { key: 'score', dir: 'desc' },
  
  // Filter actions
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 1, // Reset to first page when filters change
    }))
  },
  
  resetFilters: () => {
    set((state) => ({
      filters: {
        score: undefined,
        location: '',
        searchText: '',
        daysAgo: undefined,
      },
      currentPage: 1,
    }))
  },
  
  applyFilters: () => {
    const { filters } = get()
    
    // Apply filters in priority order
    if (filters.searchText) {
      get().searchJobs(filters.searchText)
    } else if (filters.score !== undefined) {
      get().fetchJobsByScore(filters.score)
    } else if (filters.location) {
      get().fetchJobsByLocation(filters.location)
    } else if (filters.daysAgo !== undefined) {
      get().fetchJobsByDate(filters.daysAgo)
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
  
  // Data fetching
  fetchJobs: async () => {
    set({ isLoading: true, error: null })
    try {
      const { currentPage, jobsPerPage, sort } = get()
      const response = await jobService.getAllJobs({ 
        page: currentPage, 
        pageSize: jobsPerPage,
        sort 
      })
      
      // Calculate statistics from all jobs (not just current page)
      const allJobsResponse = await jobService.getAllJobs({ 
        page: 1, 
        pageSize: 1000, // Get all jobs for statistics
        sort 
      })
      
      const totalUrgentJobs = allJobsResponse.data.filter(job => job.cfo_score === 3).length
      const totalHighPriorityJobs = allJobsResponse.data.filter(job => job.cfo_score === 2).length
      
      set({
        jobs: response.data,
        paginatedJobs: response.data,
        totalJobs: response.total,
        totalPages: response.totalPages,
        totalUrgentJobs,
        totalHighPriorityJobs,
        isLoading: false,
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
      get().applyFilters() // Refresh data
    } catch (error) {
      console.error('Error creating job:', error)
      set({ error: 'Fejl ved oprettelse af job' })
    }
  },
  
  updateJob: async (id, job) => {
    try {
      await jobService.updateJob(id, job)
      get().applyFilters() // Refresh data
    } catch (error) {
      console.error('Error updating job:', error)
      set({ error: 'Fejl ved opdatering af job' })
    }
  },
  
  deleteJob: async (id) => {
    try {
      await jobService.deleteJob(id)
      get().applyFilters() // Refresh data
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