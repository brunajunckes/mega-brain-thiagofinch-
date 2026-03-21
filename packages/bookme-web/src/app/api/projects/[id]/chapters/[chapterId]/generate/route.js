const BACKEND = process.env.BACKEND_URL || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');

export async function POST(request, { params }) {
  try {
    const { id, chapterId } = await params;
    const token = request.headers.get('authorization');
    const body = await request.json();
    const r = await fetch(`${BACKEND}/api/projects/${id}/chapters/${chapterId}/generate`, {
      method: 'POST',
      headers: { 'Authorization': token || '', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await r.text();

    // Try JSON first
    try {
      JSON.parse(text);
      return new Response(text, { status: r.status, headers: { 'Content-Type': 'application/json' } });
    } catch {
      // If SSE, extract final_content from generation_completed event
      let generatedText = '';
      for (const line of text.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.event === 'generation_completed' && evt.data?.final_content) {
              generatedText = evt.data.final_content;
            }
          } catch {}
        }
      }
      return new Response(JSON.stringify({ generated_text: generatedText, status: 'ok' }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Generation failed', message: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
