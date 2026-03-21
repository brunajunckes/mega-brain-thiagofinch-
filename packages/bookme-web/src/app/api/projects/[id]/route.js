const BACKEND = process.env.BACKEND_URL || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const r = await fetch(`${BACKEND}/projects/${id}`, { headers: { 'Authorization': token || '', 'Content-Type': 'application/json' } });
    const data = await r.json();
    return new Response(JSON.stringify(data), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed', message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const body = await request.json();
    const r = await fetch(`${BACKEND}/projects/${id}`, { method: 'PUT', headers: { 'Authorization': token || '', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await r.json();
    return new Response(JSON.stringify(data), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed', message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const r = await fetch(`${BACKEND}/projects/${id}`, { method: 'DELETE', headers: { 'Authorization': token || '', 'Content-Type': 'application/json' } });
    const data = await r.json();
    return new Response(JSON.stringify(data), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed', message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
