'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, X, MessageCircle } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import type { ChatMessage } from '@/store/chatStore'
import { useJobStore } from '@/store/jobStore'

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showNotification, setShowNotification] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { openJobModal } = useJobStore()
  
  const { messages, isLoading, error, sendMessage, clearMessages } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setShowNotification(false) // Hide notification when chat opens
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const message = inputValue.trim()
    setInputValue('')
    await sendMessage(message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleJobClick = (job: any) => {
    openJobModal(job)
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative size-14 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-md border border-white/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          aria-label="Åbn chat"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="size-6 mx-auto" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="size-6 mx-auto" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notification Bubble */}
          <AnimatePresence>
            {showNotification && !isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
                className="absolute -top-1 -right-1 size-6 bg-emerald-400 text-slate-900 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-slate-800/80"
              >
                1
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse Animation */}
          <AnimatePresence>
            {showNotification && !isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: [0, 1, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-emerald-400/20"
              />
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ 
                type: 'spring', 
                damping: 25, 
                stiffness: 300,
                mass: 0.8
              }}
              className="fixed bottom-20 right-4 z-50 w-96 h-[500px] card shadow-[0_8px_30px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 soft-divider bg-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-slate-700/80 rounded-full flex items-center justify-center border border-white/10">
                    <Bot className="size-4 text-slate-200" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">Job Assistant</h3>
                    <p className="text-xs text-slate-400">Spørg mig om jobs</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 transition-colors focus-ring"
                >
                  <X className="size-4 text-slate-400" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    <Bot className="size-12 mx-auto mb-3 text-slate-500" />
                    <p className="text-sm">Hej! Jeg kan hjælpe dig med at finde relevante job-annoncer.</p>
                    <p className="text-xs mt-2">Prøv at spørge om "CFO stillinger" eller "interim jobs"</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage key={message.id} message={message} onJobClick={handleJobClick} />
                  ))
                )}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="size-8 bg-slate-700/80 rounded-full flex items-center justify-center flex-shrink-0 border border-white/10">
                      <Bot className="size-4 text-slate-200" />
                    </div>
                    <div className="flex gap-1 p-3 bg-white/5 rounded-2xl border border-white/10">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="size-2 bg-slate-400 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        className="size-2 bg-slate-400 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        className="size-2 bg-slate-400 rounded-full"
                      />
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="size-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 border border-red-400/20">
                      <Bot className="size-4 text-red-300" />
                    </div>
                    <div className="p-3 bg-red-400/5 border border-red-400/20 rounded-2xl">
                      <p className="text-sm text-red-300">Beklager, der opstod en fejl. Prøv igen.</p>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 soft-divider bg-white/5 flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Skriv dit spørgsmål..."
                    disabled={isLoading}
                    className="flex-1 glass-input text-sm disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="px-4 py-2 bg-slate-700/80 hover:bg-slate-600/80 disabled:bg-slate-800/50 disabled:text-slate-500 text-slate-200 rounded-lg transition-colors focus-ring border border-white/10"
                  >
                    <Send className="size-4" />
                  </button>
                </form>
                
                {messages.length > 0 && (
                  <button
                    onClick={clearMessages}
                    className="mt-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Ryd chat
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      
    </>
  )
}

function ChatMessage({ message, onJobClick }: { message: ChatMessage; onJobClick: (job: any) => void }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 border border-white/10 ${
        isUser ? 'bg-slate-700/80' : 'bg-slate-700/80'
      }`}>
        {isUser ? (
          <User className="size-4 text-slate-200" />
        ) : (
          <Bot className="size-4 text-slate-200" />
        )}
      </div>
      
      <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`p-3 rounded-2xl border border-white/10 ${
          isUser 
            ? 'bg-slate-700/80 text-slate-200' 
            : 'bg-white/5 text-slate-200'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {message.similarJobs && message.similarJobs.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-slate-400">Relevante jobs:</p>
            {message.similarJobs.slice(0, 3).map((job: any, index: number) => (
              <motion.button
                key={index}
                onClick={() => onJobClick(job)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full p-3 card-mobile text-left hover:border-white/20 transition-all cursor-pointer"
              >
                <p className="font-medium text-slate-200 text-sm mb-1">{job.title}</p>
                <p className="text-slate-400 text-xs mb-1">{job.company} • {job.location}</p>
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-xs">Score: {job.cfo_score}/3</p>
                  <p className="text-slate-300 text-xs font-medium">Klik for detaljer →</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
        
        <p className="text-xs text-slate-500 mt-1">
          {message.timestamp.toLocaleTimeString('da-DK', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </motion.div>
  )
} 