'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import CardRow from './CardRow'
import { Job } from '@/types/job'

interface VirtualJobListProps {
  jobs: Job[]
  onOpen: (job: Job) => void
}

// Simple virtual list implementation for mobile
export default function VirtualJobList({ jobs, onOpen }: VirtualJobListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })
  const [containerHeight, setContainerHeight] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  
  const ITEM_HEIGHT = 120 // Approximate height of CardRow
  const BUFFER_SIZE = 10 // Number of items to render outside viewport

  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateContainerHeight()
    window.addEventListener('resize', updateContainerHeight)
    
    return () => window.removeEventListener('resize', updateContainerHeight)
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    setScrollTop(scrollTop)
    
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE)
    const end = Math.min(
      jobs.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
    )
    
    setVisibleRange({ start, end })
  }, [jobs.length, containerHeight])

  const totalHeight = useMemo(() => jobs.length * ITEM_HEIGHT, [jobs.length])
  const visibleJobs = useMemo(() => jobs.slice(visibleRange.start, visibleRange.end), [jobs, visibleRange.start, visibleRange.end])
  const offsetY = useMemo(() => visibleRange.start * ITEM_HEIGHT, [visibleRange.start])

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto scrollbar-hide"
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              style={{ height: ITEM_HEIGHT, marginBottom: 12 }}
            >
              <CardRow
                title={job.title || 'Ingen titel'}
                company={job.company || 'Ukendt firma'}
                location={job.location || 'Ukendt lokation'}
                date={job.publication_date || ''}
                score={job.cfo_score || 0}
                excerpt={job.description || ''}
                onOpen={() => onOpen(job)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
} 