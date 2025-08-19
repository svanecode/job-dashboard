'use client'

import { useEffect } from 'react'
import { useJobStore } from '@/store/jobStore'

export default function GlobalJobModalHandler() {
  const { openJobModal } = useJobStore()

  useEffect(() => {
    const handleJobModalOpen = (event: any) => {
      const job = event.detail
      
      if (job) {
        // Valider at job-objektet har de nødvendige felter
        if (!job.job_id) {
          console.error('GlobalJobModalHandler: Job missing job_id:', job);
          return;
        }
        
        openJobModal(job)
      } else {
        console.error('GlobalJobModalHandler: No job data in event');
      }
    }
    
    window.addEventListener('openJobModal', handleJobModalOpen)
    return () => window.removeEventListener('openJobModal', handleJobModalOpen)
  }, [openJobModal])

  return null
} 