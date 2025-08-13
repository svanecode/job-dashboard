export const runtime = 'edge'

type TavilyResult = {
  results: Array<{
    url: string
    title: string
    content: string
    score?: number
  }>
}

export async function POST(req: Request) {
  try {
    const { query, maxResults = 5 } = await req.json()
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400 })
    }

    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Web search not configured' }), { status: 501 })
    }

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        query,
        search_depth: 'advanced',
        include_answer: false,
        include_images: false,
        max_results: Math.max(1, Math.min(10, Number(maxResults) || 5)),
      }),
      // Edge runtime fetch
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      return new Response(JSON.stringify({ error: 'Search failed', details: text }), { status: 500 })
    }

    const data = (await res.json()) as TavilyResult
    return new Response(JSON.stringify({ results: data.results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}

