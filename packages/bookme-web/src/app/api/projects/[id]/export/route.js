const BACKEND = process.env.BACKEND_URL || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization');
    const body = await request.json();
    const format = body.format || 'pdf';

    const r = await fetch(`${BACKEND}/api/projects/${id}/export?format=${format}`, {
      method: 'POST',
      headers: { 'Authorization': token || '', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const contentType = r.headers.get('content-type') || 'application/octet-stream';
    const buffer = await r.arrayBuffer();

    const extMap = { pdf: 'application/pdf', html: 'text/html', txt: 'text/plain' };
    return new Response(buffer, {
      status: r.status,
      headers: {
        'Content-Type': extMap[format] || contentType,
        'Content-Disposition': `attachment; filename="book.${format}"`
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Export failed', message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
