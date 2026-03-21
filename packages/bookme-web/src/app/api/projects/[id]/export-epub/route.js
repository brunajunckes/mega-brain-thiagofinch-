const BACKEND = process.env.BACKEND_URL || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const body = await request.json();
    const r = await fetch(`${BACKEND}/api/projects/${id}/export-epub`, {
      method: 'POST',
      headers: { 'Authorization': token || '', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (r.ok) {
      const contentType = r.headers.get('content-type') || 'application/epub+zip';
      const buffer = await r.arrayBuffer();
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/epub+zip',
          'Content-Disposition': 'attachment; filename="book.epub"'
        }
      });
    }

    const text = await r.text();
    return new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'EPUB export failed', message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
