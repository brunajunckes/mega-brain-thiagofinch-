const RoundtableOrchestrator = require('../../../bin/modules/squad-advisor/lib/roundtable-orchestrator');

describe('RoundtableOrchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new RoundtableOrchestrator();
  });

  test('should orchestrate a roundtable discussion', async () => {
    const result = await orchestrator.orchestrate({
      id: 'test-roundtable',
      question: 'How should we approach MVP?',
      experts: [
        { slug: 'alex_hormozi', name: 'Alex Hormozi', expertise: ['scaling'] }
      ],
      rounds: 2
    });

    expect(result.id).toBe('test-roundtable');
    expect(result.rounds).toBeDefined();
    expect(result.rounds.length).toBe(2);
    expect(result.synthesis).toBeDefined();
    expect(result.markdown).toBeDefined();
  });

  test('should generate markdown from roundtable', async () => {
    const result = await orchestrator.orchestrate({
      id: 'test-roundtable-md',
      question: 'What is the core problem?',
      experts: [
        { slug: 'don_norman', name: 'Don Norman', expertise: ['design', 'ux'] }
      ],
      rounds: 1
    });

    expect(result.markdown).toContain('Expert Roundtable Discussion');
    expect(result.markdown).toContain('Don Norman');
    expect(result.markdown).toContain('What is the core problem?');
  });

  test('should synthesize expert responses', async () => {
    const result = await orchestrator.orchestrate({
      id: 'test-synthesis',
      question: 'Should we scale or optimize?',
      experts: [
        { slug: 'alex_hormozi', name: 'Alex Hormozi', expertise: ['scaling'] },
        { slug: 'andrew_ng', name: 'Andrew Ng', expertise: ['ML'] }
      ],
      rounds: 1
    });

    expect(result.synthesis.consensus).toBeDefined();
    expect(result.synthesis.recommendation).toBeDefined();
  });
});
