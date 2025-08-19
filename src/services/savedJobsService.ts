import { SavedJob, JobComment, SaveJobData, UpdateSavedJobData } from '@/types/job'

class SavedJobsService {
  async getSavedJobs(includeExpired = false): Promise<SavedJob[]> {
    const url = `/api/saved-jobs${includeExpired ? '?includeExpired=true' : ''}`
    const response = await fetch(url)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Get saved jobs error:', response.status, errorData)
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      
      throw new Error(`Failed to fetch saved jobs: ${errorData.error || response.statusText}`)
    }
    return response.json()
  }

  async isJobSaved(jobId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/saved-jobs?job_id=${jobId}`)
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('User not authenticated when checking saved job status')
          return false
        }
        return false
      }
      const data = await response.json()
      return data.saved || false
    } catch (error) {
      console.error('Error checking if job is saved:', error)
      return false
    }
  }

  async saveJob(data: SaveJobData): Promise<any> {
    const response = await fetch('/api/saved-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Save job error:', response.status, errorData)
      
      if (response.status === 409) {
        throw new Error('Job already saved')
      }
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      throw new Error(`Failed to save job: ${errorData.error || response.statusText}`)
    }
    
    return response.json()
  }

  async updateSavedJob(id: string, data: UpdateSavedJobData): Promise<any> {
    const response = await fetch(`/api/saved-jobs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      throw new Error('Failed to update saved job')
    }
    
    return response.json()
  }

  async deleteSavedJob(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`/api/saved-jobs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        return { success: true, message: 'Job fjernet fra gemte jobs' };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.error || 'Kunne ikke fjerne jobbet' };
      }
    } catch (error) {
      console.error('Error deleting saved job:', error);
      return { success: false, message: 'Der opstod en fejl under fjernelse af jobbet' };
    }
  }

  async getJobComments(jobId: string): Promise<JobComment[]> {
    const response = await fetch(`/api/job-comments?job_id=${jobId}`)
    if (!response.ok) {
      if (response.status === 401) {
        console.warn('User not authenticated when fetching job comments')
        return []
      }
      throw new Error('Failed to fetch comments')
    }
    return response.json()
  }

  async addComment(jobId: string, comment: string): Promise<JobComment> {
    const response = await fetch('/api/job-comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_id: jobId, comment }),
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      throw new Error('Failed to add comment')
    }
    
    return response.json()
  }

  async updateComment(id: string, comment: string): Promise<JobComment> {
    const response = await fetch(`/api/job-comments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment }),
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      throw new Error('Failed to update comment')
    }
    
    return response.json()
  }

  async deleteComment(id: string): Promise<void> {
    const response = await fetch(`/api/job-comments/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      throw new Error('Failed to delete comment')
    }
  }

  async getUserComments(): Promise<JobComment[]> {
    const response = await fetch('/api/job-comments/user')
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.')
      }
      throw new Error('Failed to fetch user comments')
    }
    return response.json()
  }
}

export const savedJobsService = new SavedJobsService() 