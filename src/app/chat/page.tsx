'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Response } from '@/components/ai-elements/response'
import { ChatInput } from '@/components/ai-elements/chat-input'
import { Loader } from '@/components/ai-elements/loader'
import { Sparkles } from 'lucide-react'
import UnifiedJobModal from '@/components/UnifiedJobModal'
import { useJobStore } from '@/store/jobStore'
import { getJobByJobId } from '@/services/jobService'

type ChatMessage = { role: 'user' | 'assistant'; content: string; timestamp: Date }

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const { openJobModal } = useJobStore()

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.sessionStorage.getItem('assistant_thread_id') : null
      if (saved) setThreadId(saved)
    } catch {}
  }, [])

  // Prevent page caching
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Force fresh data on page load
      window.addEventListener('focus', () => {
        // Refresh data when user returns to tab
        console.log('Tab focused, ensuring fresh data');
      });
      
      // Add cache-busting meta tag
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Cache-Control';
      meta.content = 'no-cache, no-store, must-revalidate';
      document.head.appendChild(meta);
    }
  }, []);

  // Load existing conversation if a threadId is present
  useEffect(() => {
    const load = async () => {
      if (!threadId) return
      try {
        setIsLoading(true)
        const res = await fetch(`/api/assistants-chat?threadId=${encodeURIComponent(threadId)}`)
        const data = await res.json()
        if (!res.ok || !data?.success) throw new Error(data?.error || 'Kunne ikke hente samtale')
        const msgs = Array.isArray(data.messages) ? data.messages.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        })) : []
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
    const nextConversation: ChatMessage[] = [...messages, { role: 'user' as const, content: text, timestamp: new Date() }]
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
      const reply: ChatMessage = { role: 'assistant', content: String(data.response || ''), timestamp: new Date() }
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



  const renderAssistantContent = (text: string) => {
    if (!text || typeof text !== 'string') return text;

    // 1. FORBEDRET: Rens teksten for ALLE typer kildehenvisninger.
    // Denne kode fanger alt mellem 【 og 】, uanset indhold.
    let cleanText = text.replace(/【[^】]+】/g, '').trim();

    // 2. Konverter Markdown-formatering til HTML
    // **fed tekst** -> <strong>fed tekst</strong>
    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // *kursiv tekst* -> <em>kursiv tekst</em>
    cleanText = cleanText.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 3. Opdel teksten for at finde og formatere "Se job"-knapper.
    const parts = cleanText.split(/(\(ID:\s*[^)]+\))/gi);

    return parts.map((segment, index) => {
      const match = segment.match(/\(ID:\s*([^)]+)\)/);

      if (!match) {
        // Hvis det ikke er et ID, returneres det blot som tekst med Markdown-formatering.
        return <span key={index} dangerouslySetInnerHTML={{ __html: segment }} />;
      }

      const jobId = match[1].trim();
      if (!jobId) return <span key={index} dangerouslySetInnerHTML={{ __html: segment }} />;

      return (
        <button
          key={`job-${jobId}-${index}`}
          onClick={async () => {
            try {
              console.log('Attempting to fetch job with job_id:', jobId);
              
              // Add cache-busting to prevent stale data
              const timestamp = Date.now();
              const job = await getJobByJobId(jobId);

              if (job) {
                console.log('Job found:', job);
                openJobModal(job as any);
              } else {
                console.warn('Job not found for job_id:', jobId);
                // Try to refresh the page to get latest data
                if (confirm('Jobbet kunne ikke findes. Vil du opdatere siden for at hente de seneste data?')) {
                  window.location.reload();
                } else {
                  alert('Jobbet kunne ikke findes. Det er muligvis blevet fjernet eller opdateret.');
                }
              }
            } catch (e: any) {
              console.error('Open job failed:', e);
              // Try to refresh the page to get latest data
              if (confirm('Der opstod en fejl ved åbning af jobbet. Vil du opdatere siden for at hente de seneste data?')) {
                window.location.reload();
              } else {
                alert('Der opstod en fejl ved åbning af jobbet.');
              }
            }
          }}
          type="button"
          className="inline align-baseline ml-1 p-0 text-[0.95em] font-bold underline decoration-dotted decoration-white/70 underline-offset-2 hover:decoration-white text-white hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
          title={`Se detaljer for job ID: ${jobId}`}
        >
          Se job
        </button>
      );
    });
  };

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
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-slate-200">
              <Sparkles className="size-4 text-emerald-300" />
              <span>AI-assistent • GPT-4.1-mini + Vector</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight text-balance bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">
              Chat
            </h1>
            <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed">
              Stil spørgsmål om CFO-stillinger, virksomheder og filtre. Resultaterne kommer fra jobdatabasen.
            </p>
          </div>
          
          <div className="pt-16 pr-8">
            <button
              onClick={handleNewConversation}
              disabled={resetting || isLoading}
              className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-base px-6 py-3 disabled:opacity-50 shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.4)] transition-all duration-200 hover:scale-105 relative z-20"
            >
              Ny samtale
            </button>
          </div>
        </div>

        {/* Chat panel */}
        <div className="rounded-3xl border border-white/20 bg-gradient-to-b from-white/15 to-white/[0.05] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] overflow-hidden">
          {/* Conversation */}
          <div className="h-[65vh] md:h-[70vh] overflow-y-auto p-1">
            <Conversation className="h-full">
              <ConversationContent>
                {messages.length === 0 && (
                  <div className="p-8 text-center text-slate-300">
                    <div className="text-white font-semibold text-lg mb-3">Hej! 👋</div>
                    <div className="text-sm text-slate-300 mb-6 leading-relaxed">
                      Spørg om CFO-stillinger, virksomheder, eller noget helt andet.
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2 justify-center">
                      {['CFO stillinger i København', 'Controller jobs i Aarhus', 'Interim økonomichef'].map((s) => (
                        <button 
                          key={s} 
                          onClick={() => handleMessageSubmit(s)} 
                          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 hover:border-white/30 transition-all duration-200"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m, idx) => (
                  <Message key={idx} from={m.role}>
                    <MessageContent>
                      <div className="mb-3 text-sm font-medium text-slate-300">
                        {m.role === 'assistant' ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-blue-400 font-semibold">AI</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-400">{m.timestamp.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-emerald-400 font-semibold">Andreas</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-400">{m.timestamp.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        )}
                      </div>
                      <div className="max-w-none whitespace-pre-wrap leading-relaxed bg-zinc-800 text-white border border-zinc-600 shadow-sm rounded-xl px-4 py-3">
                        {m.role === 'assistant' ? (
                          renderAssistantContent(m.content)
                        ) : (
                          <Response
                            className="max-w-none whitespace-pre-wrap text-white [&>h1]:text-white [&>h2]:text-white [&>h3]:text-white [&>h4]:text-white [&>h5]:text-white [&>h6]:text-white [&>p]:text-white [&>strong]:text-white [&>em]:text-white [&>code]:text-white [&>pre]:text-white [&>blockquote]:text-white [&>ul]:text-white [&>ol]:text-white [&>li]:text-white [&>a]:text-white [&>a:hover]:text-slate-200 [&>p]:mb-3 [&>h1]:mb-4 [&>h2]:mb-3 [&>h3]:mb-2 [&>ul]:mb-3 [&>ol]:mb-3 [&>a]:no-underline [&>a]:hover:underline [&>a]:font-bold [&>code]:bg-slate-700 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>pre]:bg-slate-700 [&>pre]:p-3 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>blockquote]:border-l-4 [&>blockquote]:border-slate-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-300"
                            allowedLinkPrefixes={['*']}
                            defaultOrigin={typeof window !== 'undefined' ? window.location.origin : 'http://localhost'}
                          >
                            {m.content}
                          </Response>
                        )}
                      </div>
                    </MessageContent>
                  </Message>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-3 p-6 text-sm text-slate-200">
                    <Loader />
                    <span className="font-medium">AI tænker…</span>
                  </div>
                )}

                {error && (
                  <div className="p-6 text-sm text-red-200 bg-red-500/20 border border-red-500/30 rounded-xl mx-4 my-2">
                    {error}
                  </div>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          </div>

          {/* Input */}
          <div className="border-t border-white/20 bg-white/[0.05] p-4">
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
        <UnifiedJobModal />
      </main>
    </ProtectedRoute>
  )
}