export const runtime = 'edge'

// Deliberately disabled: we don't persist chat sessions.
export async function GET() {
  return new Response(JSON.stringify({ sessions: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST() {
  return new Response(JSON.stringify({ error: 'Chat session persistence is disabled' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  })
}

