'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Response } from '@/components/ai-elements/response'
import { ChatInput } from '@/components/ai-elements/chat-input'
import { Loader } from '@/components/ai-elements/loader'
import { Sparkles } from 'lucide-react'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.sessionStorage.getItem('assistant_thread_id') : null
      if (saved) setThreadId(saved)
    } catch {}
  }, [])

  // Load existing conversation if a threadId is present
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
        // Hvis tråden ikke findes længere, ryd lokalt id
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

  const handleNewConversation = () => {
    try {
      setResetting(true)
      setMessages([])
      setError(null)
      setThreadId(null)
      if (typeof window !== 'undefined') {
        try { window.sessionStorage.removeItem('assistant_thread_id') } catch {}
      }
    } finally {
      setResetting(false)
    }
  }

  return (
    <ProtectedRoute>
      <main className="container-mobile md:container mx-auto py-6 md:py-10 space-y-6 md:space-y-8 relative">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[90%] md:w-[70%] bg-gradient-to-r from-indigo-500/15 via-sky-500/10 to-emerald-500/15 blur-3xl rounded-full" />
        <div className="absolute top-1/3 right-0 h-48 w-48 bg-emerald-500/10 blur-3xl rounded-full" />
      </div>

      {/* Hero header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
            <Sparkles className="size-3.5 text-emerald-300" />
            <span>AI-assistent • GPT-4.1-mini + Vector</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight text-balance bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
            Chat
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl">
            Stil spørgsmål om CFO-stillinger, virksomheder og filtre. Resultaterne kommer fra jobdatabasen.
          </p>
        </div>
        <div className="pt-1">
          <button
            onClick={handleNewConversation}
            disabled={resetting || isLoading}
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-100 text-sm px-3 py-1.5 disabled:opacity-50 shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
          >
            Ny samtale
          </button>
        </div>
      </div>

      {/* Chat panel */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] overflow-hidden">
        {/* Conversation */}
        <div className="h-[62vh] md:h-[66vh] overflow-y-auto">
          <Conversation className="h-full">
            <ConversationContent>
              {messages.length === 0 && (
                <div className="p-6 text-center text-slate-300">
                  <div className="text-white font-semibold mb-2">Hej! 👋</div>
                  <div className="text-sm text-slate-300">Spørg om CFO-stillinger, virksomheder, eller noget helt andet.</div>
                  <div className="flex flex-wrap gap-2 pt-3 justify-center">
                    {['CFO stillinger i København', 'Controller jobs i Aarhus', 'Interim økonomichef'].map((s) => (
                      <button key={s} onClick={() => handleMessageSubmit(s)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10">
                        {s}
                      </button>
                    ))}
                  </div>
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
                <div className="flex items-center gap-2 p-4 text-sm text-slate-300">
                  <Loader />
                  <span>AI tænker…</span>
                </div>
              )}

              {error && (
                <div className="p-4 text-sm text-red-300">{error}</div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        {/* Input */}
        <div className="border-t border-white/10 bg-white/[0.03] p-3">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleMessageSubmit}
            placeholder="Skriv din besked…"
            disabled={isLoading}
            isLoading={isLoading}
          />
        </div>
      </div>
      </main>
    </ProtectedRoute>
  )
}