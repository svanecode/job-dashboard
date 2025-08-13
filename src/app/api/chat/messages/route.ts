export const runtime = 'edge'

// Disabled persistence: return empty for GET and 501 for POST
export async function GET() {
  return new Response(JSON.stringify({ messages: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST() {
  return new Response(JSON.stringify({ error: 'Chat message persistence is disabled' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  })
}

