'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, Send, Loader2 } from 'lucide-react'

export default function TestChatPage() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [similarJobs, setSimilarJobs] = useState<any[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    setIsLoading(true)
    setResponse('')
    setSimilarJobs([])

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      })

      if (!res.ok) {
        throw new Error('Failed to get response')
      }

      const data = await res.json()
      setResponse(data.response)
      setSimilarJobs(data.similarJobs || [])
    } catch (error) {
      setResponse('Beklager, der opstod en fejl. Prøv igen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="bg-radial relative min-h-screen text-slate-200 overflow-x-hidden w-full max-w-full">
      {/* Noise overlay */}
      <div className="noise" />
      
      {/* Main content */}
      <div className="relative z-10 overflow-x-hidden w-full max-w-full">
        {/* Header */}
        <div className="container-mobile md:container mx-auto py-6 md:py-10 overflow-hidden w-full max-w-full">
          <div className="mb-8">
            <h1 className="font-heading text-3xl sm:text-4xl tracking-tight text-white mb-2">
              Chatbot Test
            </h1>
            <p className="text-slate-400 text-lg">
              Test chatbot-funktionaliteten
            </p>
          </div>
        </div>

        {/* Test Interface */}
        <div className="container-mobile md:container mx-auto overflow-hidden w-full max-w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 bg-kpmg-500 rounded-full flex items-center justify-center">
                <Bot className="size-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Test Chatbot</h2>
                <p className="text-slate-400 text-sm">Prøv at stille spørgsmål om jobs</p>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Skriv dit spørgsmål..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-kpmg-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="px-4 py-2 bg-kpmg-500 hover:bg-kpmg-700 disabled:bg-gray-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-kpmg-500"
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
            </form>

            {/* Response */}
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h3 className="text-lg font-medium text-white mb-3">Svar:</h3>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-slate-200 whitespace-pre-wrap">{response}</p>
                </div>
              </motion.div>
            )}

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-lg font-medium text-white mb-3">Relevante Jobs:</h3>
                <div className="space-y-3">
                  {similarJobs.map((job, index) => (
                    <div
                      key={index}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <h4 className="font-medium text-white mb-1">{job.title}</h4>
                      <p className="text-slate-300 text-sm mb-2">{job.company} • {job.location}</p>
                      <p className="text-slate-400 text-sm mb-2">{job.description.substring(0, 150)}...</p>
                                             <div className="flex items-center justify-between">
                         <span className="text-xs text-slate-500">CFO Score: {job.cfo_score}/3</span>
                         <span className="text-xs text-slate-500">
                           Similarity: {(job.similarity * 100).toFixed(1)}%
                         </span>
                       </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Example Questions */}
            <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-300 font-medium mb-3">Eksempel spørgsmål:</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setMessage('Find CFO stillinger')}
                  className="block text-left text-blue-200 hover:text-blue-100 text-sm"
                >
                  • Find CFO stillinger
                </button>
                <button
                  onClick={() => setMessage('Interim jobs i København')}
                  className="block text-left text-blue-200 hover:text-blue-100 text-sm"
                >
                  • Interim jobs i København
                </button>
                <button
                  onClick={() => setMessage('Jobs med høj score')}
                  className="block text-left text-blue-200 hover:text-blue-100 text-sm"
                >
                  • Jobs med høj score
                </button>
                <button
                  onClick={() => setMessage('Fintech stillinger')}
                  className="block text-left text-blue-200 hover:text-blue-100 text-sm"
                >
                  • Fintech stillinger
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
} 