const BACKEND = process.env.BACKEND_URL || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');

export async function GET(request) {
  try {
    const token = request.headers.get('authorization');
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || '';
    const r = await fetch(`${BACKEND}/api/templates${category ? `?category=${category}` : ''}`, { headers: { 'Authorization': token || '', 'Content-Type': 'application/json' } });
    const data = await r.json();
    return new Response(JSON.stringify(data), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
