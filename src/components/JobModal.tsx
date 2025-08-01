'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, MapPin, Building2, Calendar, Send, Copy, Check } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import ScoreBar from './ScoreBar'
import { formatDate, copyToClipboard, getScoreLabel } from '@/utils/format'
import { useState } from 'react'

export default function JobModal() {
  const { selectedJob, isModalOpen, closeJobModal } = useJobStore()
  const [copied, setCopied] = useState(false)

  const handleCopyJob = async () => {
    if (!selectedJob) return
    
    const text = `${selectedJob.company || 'Ukendt firma'} - ${selectedJob.title || 'Ingen titel'}`
    const success = await copyToClipboard(text)
    
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
            <div className="card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="font-heading text-2xl font-semibold text-white mb-2">
                    {selectedJob.title || 'Ingen titel'}
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <ScoreBar score={selectedJob.cfo_score} className="w-20" />
                      <span className="text-sm text-slate-400">
                        {selectedJob.cfo_score !== null ? `${selectedJob.cfo_score}/3` : '—'}
                      </span>
                    </div>
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

              {/* Publication Date & Score */}
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="size-5 text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-sm">Publiceret</p>
                    <p className="text-white font-medium">
                      {formatDate(selectedJob.publication_date)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-2">Prioritet</p>
                  <p className="text-white font-medium">
                    {getScoreLabel(selectedJob.cfo_score)}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-slate-300 font-medium mb-3">Beskrivelse</h3>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-slate-200 leading-relaxed">
                    {selectedJob.description || 'Ingen beskrivelse tilgængelig'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
                <button
                  onClick={handleCopyJob}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-slate-300 hover:border-white/20 hover:bg-white/5 transition-colors focus-ring"
                >
                  {copied ? (
                    <Check className="size-4 text-green-400" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copied ? 'Kopieret!' : 'Kopier firma+titel'}
                </button>
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-kpmg-500 text-white font-medium rounded-lg hover:bg-kpmg-600 transition-colors focus-ring"
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