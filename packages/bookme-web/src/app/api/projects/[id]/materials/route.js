const BACKEND = process.env.BACKEND_URL || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const r = await fetch(`${BACKEND}/api/projects/${id}/materials`, { headers: { 'Authorization': token || '' } });
    const text = await r.text();
    try { return new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json' } }); }
    catch { return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }); }
  } catch (e) {
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const formData = await request.formData();
    const r = await fetch(`${BACKEND}/api/projects/${id}/materials/upload`, {
      method: 'POST',
      headers: { 'Authorization': token || '' },
      body: formData
    });
    const text = await r.text();
    return new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Upload failed', message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
