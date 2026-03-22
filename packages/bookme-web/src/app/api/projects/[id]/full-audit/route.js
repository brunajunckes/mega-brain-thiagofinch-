const BACKEND = process.env.BACKEND_URL || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const body = await request.json();
    const r = await fetch(`${BACKEND}/api/projects/${id}/full-audit`, {
      method: 'POST',
      headers: { 'Authorization': token || '', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
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
