import { streamText, convertToModelMessages } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, model = 'gpt-4o' } = await req.json()

    // Intent detection (ignore single '?')
    const lastUser = [...(Array.isArray(messages) ? messages : [])]
      .reverse()
      .find((m: any) => m?.role === 'user')
    const lastUserText = Array.isArray(lastUser?.parts)
      ? lastUser.parts.filter((p: any) => p?.type === 'text').map((p: any) => p.text).join(' ')
      : ''
    const trimmed = (lastUserText || '').trim()
    const isSearch = /\b(cfo|controller|økonomi|finance|stilling|stillinger|job|jobs|aarhus|københavn|odense|aalborg|fyn|sjælland|jylland|interim|score)\b/i.test(trimmed)
    const forceSearch = isSearch && trimmed.length > 1

    // Vector store search helper (no tool exposure to the model)
    const vectorSearch = async (query: string, limit = 40) => {
      const effectiveLimit = Math.max(20, Math.min(Math.max(limit, 1), 100))
      const qLower = String(query || '').toLowerCase()
      const surrounding = /(omegn|området|nærhed|omkring|tæt på)/i.test(qLower)
      const locMatch = qLower.match(/\b(?:i|på)\s+([a-zæøåéèüöä\- ]{2,})/i)
      const companyMatch = qLower.match(/\bhos\s+([a-z0-9æøåéèüöä\-\.& ]{2,})/i)
      const locationHint = locMatch ? locMatch[1].trim().replace(/[.,;].*$/, '') : null
      const companyHint = companyMatch ? companyMatch[1].trim().replace(/[.,;].*$/, '') : null
      const vsId = 'vs_689c4ba3dd8c8191b4ced38afe9de3f1'
      console.log('[vector-search] start', { vsId, effectiveLimit, locationHint, companyHint, surrounding })
      const body = {
        model: 'gpt-5-chat',
        input: [
          `Brugerforespørgsel: "${query}". Find relevante jobopslag fra vektor-store og svar KUN i gyldig JSON med nøglerne ` +
          `'items' (liste af objekter: {id?, job_id?, title, company, location?, publication_date?, cfo_score?, job_url?, description?}) og 'summary' (streng). ` +
          `Returnér ingen forklarende tekst udenfor JSON. Kun data fra vektor-store; ingen gæt.`
        ],
        tools: [ { type: 'file_search' as const } ],
        tool_resources: { file_search: { vector_store_ids: [vsId] } },
        modalities: ['text'],
        text: { format: 'json' },
        max_output_tokens: 1200
      }
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000) // 30 sekunder timeout
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(`OpenAI responses failed: ${res.status} ${msg}`)
      }
      const data = await res.json()
      console.log('[vector-search] response received')
      let parsed: any = undefined
      try {
        const content = data?.output?.[0]?.content || data?.response?.output?.[0]?.content || data?.choices?.[0]?.message?.content
        if (Array.isArray(content)) {
          const part = content.find((c: any) => c?.type === 'output_text' || c?.type === 'text' || c?.type === 'tool_output' || c?.type === 'message')
          const text = part?.text ?? part?.output_text ?? part?.content ?? ''
          parsed = typeof text === 'string' ? JSON.parse(text) : text
        } else if (typeof content === 'string') {
          parsed = JSON.parse(content)
        }
      } catch {}
      const itemsRaw = Array.isArray(parsed?.items) ? parsed.items : []
      const compact = itemsRaw.map((j: any) => ({
        id: j.id ?? null,
        job_id: j.job_id ?? null,
        title: j.title ?? '',
        company: j.company ?? '',
        location: j.location ?? null,
        publication_date: j.publication_date ?? null,
        cfo_score: j.cfo_score ?? null,
        job_url: j.job_url ?? null,
        description: typeof j.description === 'string' ? j.description.slice(0, 1200) : '',
        similarity: null,
      }))
      const hay = (it: { location?: string|null; title?: string|null; company?: string|null; description?: string|null }) => `${String(it.location||'').toLowerCase()} ${String(it.title||'').toLowerCase()} ${String(it.company||'').toLowerCase()} ${String(it.description||'').toLowerCase()}`
      let filtered = compact
      if (companyHint) filtered = filtered.filter((it: any) => hay(it).includes(companyHint))
      if (locationHint && !surrounding) filtered = filtered.filter((it: any) => hay(it).includes(locationHint))
      const visible = filtered.length ? filtered : compact
      console.log('[vector-search] result counts', { total: compact.length, filtered: visible.length })
      const top = visible.slice(0, Math.min(visible.length, 4))
      const bullets: string[] = []
      if (visible.length > 0) bullets.push(`Jeg fandt ${visible.length} relevante opslag.`)
      for (const it of top) bullets.push(`${it.title} – ${it.company}${it.location ? ` (${it.location})` : ''}`)
      const summary = bullets.length ? bullets.join('\n• ') : 'Ingen relevante opslag fundet.'
      return { items: visible, summary, limit: effectiveLimit }
    }

    // Vector-store backed response (no tools). Fetch items first, then condition the model.
    const lastQuery = trimmed
    const vs = await vectorSearch(lastQuery, 40)
    const result = await streamText({
      model: openai(model),
      messages: convertToModelMessages([
        ...messages,
        { role: 'system', content: `Data (JSON) fra vektor-store: ${JSON.stringify(vs.items ?? []).slice(0, 120000)}` },
      ] as any),
      system: [
        'Du er en dansk job-assistent.',
        '',
        'Når brugerens besked handler om jobs eller filtrering:',
        '- Brug de vedlagte data fra vektor-store (allerede hentet). Kald ingen værktøjer.',
        '- Brug mindst 20 resultater hvis tilgængeligt; vælg de mest relevante i svaret.',
        '- Afled rolle/lokation/virksomhed ud fra brugerens tekst (fx "i/på <sted>", "hos <virksomhed>").',
        '- Ingen hardcoding; brug kun brugerens tekst og dataene.',
        '',
        'Svarformat (kun tekst – ingen kort, links eller markdown-lister):',
        '- Første linje: "Jeg fandt X relevante opslag."',
        '- Derefter op til 20 korte linjer, én per job: "[Virksomhed]: [Titel] i [Lokation]".',
        '- Hold sproget naturligt og kort; kun de mest relevante resultater.',
        '- Tilføj ikke "Læs mere" eller UI-elementer; klienten håndterer det.',
        '',
        'Adfærd:',
        '- Spørg aldrig om bekræftelse før du viser resultater.',
        '- Brug udelukkende de vedlagte data som kilde (ingen gæt/hallucination).',
        '- Hvis tool\'et returnerer 0 relevante fund, så stil én kort, præcis afklarende opfølgning. Ellers stil ingen opfølgning.',
        '- Ved rene forklaringer/definitioner: ingen værktøjer – svar kun i tekst (dansk).',
      ].join('\n'),
      temperature: 0.2,
      maxOutputTokens: 800,
    })

    // Return the UI message stream response
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Return more specific error messages
    let errorMessage = 'Internal server error'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('OpenAI responses failed')) {
        errorMessage = 'OpenAI API fejl - prøv igen om et par minutter'
        statusCode = 503
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Netværksfejl - tjek din internetforbindelse'
        statusCode = 503
      } else {
        errorMessage = error.message
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Ukendt fejl'
      }),
      { 
        status: statusCode, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        } 
      }
    )
  }
}

