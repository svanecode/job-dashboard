'use client'

import { useEffect } from 'react'
import { useJobStore } from '@/store/jobStore'

export default function GlobalJobModalHandler() {
  const { openJobModal } = useJobStore()

  useEffect(() => {
    const handleJobModalOpen = (event: any) => {
      console.log('GlobalJobModalHandler: Received openJobModal event', event);
      const job = event.detail
      
      if (job) {
        // Valider at job-objektet har de nødvendige felter
        if (!job.job_id) {
          console.error('GlobalJobModalHandler: Job missing job_id:', job);
          return;
        }
        
        console.log('GlobalJobModalHandler: Opening job modal for job:', {
          job_id: job.job_id,
          title: job.title,
          company: job.company,
          hasDescription: !!job.description
        });
        
        openJobModal(job)
      } else {
        console.error('GlobalJobModalHandler: No job data in event');
      }
    }
    
    console.log('GlobalJobModalHandler: Setting up event listener');
    window.addEventListener('openJobModal', handleJobModalOpen)
    return () => window.removeEventListener('openJobModal', handleJobModalOpen)
  }, [openJobModal])

  return null
} 