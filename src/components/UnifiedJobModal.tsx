'use client'

import { useState, useEffect } from 'react'
import { useJobStore } from '@/store/jobStore'
import JobModal from './JobModal'
import JobSheet from './JobSheet'

export default function UnifiedJobModal() {
  const { selectedJob, isModalOpen, closeJobModal } = useJobStore()
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 767px)').matches)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Valider at job data er komplet
  useEffect(() => {
    if (selectedJob && isModalOpen && (!selectedJob.job_id || !selectedJob.title || !selectedJob.company)) {
      console.error('UnifiedJobModal: Invalid job data:', selectedJob);
      alert('Jobbet mangler nogle oplysninger. Prøv at opdatere siden.');
      closeJobModal();
      return;
    }
  }, [selectedJob, isModalOpen, closeJobModal]);

  // If no job is selected or modal is not open, render nothing
  if (!selectedJob || !isModalOpen) {
    return null
  }

  // On mobile, use JobSheet (bottom sheet)
  if (isMobile) {
    return (
      <JobSheet
        open={isModalOpen}
        onClose={closeJobModal}
        title={selectedJob.title || 'Ingen titel'}
        company={selectedJob.company || 'Ukendt firma'}
        location={selectedJob.location || 'Ukendt lokation'}
        date={(selectedJob.created_at || selectedJob.publication_date || '') as string}
        score={selectedJob.cfo_score || 0}
        description={selectedJob.description || ''}
        jobUrl={selectedJob.job_url || undefined}
        tags={[]}
        jobId={selectedJob.job_id}
      />
    )
  }

  // On desktop, use JobModal (full-screen modal)
  return <JobModal />
} 