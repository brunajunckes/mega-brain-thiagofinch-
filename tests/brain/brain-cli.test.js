/* Brain Factory CLI tests */

jest.mock('../../bin/modules/brain/http-client.js');
const { ingest } = require('../../bin/modules/brain/ingest.js');
const { status } = require('../../bin/modules/brain/status.js');
const { ask } = require('../../bin/modules/brain/ask.js');
const { squad } = require('../../bin/modules/brain/squad.js');

describe('Brain Factory CLI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ingest requires --clone argument', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await ingest({});

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  test('ingest requires source type', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await ingest({ clone: 'test_user' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  test('dry-run mode should not call HTTP', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');

    await ingest({
      clone: 'test_user',
      doc: '/path/to/file.txt',
      dryRun: true,
    });

    expect(request).not.toHaveBeenCalled();
  });

  test('status command lists clones', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({
      status: 200,
      data: {
        clones: [
          { slug: 'alex_hormozi', points_count: 342 },
          { slug: 'naval_ravikant', points_count: 891 },
        ],
        total: 2,
      },
    });

    await status({});

    expect(request).toHaveBeenCalledWith('GET', '/brain/clones');
  });

  test('ask requires --clone argument', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await ask('test question', {});

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  test('ask command queries clone', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockClear();
    request.mockResolvedValue({
      data: {
        slug: 'alex_hormozi',
        question: 'How to scale?',
        response: 'Here is my advice...',
        session_id: 'sess_123',
        chunks_used: 3,
        cache_hit: false,
        model: 'qwen2.5:7b',
        input_tokens: 50,
        output_tokens: 30,
        timestamp: '2026-03-20T00:00:00',
      },
    });

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await ask('How to scale?', { clone: 'alex_hormozi', rag: true });

    expect(request).toHaveBeenCalledWith('POST', '/brain/ask', {
      slug: 'alex_hormozi',
      question: 'How to scale?',
      session_id: undefined,
      use_rag: true,
      model: undefined,
    });

    exitSpy.mockRestore();
  });

  test('ask --history shows conversation', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockClear();
    request.mockResolvedValue({
      data: {
        slug: 'alex_hormozi',
        session_id: 'sess_123',
        messages: [
          { role: 'user', content: 'Q1', timestamp: '2026-03-20T00:00:00' },
          { role: 'assistant', content: 'A1', timestamp: '2026-03-20T00:01:00' },
        ],
        count: 2,
      },
    });

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await ask('ignored', { clone: 'alex_hormozi', history: true, rag: true });

    expect(request).toHaveBeenCalledWith('GET', expect.stringContaining('/brain/ask/alex_hormozi/history'));

    exitSpy.mockRestore();
  });

  test('ask with --session maintains conversation context', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockClear();
    request.mockResolvedValue({
      data: {
        slug: 'alex_hormozi',
        question: 'Next question?',
        response: 'Based on our previous discussion...',
        session_id: 'sess_456',
        chunks_used: 2,
        cache_hit: false,
        model: 'qwen2.5:7b',
        input_tokens: 100,
        output_tokens: 50,
        timestamp: '2026-03-20T00:02:00',
      },
    });

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await ask('Next question?', { clone: 'alex_hormozi', session: 'sess_456', rag: true });

    expect(request).toHaveBeenCalledWith('POST', '/brain/ask', {
      slug: 'alex_hormozi',
      question: 'Next question?',
      session_id: 'sess_456',
      use_rag: true,
      model: undefined,
    });

    exitSpy.mockRestore();
  });
});

describe('Brain Squad CLI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('squad --ask sends POST to /brain/squad/ask', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({
      data: {
        responses: {
          hormozi: { response: 'Scale offers first' },
          naval: { response: 'Build leverage' },
        },
        consensus: {
          consensus_score: 0.45,
          consensus_percentage: 45,
          agreement_level: 'medium',
          common_themes: ['build'],
          agreements: ['build'],
          disagreements: [],
        },
        metrics: {
          num_clones: 2,
          parallel_queries: 2,
          total_tokens: 100,
          query_time: 2.5,
        },
      },
    });

    await squad({ ask: 'how to scale to 8 figures?' });

    expect(request).toHaveBeenCalledWith('POST', '/brain/squad/ask', {
      question: 'how to scale to 8 figures?',
      use_rag: true,
      synthesize: false,
      debate_rounds: 0,
    });
  });

  test('squad --ask with --synthesize sends synthesize flag', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({
      data: {
        responses: { hormozi: { response: 'Test' } },
        synthesis: { text: 'Unified view', model: 'qwen2.5:14b', synthesis_time: 1.2 },
        consensus: { consensus_score: 0.5, consensus_percentage: 50, agreement_level: 'medium', common_themes: [], agreements: [], disagreements: [] },
        metrics: { num_clones: 1, parallel_queries: 1, total_tokens: 50, query_time: 1.0 },
      },
    });

    await squad({ ask: 'test question', synthesize: true });

    expect(request).toHaveBeenCalledWith('POST', '/brain/squad/ask', {
      question: 'test question',
      use_rag: true,
      synthesize: true,
      debate_rounds: 0,
    });
  });

  test('squad --ask with --debate sends debate_rounds', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({
      data: {
        responses: { hormozi: { response: 'Test' } },
        debate: {
          debate_id: 'debate_abc123',
          rounds: {
            round_1: { hormozi: { response: 'Round 1' } },
            round_2: { hormozi: { response: 'Round 2' } },
            round_3: { hormozi: { response: 'Round 3' } },
          },
        },
        consensus: { consensus_score: 0.3, consensus_percentage: 30, agreement_level: 'low', common_themes: [], agreements: [], disagreements: [] },
        metrics: { num_clones: 1, parallel_queries: 1, total_tokens: 150, query_time: 5.0 },
      },
    });

    await squad({ ask: 'test question', debate: '3' });

    expect(request).toHaveBeenCalledWith('POST', '/brain/squad/ask', {
      question: 'test question',
      use_rag: true,
      synthesize: false,
      debate_rounds: 3,
    });
  });

  test('squad --ask with --clones sends clone list', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({
      data: {
        responses: { hormozi: { response: 'Test' } },
        consensus: { consensus_score: 0, consensus_percentage: 0, agreement_level: 'none', common_themes: [], agreements: [], disagreements: [] },
        metrics: { num_clones: 1, parallel_queries: 1, total_tokens: 50, query_time: 1.0 },
      },
    });

    await squad({ ask: 'test', clones: 'hormozi,naval' });

    expect(request).toHaveBeenCalledWith('POST', '/brain/squad/ask', {
      question: 'test',
      use_rag: true,
      synthesize: false,
      debate_rounds: 0,
      clones: ['hormozi', 'naval'],
    });
  });

  test('squad --list shows available clones', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({
      data: {
        clones: [
          { name: 'hormozi', chunk_count: 342, source_types: ['youtube', 'pdf'], available: true },
          { name: 'naval', chunk_count: 891, source_types: ['youtube'], available: true },
        ],
        count: 2,
      },
    });

    await squad({ list: true });

    expect(request).toHaveBeenCalledWith('GET', '/brain/squad/clones');
  });

  test('squad without --ask or --list exits with error', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await squad({});

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  test('squad --ask with --json outputs JSON', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    const mockData = {
      responses: { hormozi: { response: 'JSON test' } },
      consensus: { consensus_score: 0.5, consensus_percentage: 50, agreement_level: 'medium', common_themes: [], agreements: [], disagreements: [] },
      metrics: { num_clones: 1, parallel_queries: 1, total_tokens: 30, query_time: 0.5 },
    };
    request.mockResolvedValue({ data: mockData });

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await squad({ ask: 'test', json: true });

    // Verify JSON output was logged
    const jsonCalls = logSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('responses'),
    );
    expect(jsonCalls.length).toBeGreaterThan(0);

    logSpy.mockRestore();
  });
});
