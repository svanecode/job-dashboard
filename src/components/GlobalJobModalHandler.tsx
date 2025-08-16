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
        console.log('GlobalJobModalHandler: Opening job modal for job:', job);
        openJobModal(job)
      }
    }
    
    console.log('GlobalJobModalHandler: Setting up event listener');
    window.addEventListener('openJobModal', handleJobModalOpen)
    return () => window.removeEventListener('openJobModal', handleJobModalOpen)
  }, [openJobModal])

  return null
} 