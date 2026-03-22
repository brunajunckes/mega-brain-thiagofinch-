import { validateRequest, validateProjectId, errorResponse } from '../../../lib/validation.js';

const BACKEND = process.env.BACKEND_URL || (process.env.DOCKER_ENV === 'true' ? 'http://bookme-backend:8000' : 'http://localhost:8002');

const VOICE_AUDIT_SCHEMA = {
  chapter_content: { type: 'string', required: true, minLength: 10 },
  voice_profile: { type: 'object', required: false },
  audit_depth: { type: 'string', required: false, default: 'standard', enum: ['quick', 'standard', 'deep'] },
};

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    // Validate project ID
    const idCheck = validateProjectId(id);
    if (!idCheck.valid) {
      return errorResponse(idCheck.error);
    }

    const token = request.headers.get('authorization');
    const body = await request.json();

    // Validate request body
    const validation = validateRequest(body, VOICE_AUDIT_SCHEMA);
    if (!validation.valid) {
      return errorResponse('Validation failed', 400, validation.errors);
    }

    const r = await fetch(`${BACKEND}/api/projects/${id}/voice-audit`, {
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
