'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, X, Maximize2, MessageCircle, Sparkles, Plus } from 'lucide-react'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Response } from '@/components/ai-elements/response'
import { ChatInput } from '@/components/ai-elements/chat-input'
import { Loader } from '@/components/ai-elements/loader'
import { motion, AnimatePresence } from 'framer-motion'
import { getJobByJobId } from '@/services/jobService'

type ChatMessage = { role: 'user' | 'assistant'; content: string; timestamp: Date }

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
        const msgs = Array.isArray(data.messages) ? data.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        })) : []
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

  const openFull = () => {
    try {
      if (threadId && typeof window !== 'undefined') window.sessionStorage.setItem('assistant_thread_id', threadId)
    } catch {}
    router.push('/chat')
    setIsOpen(false)
  }

  const handleNewConversation = () => {
    try {
      setMessages([])
      setError(null)
      setThreadId(null)
      if (typeof window !== 'undefined') {
        try { window.sessionStorage.removeItem('assistant_thread_id') } catch {}
      }
    } catch (error) {
      console.error('Error starting new conversation:', error)
    }
  }

  const renderAssistantContent = (text: string) => {
    if (!text || typeof text !== 'string') return text;

    // 1. Rens teksten for kildehenvisninger
    let cleanText = text.replace(/【[^】]+】/g, '').trim();

    // 2. Konverter Markdown-formatering til HTML
    cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    cleanText = cleanText.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 3. Opdel teksten for at finde og formatere "Se job"-knapper
    const parts = cleanText.split(/(\(ID:\s*[^)]+\))/gi);

    return parts.map((segment, index) => {
      const match = segment.match(/\(ID:\s*([^)]+)\)/);

      if (!match) {
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
              
              const job = await getJobByJobId(jobId);

              if (job && job.job_id) {
                console.log('Job found:', {
                  job_id: job.job_id,
                  title: job.title,
                  company: job.company,
                  hasDescription: !!job.description
                });
                
                // Valider at job-objektet har de nødvendige felter
                if (!job.title || !job.company) {
                  console.warn('Job missing required fields:', job);
                  alert('Jobbet mangler nogle oplysninger. Prøv at opdatere siden.');
                  return;
                }
                
                console.log('Sending openJobModal event...');
                // Brug global event til at åbne job modal
                const event = new CustomEvent('openJobModal', { detail: job });
                window.dispatchEvent(event);
                console.log('Event sent, job modal should now be open');
                // MiniChat forbliver åben så brugeren kan fortsætte chatten
              } else {
                console.warn('Job not found or invalid for job_id:', jobId);
                if (confirm('Jobbet kunne ikke findes. Vil du opdatere siden for at hente de seneste data?')) {
                  window.location.reload();
                } else {
                  alert('Jobbet kunne ikke findes. Det er muligvis blevet fjernet eller opdateret.');
                }
              }
            } catch (e: any) {
              console.error('Open job failed:', e);
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
            className="fixed z-[9998] rounded-3xl border border-white/20 bg-gradient-to-b from-white/15 to-white/[0.05] backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col"
            style={{ right: '1rem', bottom: 'calc(5.5rem + env(safe-area-inset-bottom))', width: 'min(96vw, 32rem)', height: 'min(75vh, 600px)' }}
          >
            {/* Background effects */}
            <div className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-32 w-[80%] bg-gradient-to-r from-indigo-500/10 via-sky-500/8 to-emerald-500/10 blur-2xl rounded-full" />
              <div className="absolute top-1/3 right-0 h-24 w-24 bg-emerald-500/8 blur-2xl rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-white/20">
                  <Bot className="size-5 text-blue-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-white">AI-assistent</div>
                    <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] text-slate-200">
                      <Sparkles className="size-3 text-emerald-300" />
                      <span>GPT-4.1-mini + Vector</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400">Spørg om CFO-stillinger</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={handleNewConversation} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors" title="Ny samtale">
                  <Plus className="size-4" />
                </button>
                <button onClick={openFull} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors" title="Åbn i stor">
                  <Maximize2 className="size-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors" title="Luk">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Conversation */}
            <div className="h-full overflow-y-auto p-1">
              <Conversation className="h-full">
                <ConversationContent>
                  {messages.length === 0 && (
                    <div className="p-6 text-center text-slate-300">
                      <div className="text-white font-semibold text-base mb-2">Hej! 👋</div>
                      <div className="text-xs text-slate-300 mb-4 leading-relaxed">
                        Spørg om CFO-stillinger, virksomheder, eller noget helt andet.
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 justify-center">
                        {['CFO stillinger i København', 'Controller jobs i Aarhus', 'Interim økonomichef'].map((s) => (
                          <button 
                            key={s} 
                            onClick={() => handleMessageSubmit(s)} 
                            className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/15 hover:border-white/30 transition-all duration-200"
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
                        <div className="mb-2 text-xs font-medium text-slate-400">
                          {m.role === 'assistant' ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="text-blue-400 font-semibold">AI</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-500">{m.timestamp.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <span className="text-emerald-400 font-semibold">Andreas</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-500">{m.timestamp.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          )}
                        </div>
                        <div className="max-w-none whitespace-pre-wrap leading-relaxed bg-zinc-800 text-white border border-zinc-600 shadow-sm rounded-xl px-3 py-2.5">
                          {m.role === 'assistant' ? (
                            renderAssistantContent(m.content)
                          ) : (
                            <Response
                              className="max-w-none whitespace-pre-wrap text-white [&>h1]:text-white [&>h2]:text-white [&>h3]:text-white [&>h4]:text-white [&>h5]:text-white [&>h6]:text-white [&>p]:text-white [&>strong]:text-white [&>em]:text-white [&>code]:text-white [&>pre]:text-white [&>blockquote]:text-white [&>ul]:text-white [&>ol]:text-white [&>li]:text-white [&>a]:text-white [&>a:hover]:text-slate-200 [&>p]:mb-2 [&>h1]:mb-3 [&>h2]:mb-2 [&>h3]:mb-1 [&>ul]:mb-2 [&>ol]:mb-2 [&>a]:no-underline [&>a]:hover:underline [&>a]:font-bold [&>code]:bg-slate-700 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>pre]:bg-slate-700 [&>pre]:p-2 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>blockquote]:border-l-4 [&>blockquote]:border-slate-500 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-slate-300"
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
                    <div className="flex items-center gap-2 p-4 text-sm text-slate-200">
                      <Loader />
                      <span className="font-medium">AI tænker…</span>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 text-sm text-red-200 bg-red-500/20 border border-red-500/30 rounded-xl mx-3 my-2">
                      {error}
                    </div>
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            </div>

            {/* Input */}
            <div className="border-t border-white/20 bg-white/[0.05] p-3">
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

      {/* Job Modal - bruger den eksisterende fra siden */}
    </>
  )
}

