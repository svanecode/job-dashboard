'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, X, MessageCircle, Clipboard } from 'lucide-react'
import type { ChatMessage } from '@/store/chatStore'
import { useJobStore } from '@/store/jobStore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChat, UseChatOptions } from '@ai-sdk/react'
import UnifiedJobModal from '@/components/UnifiedJobModal'

// Tool extraction helper for all v5 tool part shapes
type ToolExtraction = {
  hasToolCall: boolean
  hasToolResult: boolean
  items?: any[]
  summary?: string
}

function extractSemanticTool(parts: any[]): ToolExtraction {
  const out: ToolExtraction = { hasToolCall: false, hasToolResult: false }
  if (!Array.isArray(parts)) return out

  for (const p of parts) {
    // v5 typed tools: tool-semanticSearch
    if (p?.type === 'tool-semanticSearch') {
      if (p.state === 'input-streaming' || p.state === 'input-available') out.hasToolCall = true
      if (p.state === 'output-available') {
        out.hasToolResult = true
        const obj = typeof p.output === 'string' ? safeParseJSON(p.output) : p.output
        if (obj?.items && Array.isArray(obj.items)) out.items = obj.items
        if (typeof obj?.summary === 'string') out.summary = obj.summary
      }
      if (p.state === 'output-error') {
        out.hasToolResult = true
        out.items = []
        out.summary = 'Noget gik galt – prøv igen.'
      }
    }

    // dynamic-tool fallback
    if (p?.type === 'dynamic-tool' && (p?.toolName === 'semanticSearch' || p?.tool === 'semanticSearch')) {
      if (p.state === 'input-streaming' || p.state === 'input-available') out.hasToolCall = true
      if (p.state === 'output-available') {
        out.hasToolResult = true
        const obj = typeof p.output === 'string' ? safeParseJSON(p.output) : p.output
        if (obj?.items && Array.isArray(obj.items)) out.items = obj.items
        if (typeof obj?.summary === 'string') out.summary = obj.summary
      }
      if (p.state === 'output-error') {
        out.hasToolResult = true
        out.items = []
        out.summary = 'Noget galt – prøv igen.'
      }
    }

    // old generic part
    if (p?.type === 'tool-result' && (p?.toolName === 'semanticSearch' || p?.tool === 'semanticSearch')) {
      out.hasToolCall = true
      out.hasToolResult = true
      const raw = (p.result ?? p.output ?? p.data)
      const obj = typeof raw === 'string' ? safeParseJSON(raw) : raw
      if (obj?.items && Array.isArray(obj.items)) out.items = obj.items
      if (typeof obj?.summary === 'string') out.summary = obj.summary
    }
  }
  return out
}

function safeParseJSON(s: string) {
  try { return JSON.parse(s) } catch { return undefined }
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showNotification, setShowNotification] = useState(true)
  const [isListening, setIsListening] = useState(false) // Bevar mic mode
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { openJobModal } = useJobStore()
  const [awaitingTool, setAwaitingTool] = useState(false)
  const failsafeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const chatOptions: UseChatOptions<any> = {
    id: 'job-assistant',
    onError: (err: unknown) => {
      console.error('Chat error:', err)
      // Set a more user-friendly error message
      if (err instanceof Error) {
        if (err.message.includes('JSON')) {
          console.error('JSON parsing error - this usually means the API returned an error message instead of valid JSON')
        }
      }
    },
    onFinish: () => { try { setAwaitingTool(false) } catch {}; if (failsafeTimerRef.current) clearTimeout(failsafeTimerRef.current); },
  }
  const { id, messages: sdkMessages, status, error, sendMessage, setMessages: setSdkMessages, stop, regenerate } = useChat(chatOptions)

  // Helper to send a text message in UIMessage shape to satisfy current runtime
  const sendText = async (t: string) => {
    const text = String(t ?? '').trim()
    if (!text) return
    await sendMessage({ role: 'user', parts: [{ type: 'text', text }] } as any)
  }

  // Heuristic for search intent
  const isSearchIntent = (text: string) => {
    const searchHints = /\b(cfo|controller|økonomi|finance|stilling|stillinger|job|jobs|vis flere|mere|i\s+\w+|interim|score)\b/i
    return searchHints.test(text)
  }

  // Bridge SDK messages to local render format, including tool results
  const tsRef = useRef<Record<string, string>>({})
  const messages: (ChatMessage & { serverSummary?: string; _toolMeta?: { hasToolCall: boolean; hasToolResult: boolean } })[] = sdkMessages.map((m: any) => {
    if (!tsRef.current[m.id]) tsRef.current[m.id] = new Date().toISOString()
    const ts = tsRef.current[m.id]
    
    const text = Array.isArray(m.parts)
      ? m.parts.map((p: any) => (p?.type === 'text' ? p.text : '')).join('')
      : ''

    const { hasToolCall, hasToolResult, items, summary } = extractSemanticTool(m.parts || [])
    
    return {
      id: m.id,
      role: m.role === 'user' ? 'user' : 'assistant',
      content: text,
      timestamp: new Date(ts),
      similarJobs: items,
      serverSummary: summary,
      _toolMeta: { hasToolCall, hasToolResult }, // internal
    } as ChatMessage & { serverSummary?: string; _toolMeta?: { hasToolCall: boolean; hasToolResult: boolean } }
  })

  // Unlock when tool result arrives
  useEffect(() => {
    const lastAssistant = [...sdkMessages].reverse().find(m => m.role === 'assistant')
    const meta = extractSemanticTool(lastAssistant?.parts || [])
    if (meta.hasToolResult) setAwaitingTool(false)
  }, [sdkMessages])

  // Await tool: if the latest assistant message includes a tool call but not yet a tool result, wait before showing assistant text
  const lastAssistantSdk = [...sdkMessages].reverse().find((m: any) => m.role === 'assistant')
  const lastAssistantId = lastAssistantSdk?.id
  const lastHasToolCall = Array.isArray(lastAssistantSdk?.parts)
    && lastAssistantSdk.parts.some((p: any) => p?.type === 'tool-call' || p?.toolName || p?.tool)
  const lastHasToolResult = Array.isArray(lastAssistantSdk?.parts)
    && lastAssistantSdk.parts.some((p: any) => p?.type === 'tool-result' || p?.type === 'data')
  const awaitingToolMessage = Boolean(lastHasToolCall && !lastHasToolResult)

  const quickSuggestions = [
    'Vis flere lignende',
    'Kun i København',
    'Kun interim',
    'Kun score ≥ 2',
  ]

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

  // Keyboard shortcut: Cmd/Ctrl + K to toggle chat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey
      if (isCmd && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text || status === 'streaming' || status === 'submitted' || awaitingTool) return
    setInputValue('')
    if (isSearchIntent(text)) {
      setAwaitingTool(true)
      if (failsafeTimerRef.current) clearTimeout(failsafeTimerRef.current)
      failsafeTimerRef.current = setTimeout(() => setAwaitingTool(false), 15000)
    }
    await sendText(text)
  }

  // ENTER håndteres af <form onSubmit>; ingen onKeyPress for at undgå dobbelt-submit

  // Bevar voice input funktionalitet
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'da-DK'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.onstart = () => setIsListening(true)
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
      setInputValue(transcript)
    }
    recognition.start()
  }

  const handleJobClick = (job: any) => {
    openJobModal(job)
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed z-[40] right-4 bottom-4 md:bottom-4 md:right-4 left-4 md:left-auto"
           style={{
             bottom: 'calc(1rem + env(safe-area-inset-bottom))'
           }}
      >
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
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Container - Fix z-index */}
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
              className="fixed z-[9998] card shadow-[0_8px_30px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col"
              style={{
                right: '1rem',
                bottom: 'calc(6.5rem + env(safe-area-inset-bottom))',
                width: 'min(96vw, 28rem)',
                height: 'min(70vh, 560px)'
              }}
            >
              {/* Header - Bevar mic button */}
              <div className="flex items-center justify-between p-4 soft-divider bg-white/5 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="size-8 bg-slate-700/80 rounded-full flex items-center justify-center border border-white/10">
                    <Bot className="size-4 text-slate-200" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">Job Assistant</h3>
                    <p className="text-xs text-slate-400">Spørg mig om jobs • Cmd/Ctrl+K</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleToggleVoice}
                    title="Tale til tekst"
                    className={`p-1 rounded-lg transition-colors focus-ring ${isListening ? 'bg-emerald-500/20' : 'hover:bg-white/5'}`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle bg-emerald-400" style={{ opacity: isListening ? 1 : 0.3 }} />
                    <span className="text-[10px] text-slate-300">Mic</span>
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/5 transition-colors focus-ring"
                  >
                    <X className="size-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    <Bot className="size-12 mx-auto mb-3 text-slate-500" />
                    <p className="text-sm">Hej! Jeg kan hjælpe dig med at finde relevante job-annoncer.</p>
                    <p className="text-xs mt-2">Prøv at spørge om "CFO stillinger" eller "interim jobs"</p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {['CFO stillinger i København', 'Interim økonomichef', 'Høj score (2-3) jobs', 'Fintech økonomi jobs'].map((q) => (
                        <button
                          key={q}
                          onClick={async () => {
                            if (isSearchIntent(q)) {
                              setAwaitingTool(true)
                              if (failsafeTimerRef.current) clearTimeout(failsafeTimerRef.current)
                              failsafeTimerRef.current = setTimeout(() => setAwaitingTool(false), 15000)
                            }
                            await sendText(q)
                          }}
                          className="px-2 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, idx) => {
                      // find previous user text to build contextual headers
                      let prevUserText = ''
                      for (let j = idx - 1; j >= 0; j--) {
                        if ((messages[j] as any).role === 'user') { prevUserText = (messages[j] as any).content || ''; break }
                      }
                      return (
                        <ChatMessage key={message.id} message={message} onJobClick={handleJobClick} prevUserText={prevUserText} />
                      )
                    })}
                  </>
                )}
              
                {/* Forbedret loading state */}
                {(status === 'submitted' || status === 'streaming' || awaitingTool) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                    <div className="size-8 bg-slate-700/80 rounded-full flex items-center justify-center flex-shrink-0 border border-white/10">
                      <Bot className="size-4 text-slate-200" />
                    </div>
                    <div className="flex flex-col gap-2 p-3 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex gap-1">
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
                      <p className="text-xs text-slate-400">Søger efter relevante jobs...</p>
                    </div>
                  </motion.div>
                )}

                {/* Forbedret error state med retry button */}
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
                      <p className="text-sm text-red-300 mb-2">{String(error)}</p>
                      <button 
                        onClick={async () => {
                           const lastUser = [...sdkMessages].reverse().find((m: any) => m.role === 'user')
                           if (lastUser) {
                             const text = Array.isArray(lastUser.parts)
                               ? lastUser.parts.map((p: any) => (p?.type === 'text' ? p.text : '')).join('')
                               : ''
                             if (text) await sendText(text)
                           }
                        }}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                      >
                        Prøv igen
                      </button>
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
                    placeholder="Skriv dit spørgsmål..."
                    disabled={status === 'streaming' || status === 'submitted' || awaitingTool}
                    className="flex-1 glass-input text-sm disabled:opacity-50"
                  />
                  <button
                    type="submit"
                     disabled={!inputValue.trim() || status === 'streaming' || status === 'submitted' || awaitingTool}
                    className="px-4 py-2 bg-slate-700/80 hover:bg-slate-600/80 disabled:bg-slate-800/50 disabled:text-slate-500 text-slate-200 rounded-lg transition-colors focus-ring border border-white/10"
                  >
                    <Send className="size-4" />
                  </button>
                </form>

                {/* Quick follow-ups */}
                {messages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickSuggestions.map((q) => (
                      <button
                        key={q}
                        onClick={async () => {
                          if (isSearchIntent(q)) {
                            setAwaitingTool(true)
                            if (failsafeTimerRef.current) clearTimeout(failsafeTimerRef.current)
                            failsafeTimerRef.current = setTimeout(() => setAwaitingTool(false), 15000)
                          }
                          await sendText(q)
                        }}
                        className="px-2 py-1 text-[11px] rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              
                {messages.length > 0 && (
                  <>
                    <button
                      onClick={() => setSdkMessages([])}
                      className="mt-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      Ryd chat
                    </button>
                    {status === 'streaming' && (
                      <button
                        onClick={() => stop?.()}
                        className="ml-2 mt-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        Stop
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Job Modal - Add this to show job details when clicking job cards */}
      <UnifiedJobModal />
    </>
  )
}

function ChatMessage({ message, onJobClick, prevUserText }: { message: ChatMessage & { serverSummary?: string; _toolMeta?: any }; onJobClick: (job: any) => void; prevUserText?: string }) {
  const isUser = message.role === 'user'
  const awaitingThis = !!(!isUser && message._toolMeta?.hasToolCall && !message._toolMeta?.hasToolResult)
  const hasAssistantText = !!(message.content && message.content.trim().length)
  const fallbackText = !hasAssistantText ? (message.serverSummary || '') : ''
  const [displayed, setDisplayed] = useState(isUser ? message.content : '')

  useEffect(() => {
    if (isUser) return
    
    let cancelled = false
    const full = hasAssistantText ? message.content : fallbackText
    if (!full) return
    
    // If we already have the full content, show it immediately
    if (displayed === full) return
    
    setDisplayed('')
    let i = 0
    
    const step = () => {
      if (cancelled) return
      
      // Use smaller, more natural chunks for smoother appearance
      const chunkSize = Math.max(1, Math.ceil(full.length / 200))
      i += chunkSize
      
      if (i >= full.length) {
        setDisplayed(full)
        return
      }
      
      setDisplayed(full.slice(0, i))
      setTimeout(step, 25) // Slower timing for more natural typing feel
    }
    
    step()
    
    return () => {
      cancelled = true
    }
  }, [message.content, fallbackText, isUser, hasAssistantText, displayed])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hasAssistantText ? message.content : fallbackText)
    } catch {}
  }

  // Determine what text to actually display
  const textToDisplay = isUser ? message.content : displayed || fallbackText

  // Build a concise Danish header from previous user text
  const buildHeaderFromQuery = (_q: string | undefined) => 'Her er nogle relevante jobmuligheder:'

  // Refinement logic to align with /chat behavior
  const parseQueryConstraints = (q?: string) => {
    const roles: string[] = []
    const locations: string[] = []
    const strictLocations: string[] = []
    const includeCompanies: string[] = []
    const excludeCompanies: string[] = []
    if (!q) return { roles, locations, strictLocations, includeCompanies, excludeCompanies }
    const lower = q.toLowerCase()
    for (const token of ['controller', 'controlling', 'cfo', 'økonomichef', 'regnskab', 'økonomi', 'finance', 'financial']) {
      if (lower.includes(token)) roles.push(token)
    }
    const locationSynonyms: Record<string, string[]> = {
      'fyn': ['fyn', 'odense'],
      'københavn': ['københavn', 'copenhagen', 'kbh'],
      'aarhus': ['aarhus', 'århus'],
      'odense': ['odense'],
      'aalborg': ['aalborg'],
      'sjælland': ['sjælland'],
      'jylland': ['jylland']
    }
    const cityClusters: Record<string, string[]> = { 'herning': ['herning', 'ikast', 'brande'], 'lystrup': ['lystrup', 'aarhus', 'århus'] }
    const allowSurrounding = /(omegn|området|nærhed|omkring)/.test(lower)
    for (const key of Object.keys(locationSynonyms)) {
      if (lower.includes(key)) locations.push(...locationSynonyms[key])
    }
    const explicitCities: string[] = []
    for (const syns of Object.values(locationSynonyms)) {
      for (const token of syns) {
        if (lower.includes(token)) explicitCities.push(token)
      }
    }
    if (explicitCities.length > 0) {
      const uniqueCities = Array.from(new Set(explicitCities))
      if (allowSurrounding) {
        for (const c of uniqueCities) {
          if (cityClusters[c]) locations.push(...cityClusters[c])
          else locations.push(c)
        }
      } else {
        strictLocations.push(...uniqueCities)
      }
    }
    const dedup = Array.from(new Set(locations))
    locations.splice(0, locations.length, ...dedup)
    const hosMatch = lower.match(/hos\s+([a-zæøåéèüöä\s\-\.&]+)/i)
    if (hosMatch) includeCompanies.push(hosMatch[1].trim())
    return { roles, locations, strictLocations, includeCompanies, excludeCompanies }
  }

  const refineToolResults = (q: string | undefined, items: any[]) => {
    if (!Array.isArray(items) || items.length === 0) return { refined: items, filteredOut: 0 }
    const { roles, locations, strictLocations, includeCompanies, excludeCompanies } = parseQueryConstraints(q)
    let refined = items.slice()
    if (excludeCompanies.length > 0) {
      refined = refined.filter((it) => {
        const hay = `${String(it.company || '').toLowerCase()} ${String(it.title || '').toLowerCase()} ${String(it.description || '').toLowerCase()}`
        return !excludeCompanies.some((e) => hay.includes(e))
      })
    }
    if (includeCompanies.length > 0) {
      refined = refined.filter((it) => {
        const hay = `${String(it.company || '').toLowerCase()} ${String(it.title || '').toLowerCase()} ${String(it.description || '').toLowerCase()}`
        return includeCompanies.some((inc) => hay.includes(inc))
      })
    }
    if (roles.length > 0) {
      refined = refined.filter((it) => {
        const hay = `${String(it.title || '').toLowerCase()} ${String(it.description || '').toLowerCase()}`
        return roles.some((r) => hay.includes(r))
      })
    }
    if (strictLocations.length > 0) {
      refined = refined.filter((it) => {
        const hay = `${String(it.location || '').toLowerCase()} ${String(it.title || '').toLowerCase()} ${String(it.company || '').toLowerCase()} ${String(it.description || '').toLowerCase()}`
        return strictLocations.some((token) => hay.includes(token))
      })
    } else if (locations.length > 0) {
      refined = refined.filter((it) => {
        const hay = `${String(it.location || '').toLowerCase()} ${String(it.title || '').toLowerCase()} ${String(it.company || '').toLowerCase()}`
        return locations.some((token) => hay.includes(token))
      })
    }
    refined = refined.filter((it) => typeof it.cfo_score !== 'number' || it.cfo_score >= 1)
    const filteredOut = items.length - refined.length
    if (refined.length === 0) return { refined: items, filteredOut: 0 }
    return { refined: refined.slice(0, 20), filteredOut }
  }

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
        <div className={`relative p-3 rounded-2xl border border-white/10 ${
          isUser 
            ? 'bg-slate-700/80 text-slate-200' 
            : 'bg-white/5 text-slate-200'
        }`}>
          {!isUser && awaitingThis && (
            <div className="text-xs text-slate-400">Søger…</div>
          )}
          {!isUser && !awaitingThis && (
            <div className="space-y-3">
              {textToDisplay && (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {textToDisplay}
                  </ReactMarkdown>
                </div>
              )}
              {Array.isArray(message.similarJobs) && message.similarJobs.length > 0 && (() => {
                const { refined } = refineToolResults(prevUserText, message.similarJobs)
                return (
                  <div className="text-sm text-slate-200 space-y-2">
                    <p className="font-medium text-slate-100">{`Jeg fandt ${refined.length} relevante opslag.`}</p>
                    <p className="text-xs text-slate-400">{buildHeaderFromQuery(prevUserText)}</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {refined.map((job: any, i: number) => (
                        <li key={i} className="marker:text-slate-500">
                          <span className="font-medium">{job.company || job.source || 'Ukendt'}</span>
                          {': '}
                          <span>
                            {job.title}
                            {job.location ? ` i ${job.location}` : ''}
                            {job.cfo_score ? ` (score ${job.cfo_score}/3)` : ''}
                          </span>
                          {' '}
                          <button
                            type="button"
                            onClick={() => onJobClick(job)}
                            className="text-blue-300 hover:text-blue-200 underline underline-offset-2"
                          >
                            Læs mere
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })()}
            </div>
          )}
          {isUser && (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
          {!isUser && !awaitingThis && textToDisplay && (
            <button
              onClick={handleCopy}
              className="absolute top-1.5 right-1.5 p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5"
              title="Kopiér svar"
            >
              <Clipboard className="size-3.5" />
            </button>
          )}
        </div>
        
        {/* Removed external job list/cards: results are now integrated into the assistant's bubble above */}
        
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