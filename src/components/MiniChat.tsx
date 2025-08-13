'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, X, Maximize2, MessageCircle } from 'lucide-react'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Response } from '@/components/ai-elements/response'
import { ChatInput } from '@/components/ai-elements/chat-input'
import { Loader } from '@/components/ai-elements/loader'
import { motion, AnimatePresence } from 'framer-motion'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export default function MiniChat() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.sessionStorage.getItem('assistant_thread_id') : null
      if (saved) setThreadId(saved)
    } catch {}
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!threadId) return
      try {
        setIsLoading(true)
        const res = await fetch(`/api/assistants-chat?threadId=${encodeURIComponent(threadId)}`)
        const data = await res.json()
        if (!res.ok || !data?.success) throw new Error(data?.error || 'Kunne ikke hente samtale')
        const msgs = Array.isArray(data.messages) ? data.messages : []
        setMessages(msgs)
      } catch (e: any) {
        setError(e?.message || 'Noget gik galt ved indlæsning af samtale')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [threadId])

  const handleMessageSubmit = async (value: string) => {
    const text = String(value || '').trim()
    if (!text || isLoading) return
    setError(null)
    const nextConversation: ChatMessage[] = [...messages, { role: 'user' as const, content: text }]
    setMessages(nextConversation)
    setInput('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/assistants-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, threadId }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Uventet fejl')
      if (data.threadId && typeof data.threadId === 'string') {
        setThreadId(data.threadId)
        try { if (typeof window !== 'undefined') window.sessionStorage.setItem('assistant_thread_id', data.threadId) } catch {}
      }
      const reply: ChatMessage = { role: 'assistant', content: String(data.response || '') }
      setMessages((prev) => [...prev, reply])
    } catch (e: any) {
      setError(e?.message || 'Noget gik galt')
    } finally {
      setIsLoading(false)
    }
  }

  const openFull = () => {
    try {
      if (threadId && typeof window !== 'undefined') window.sessionStorage.setItem('assistant_thread_id', threadId)
    } catch {}
    router.push('/chat')
    setIsOpen(false)
  }

  return (
    <>
      {/* Toggle button */}
      <div className="fixed z-[40] right-4 bottom-4 left-4 md:left-auto"
           style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen((v) => !v)}
          className="relative size-12 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-md border border-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          aria-label="Åbn chat"
        >
          {isOpen ? <X className="size-5 mx-auto" /> : <MessageCircle className="size-5 mx-auto" />}
        </motion.button>
      </div>

      {/* Mini chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            className="fixed z-[9998] rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col"
            style={{ right: '1rem', bottom: 'calc(5.5rem + env(safe-area-inset-bottom))', width: 'min(96vw, 28rem)', height: 'min(70vh, 520px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-slate-700/80 rounded-full flex items-center justify-center border border-white/10">
                  <Bot className="size-4 text-slate-200" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">AI-assistent</div>
                  <div className="text-[11px] text-slate-400">Spørg om jobs</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={openFull} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-300" title="Åbn i stor">
                  <Maximize2 className="size-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-300" title="Luk">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Conversation */}
            <div className="h-full overflow-y-auto">
              <Conversation className="h-full">
                <ConversationContent>
                  {messages.length === 0 && (
                    <div className="p-4 text-center text-slate-300">
                      <div className="text-white font-semibold mb-1">Hej! 👋</div>
                      <div className="text-xs text-slate-300">Spørg om CFO-stillinger, virksomheder, eller noget helt andet.</div>
                    </div>
                  )}

                  {messages.map((m, idx) => (
                    <Message key={idx} from={m.role}>
                      <MessageContent>
                        <Response className="prose prose-sm max-w-none whitespace-pre-wrap">
                          {m.content}
                        </Response>
                      </MessageContent>
                    </Message>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2 p-3 text-xs text-slate-300">
                      <Loader />
                      <span>AI tænker…</span>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 text-xs text-red-300">{error}</div>
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            </div>

            {/* Input */}
            <div className="border-t border-white/10 bg-white/[0.03] p-2.5">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleMessageSubmit}
                placeholder="Skriv din besked…"
                disabled={isLoading}
                isLoading={isLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

