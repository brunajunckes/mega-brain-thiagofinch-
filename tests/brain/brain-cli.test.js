/* Brain Factory CLI tests */

jest.mock('../../bin/modules/brain/http-client.js');
const { ingest } = require('../../bin/modules/brain/ingest.js');
const { status } = require('../../bin/modules/brain/status.js');
const { ask } = require('../../bin/modules/brain/ask.js');
const {
  watch, addWatch, listWatches, pauseWatch, resumeWatch, showHistory, showLogs,
} = require('../../bin/modules/brain/watch.js');

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

describe('Brain Watch CLI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('watch --channel --clone adds a watch', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({ data: { status: 'ok' } });

    await addWatch({ channel: 'https://youtube.com/@test', clone: 'test_clone' });

    expect(request).toHaveBeenCalledWith('POST', '/brain/watch', {
      channel_url: 'https://youtube.com/@test',
      slug: 'test_clone',
    });
  });

  test('watch --channel without --clone exits with error', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await addWatch({ channel: 'https://youtube.com/@test' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  test('watch --list fetches all watches', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({
      data: {
        watches: [
          { slug: 'hormozi', channel_url: 'https://youtube.com/@hormozi', paused: false },
        ],
        total: 1,
      },
    });

    await listWatches();

    expect(request).toHaveBeenCalledWith('GET', '/brain/watch');
  });

  test('watch --list shows empty message when no watches', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({ data: { watches: [], total: 0 } });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await listWatches();

    expect(consoleSpy).toHaveBeenCalledWith('No watched channels');
    consoleSpy.mockRestore();
  });

  test('watch --pause sends PATCH with pause action', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({ data: { status: 'paused' } });

    await pauseWatch({ clone: 'test_clone' });

    expect(request).toHaveBeenCalledWith('PATCH', '/brain/watch/test_clone', {
      action: 'pause',
    });
  });

  test('watch --pause without --clone exits with error', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await pauseWatch({});

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  test('watch --resume sends PATCH with resume action', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({ data: { status: 'resumed' } });

    await resumeWatch({ clone: 'test_clone' });

    expect(request).toHaveBeenCalledWith('PATCH', '/brain/watch/test_clone', {
      action: 'resume',
    });
  });

  test('watch --resume without --clone exits with error', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await resumeWatch({});

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  test('watch --history fetches ingestion history', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({
      data: {
        slug: 'hormozi',
        history: [
          { video_id: 'abc123', title: 'Test Video', chunks_added: 5, timestamp: '2026-03-20T00:00:00' },
        ],
        total: 1,
      },
    });

    await showHistory({ clone: 'hormozi' });

    expect(request).toHaveBeenCalledWith('GET', '/brain/watch/hormozi/history');
  });

  test('watch --history without --clone exits with error', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await showHistory({});

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  test('watch --logs fetches watch event logs', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({
      data: {
        slug: 'hormozi',
        logs: [
          { timestamp: '2026-03-20T00:00:00', event_type: 'check_complete', status: 'success', error: '' },
        ],
        total: 1,
      },
    });

    await showLogs({ clone: 'hormozi' });

    expect(request).toHaveBeenCalledWith('GET', '/brain/watch/hormozi/logs');
  });

  test('watch with no flags exits with error', async () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await watch(undefined, {});

    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });

  test('watch routes to correct handler based on flags', async () => {
    const { request } = require('../../bin/modules/brain/http-client.js');
    request.mockResolvedValue({ data: { watches: [], total: 0 } });

    await watch(undefined, { list: true });

    expect(request).toHaveBeenCalledWith('GET', '/brain/watch');
  });
});
