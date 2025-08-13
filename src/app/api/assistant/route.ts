import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { message, conversation = [] } = await request.json()
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    // Build a compact input text from conversation
    const inputText = [...conversation, { role: 'user', content: message }]
      .map((m: any) => `${m.role}: ${m.content}`)
      .join('\n')

    // Define tool for semantic search (Responses API-compatible shape)
    const tools: any[] = [
      {
        type: 'function',
        function: {
          name: 'semantic_search',
          description: 'Find relevante økonomi-jobs med semantisk søgning og valgfri filtre',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Brugerens søgetekst' },
              matchThreshold: { type: 'number', description: '0-1, højere = strengere match', default: 0.3 },
              pageSize: { type: 'number', description: 'Antal resultater at hente', default: 20 },
              minScore: { type: 'number', description: 'Minimum CFO score (1-3)', default: 1 },
              locationFilter: { type: 'string', nullable: true },
              companyFilter: { type: 'string', nullable: true },
            },
            required: ['query'],
            additionalProperties: false,
          },
        },
      },
    ]

    // First Responses API call with tools enabled
    const first = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1',
      input: inputText,
      tools,
      tool_choice: 'auto',
      max_output_tokens: 500,
    })

    // Collect tool uses
    const toolUses = findToolUses(first)
    if (toolUses.length > 0) {
      const tool_outputs: Array<{ tool_call_id: string; output: string }> = []
      for (const use of toolUses) {
        if (use.name === 'semantic_search') {
          try {
            const args = use.arguments as {
              query: string
              matchThreshold?: number
              pageSize?: number
              minScore?: number
              locationFilter?: string | null
              companyFilter?: string | null
            }
            // Generate embedding directly
            const emb = await openai.embeddings.create({
              model: 'text-embedding-3-large',
              input: args.query,
              encoding_format: 'float',
            })
            const queryEmbedding = emb.data[0].embedding

            // Supabase direct RPC
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
            const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
            const supabase = createClient(supabaseUrl, supabaseAnon)

            const { data: semantic } = await supabase.rpc('match_jobs_semantic_perfect', {
              query_embedding: queryEmbedding,
              match_threshold: args.matchThreshold ?? 0.3,
              match_count: Math.min(Math.max(args.pageSize ?? 20, 1), 50),
              min_score: args.minScore ?? 1,
              location_filter: args.locationFilter ?? null,
              company_filter: args.companyFilter ?? null,
            })
            let items = semantic || []

            // Fallback to text search if needed
            if (!items.length) {
              const { data: text } = await supabase.rpc('match_jobs_text', {
                search_text: args.query,
                match_count: Math.min(Math.max(args.pageSize ?? 20, 1), 50),
                min_score: args.minScore ?? 1,
              })
              if (text?.length) items = text
            }

            // Only send compact fields back
            const compact = (items || []).slice(0, 50).map((j: any) => ({
              id: j.id,
              job_id: j.job_id,
              title: j.title,
              company: j.company,
              location: j.location,
              publication_date: j.publication_date,
              cfo_score: j.cfo_score,
              job_url: (j as any).job_url ?? null,
              description: typeof (j as any).description === 'string' ? (j as any).description.slice(0, 1200) : '',
              similarity: (j as any).similarity ?? null,
            }))

            tool_outputs.push({
              tool_call_id: use.id,
              output: JSON.stringify({ ok: true, items: compact }),
            })
          } catch (e: any) {
            tool_outputs.push({
              tool_call_id: use.id,
              output: JSON.stringify({ ok: false, error: e?.message || 'unknown error' }),
            })
          }
        }
      }

      // Submit tool outputs and get final assistant response
      const follow = await openai.responses.submitToolOutputs(first.id, { tool_outputs })
      const finalText = extractResponseText(follow)
      return NextResponse.json({ success: true, response: finalText })
    }

    // No tool use; return first text
    const finalText = extractResponseText(first)
    return NextResponse.json({ success: true, response: finalText })
  } catch (error) {
    console.error('Assistant tool-call error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function findToolUses(resp: any): Array<{ id: string; name: string; arguments: any }> {
  const uses: Array<{ id: string; name: string; arguments: any }> = []
  try {
    const output = (resp as any).output || (resp as any).outputs || []
    for (const item of output) {
      const content = (item as any)?.content || []
      for (const c of content) {
        if (c?.type === 'tool_use') {
          let args: any = {}
          try {
            args = typeof c.input === 'string' ? JSON.parse(c.input) : (c.input || c.arguments || {})
          } catch {
            args = c.input || c.arguments || {}
          }
          uses.push({ id: c.id, name: c.name, arguments: args })
        }
        // Back-compat if SDK uses different key
        if (c?.type === 'tool_call') {
          let args: any = {}
          try {
            args = typeof c.arguments === 'string' ? JSON.parse(c.arguments) : (c.arguments || {})
          } catch {
            args = c.arguments || {}
          }
          uses.push({ id: c.id, name: c.name, arguments: args })
        }
      }
    }
  } catch {}
  return uses
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

