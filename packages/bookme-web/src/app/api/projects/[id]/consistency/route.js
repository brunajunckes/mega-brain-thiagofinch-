const BACKEND = process.env.BACKEND_URL || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const r = await fetch(`${BACKEND}/api/projects/${id}/consistency`, {
      headers: { 'Authorization': token || '' }
    });
    const text = await r.text();
    try {
      JSON.parse(text);
      return new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json' } });
    } catch {
      return new Response(JSON.stringify({ entities: {}, issues: [], summary: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ entities: {}, issues: [], summary: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
