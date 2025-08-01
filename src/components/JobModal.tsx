'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, MapPin, Building2, Calendar, Send } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'

export default function JobModal() {
  const { selectedJob, isModalOpen, closeJobModal } = useJobStore()

  const getScoreBadge = (score: number | null) => {
    if (score === null) {
      return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs bg-slate-400/10 text-slate-300 ring-1 ring-slate-300/20">❓ Ikke scoret</span>
    }
    
    switch (score) {
      case 3:
        return <span className="score-badge-3">🔥 Akut</span>
      case 2:
        return <span className="score-badge-2">⚡ Høj</span>
      case 1:
        return <span className="score-badge-1">📋 Medium</span>
      case 0:
        return <span className="score-badge-0">❌ Lav</span>
      default:
        return <span className="score-badge-1">{score}</span>
    }
  }

  if (!selectedJob) return null

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeJobModal}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            className="fixed inset-4 z-50 flex items-center justify-center"
          >
            <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="font-heading text-2xl font-semibold text-white mb-2">
                    {selectedJob.title || 'Ingen titel'}
                  </h2>
                  <div className="flex items-center gap-3">
                    {getScoreBadge(selectedJob.cfo_score)}
                    <span className="text-slate-400 text-sm">
                      ID: {selectedJob.job_id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeJobModal}
                  className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors focus-ring"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Company & Location */}
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div className="flex items-center gap-3">
                  <Building2 className="size-5 text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Firma</p>
                    <p className="text-white font-medium">
                      {selectedJob.company || 'Ukendt firma'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="size-5 text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Lokation</p>
                    <p className="text-white font-medium">
                      {selectedJob.location || 'Ukendt lokation'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Publication Date */}
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="size-5 text-slate-400" />
                <div>
                  <p className="text-slate-400 text-sm">Publiceret</p>
                  <p className="text-white font-medium">
                    {selectedJob.publication_date 
                      ? new Date(selectedJob.publication_date).toLocaleDateString('da-DK', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Ukendt dato'
                    }
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-slate-300 font-medium mb-3">Beskrivelse</h3>
                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-200 leading-relaxed">
                    {selectedJob.description || 'Ingen beskrivelse tilgængelig'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
                <button
                  onClick={closeJobModal}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-slate-300 hover:border-white/20 hover:bg-white/5 transition-colors focus-ring"
                >
                  <Send className="size-4" />
                  Send til CRM
                </button>
                {selectedJob.job_url && (
                  <a
                    href={selectedJob.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-ink font-medium rounded-lg hover:bg-primary/90 transition-colors focus-ring"
                  >
                    <ExternalLink className="size-4" />
                    Åbn jobopslag
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 