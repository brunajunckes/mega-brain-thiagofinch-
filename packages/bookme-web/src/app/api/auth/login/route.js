export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Proxy to Python backend
    // - Explicit env var for flexibility (used in Docker)
    // - Default to Docker network hostname when running in container
    // - Fall back to localhost for local development
    const isDocker = process.env.DOCKER_ENV === 'true' || process.env.BACKEND_URL?.includes('bookme-backend');
    const backendUrl = process.env.BACKEND_URL ||
                      (isDocker ? 'http://bookme-backend:8000' : 'http://localhost:8002');

    const response = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Login failed', message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
