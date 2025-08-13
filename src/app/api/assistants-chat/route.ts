import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const ASSISTANT_ID = 'asst_cDCkNnB30B8yczjesdzfyWoJ'

async function createThread(): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({})
  })
  if (!res.ok) throw new Error(`createThread failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.id as string
}

async function addMessage(threadId: string, content: string) {
  const res = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({ role: 'user', content })
  })
  if (!res.ok) throw new Error(`addMessage failed: ${res.status} ${await res.text()}`)
}

async function startRun(threadId: string): Promise<string> {
  const res = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({ assistant_id: ASSISTANT_ID })
  })
  if (!res.ok) throw new Error(`startRun failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.id as string
}

async function getRun(threadId: string, runId: string) {
  const res = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  })
  if (!res.ok) throw new Error(`getRun failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function listMessages(threadId: string) {
  const res = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?order=desc&limit=10`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
    },
  })
  if (!res.ok) throw new Error(`listMessages failed: ${res.status} ${await res.text()}`)
  return res.json()
}

function extractLatestAssistantText(messagesPayload: any): string {
  try {
    const items = messagesPayload?.data || []
    for (const msg of items) {
      if (msg?.role === 'assistant') {
        const content = msg?.content || []
        for (const c of content) {
          const txt = c?.text?.value || c?.text || c?.content || ''
          if (typeof txt === 'string' && txt.trim()) return txt.trim()
        }
      }
    }
  } catch {}
  return ''
}

function normalizeMessages(messagesPayload: any): Array<{ role: 'user' | 'assistant'; content: string }> {
  try {
    const items = Array.isArray(messagesPayload?.data) ? messagesPayload.data : []
    // API returns in descending order when we call with order=desc; sort ascending by created_at if present
    const sorted = [...items].sort((a, b) => {
      const atA = typeof a?.created_at === 'number' ? a.created_at : 0
      const atB = typeof b?.created_at === 'number' ? b.created_at : 0
      return atA - atB
    })
    const out: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const msg of sorted) {
      const role = msg?.role === 'user' ? 'user' : 'assistant'
      let content = ''
      const parts = Array.isArray(msg?.content) ? msg.content : []
      for (const c of parts) {
        const txt = c?.text?.value || c?.text || c?.content || ''
        if (typeof txt === 'string' && txt.trim()) {
          content = txt.trim()
          break
        }
      }
      if (typeof content === 'string') out.push({ role, content })
    }
    return out
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, threadId: providedThreadId } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let threadId = providedThreadId as string | undefined
    if (!threadId) {
      threadId = await createThread()
    }

    await addMessage(threadId, message)
    const runId = await startRun(threadId)

    // Poll until completed (max ~45s)
    const start = Date.now()
    let status = 'queued'
    while (true) {
      const run = await getRun(threadId, runId)
      status = run?.status
      if (status === 'completed') break
      if (status === 'failed' || status === 'cancelled' || status === 'expired') {
        return NextResponse.json({ error: `Run ${status}` }, { status: 500 })
      }
      if (status === 'requires_action') {
        return NextResponse.json({ error: 'Run requires tool outputs which are not handled server-side.' }, { status: 501 })
      }
      if (Date.now() - start > 45000) {
        return NextResponse.json({ error: 'Run timeout' }, { status: 504 })
      }
      await new Promise((r) => setTimeout(r, 800))
    }

    const msgs = await listMessages(threadId)
    const text = extractLatestAssistantText(msgs)

    return NextResponse.json({ success: true, threadId, response: text })
  } catch (error) {
    console.error('assistants-chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId') || ''
    if (!threadId) {
      return NextResponse.json({ error: 'threadId is required' }, { status: 400 })
    }
    const msgs = await listMessages(threadId)
    const normalized = normalizeMessages(msgs)
    return NextResponse.json({ success: true, threadId, messages: normalized })
  } catch (error) {
    console.error('assistants-chat GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

