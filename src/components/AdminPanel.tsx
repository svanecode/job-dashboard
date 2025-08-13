'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Database, Bot, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import InsightsAdmin from './InsightsAdmin'

export default function AdminPanel() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState<'insights' | 'embeddings' | 'chatbot'>('insights')

  const generateEmbeddings = async () => {
    setIsGenerating(true)
    setStatus('idle')
    setMessage('')

    try {
      const response = await fetch('/api/generate-embeddings', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token', // I produktion skal dette være en rigtig token
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to generate embeddings')
      }

      const data = await response.json()
      setStatus('success')
      setMessage('Embeddings genereret succesfuldt!')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Der opstod en fejl')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-kpmg-500 rounded-full flex items-center justify-center">
            <Settings className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
            <p className="text-slate-400 text-sm">Administrer indsigter, embeddings og chatbot</p>
          </div>
        </div>
        <div className="inline-flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <button
            className={`px-3 py-1.5 text-sm ${tab==='insights' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'}`}
            onClick={() => setTab('insights')}
          >Indsigter</button>
          <button
            className={`px-3 py-1.5 text-sm ${tab==='embeddings' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'}`}
            onClick={() => setTab('embeddings')}
          >Embeddings</button>
          <button
            className={`px-3 py-1.5 text-sm ${tab==='chatbot' ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'}`}
            onClick={() => setTab('chatbot')}
          >Chatbot</button>
        </div>
      </div>

      <div className="space-y-6">
        {tab === 'insights' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-slate-300" />
              <h3 className="text-lg font-medium text-white">Ugentlige indsigter</h3>
            </div>
            <InsightsAdmin />
          </div>
        )}

        {tab === 'embeddings' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="size-5 text-slate-300" />
            <h3 className="text-lg font-medium text-white">Embeddings</h3>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-slate-300 text-sm mb-4">
              Embeddings genereres automatisk under scraping-processen. Du kan manuelt generere embeddings for jobs der mangler dem.
            </p>
            
            <button
              onClick={generateEmbeddings}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-kpmg-500 hover:bg-kpmg-700 disabled:bg-gray-600 text-white rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-500"
            >
              {isGenerating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Database className="size-4" />
              )}
              {isGenerating ? 'Genererer...' : 'Generer Embeddings'}
            </button>

            {status !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 mt-3 p-3 rounded-lg ${
                  status === 'success' 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : 'bg-red-500/10 border border-red-500/20'
                }`}
              >
                {status === 'success' ? (
                  <CheckCircle className="size-4 text-green-400" />
                ) : (
                  <AlertCircle className="size-4 text-red-400" />
                )}
                <span className={`text-sm ${
                  status === 'success' ? 'text-green-300' : 'text-red-300'
                }`}>
                  {message}
                </span>
              </motion.div>
            )}
          </div>
        </div>
        )}

        {tab === 'chatbot' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Bot className="size-5 text-slate-300" />
            <h3 className="text-lg font-medium text-white">Chatbot Status</h3>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Status</p>
                <p className="text-green-400 font-medium">Aktiv</p>
              </div>
              <div>
                <p className="text-slate-400">Model</p>
                <p className="text-white">{process.env.OPENAI_MODEL || 'gpt-4.1 (fallback: gpt-5)'}</p>
              </div>
              <div>
                <p className="text-slate-400">Embeddings</p>
                <p className="text-white">text-embedding-3-small</p>
              </div>
              <div>
                <p className="text-slate-400">Sprog</p>
                <p className="text-white">Dansk</p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <h4 className="text-blue-300 font-medium mb-2">Instruktioner</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Embeddings genereres automatisk under scraping</li>
            <li>• Chatbot'en bruger cosine similarity til at finde relevante jobs</li>
            <li>• Svar genereres baseret på top 5 matches</li>
            <li>• CFO score bruges til at vurdere job-relevans</li>
            <li>• Alle aktive jobs har embeddings</li>
          </ul>
        </div>
      </div>
    </motion.div>
  )
} 