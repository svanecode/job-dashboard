'use client'

import { useState } from 'react'
import { getJobByJobId } from '@/services/jobService'
import { openJobModalGlobal } from '@/store/jobStore'

interface SeJobButtonProps {
  jobId: string
  className?: string
  children?: React.ReactNode
}

export default function SeJobButton({ jobId, className = '', children = 'Se job' }: SeJobButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (!jobId || isLoading) return
    
    try {
      setIsLoading(true)
      console.log('SeJobButton: Fetching job for ID:', jobId)
      
      const job = await getJobByJobId(jobId)
      
      if (job && job.job_id) {
        // Valider at job-objektet har de nødvendige felter
        if (!job.title || !job.company) {
          console.warn('SeJobButton: Job missing required fields:', job)
          alert('Jobbet mangler nogle oplysninger. Prøv at opdatere siden.')
          return
        }
        
        console.log('SeJobButton: Opening job modal for:', {
          job_id: job.job_id,
          title: job.title,
          company: job.company
        })
        
        // Åbn job modal direkte via global funktion
        openJobModalGlobal(job)
      } else {
        console.warn('SeJobButton: Job not found for job_id:', jobId)
        alert('Jobbet kunne ikke findes. Det er muligvis blevet fjernet eller opdateret.')
      }
    } catch (error) {
      console.error('SeJobButton: Error opening job:', error)
      alert('Der opstod en fejl ved åbning af jobbet. Prøv at opdatere siden.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`inline align-baseline ml-1 p-0 text-[0.95em] font-bold underline decoration-dotted decoration-white/70 underline-offset-2 hover:decoration-white text-white hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm disabled:opacity-50 ${className}`}
      title={`Se detaljer for job ID: ${jobId}`}
    >
      {isLoading ? 'Indlæser...' : children}
    </button>
  )
}
