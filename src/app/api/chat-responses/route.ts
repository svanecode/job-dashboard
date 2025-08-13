import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const VECTOR_STORE_ID = 'vs_689c4ba3dd8c8191b4ced38afe9de3f1'

function buildInputFromConversation(message: string, conversation: Array<{ role: string; content: string }> = []) {
  const history = (Array.isArray(conversation) ? conversation : [])
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')
  const joined = history ? `${history}\nuser: ${message}` : `user: ${message}`
  const system = [
    'Du er en dansk assistent til job-søgning og generelle spørgsmål.',
    'Når brugeren spørger om jobs, skal du bruge vektor-søgning for at hente relevante opslag fra den tilknyttede vector store.',
    'Skriv altid på dansk. Vær præcis og kortfattet.',
    'Format for job-svar:',
    '- Start med en kort, klar executive summary-linje (fx: "Jeg fandt X relevante opslag.").',
    '- Derefter korte, beslutningsorienterede linjer – én pr. job: "[Virksomhed]: [Titel] i [Lokation]". Inkluder URL hvis tilgængelig.',
    '- Medtag kun de mest relevante fund (op til 20).',
  ].join('\n')
  return `${system}\n\n${joined}`
}

function extractResponseText(resp: any): string {
  try {
    if (!resp) return ''
    if (typeof resp.output_text === 'string' && resp.output_text.length > 0) return resp.output_text
    const output = (resp as any).output || (resp as any).outputs || []
    const parts: string[] = []
    for (const item of output) {
      const content = (item as any)?.content || []
      for (const c of content) {
        const txt = (c as any)?.text?.value || (c as any)?.text || (c as any)?.content || ''
        if (typeof txt === 'string') parts.push(txt)
      }
    }
    return parts.join('\n').trim()
  } catch {
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversation = [] } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const input = buildInputFromConversation(message, conversation)
    const body = {
      model: 'gpt-5-chat',
      input: [input],
      tools: [
        {
          type: 'file_search' as const,
          vector_store_ids: [VECTOR_STORE_ID],
        },
      ],
      modalities: ['text'],
      max_output_tokens: 1200,
    }

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const msg = await res.text()
      return NextResponse.json({ error: `OpenAI error: ${res.status} ${msg}` }, { status: 500 })
    }

    const data = await res.json()
    const text = extractResponseText(data)
    return NextResponse.json({ success: true, response: text })
  } catch (error) {
    console.error('chat-responses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

