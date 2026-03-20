/* Brain Factory CLI tests */

jest.mock('../bin/modules/brain/http-client.js');
const { ingest } = require('../bin/modules/brain/ingest.js');
const { status } = require('../bin/modules/brain/status.js');

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
    const { request } = require('../bin/modules/brain/http-client.js');

    await ingest({
      clone: 'test_user',
      doc: '/path/to/file.txt',
      dryRun: true,
    });

    expect(request).not.toHaveBeenCalled();
  });

  test('status command lists clones', async () => {
    const { request } = require('../bin/modules/brain/http-client.js');
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
});
