const BACKEND = process.env.BACKEND_URL || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');

export async function GET() {
  try {
    const r = await fetch(`${BACKEND}/api/novel-process/voice-interview`);
    const text = await r.text();
    try {
      JSON.parse(text);
      return new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json' } });
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid response' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed', message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
