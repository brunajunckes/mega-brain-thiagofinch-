export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    const backendUrl = process.env.BACKEND_URL || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');
    const r = await fetch(`${backendUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await r.json();
    return new Response(JSON.stringify(data), { status: r.status, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Login failed', message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
