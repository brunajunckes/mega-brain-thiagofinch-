/**
 * Knowledge Manager Tests
 */

const path = require('path');
const { tmpdir } = require('os');
const { KnowledgeManager } = require('../manager');

describe('KnowledgeManager', () => {
  let manager;
  const tempPath = path.join(tmpdir(), 'knowledge-test');

  beforeAll(() => {
    const config = {
      storagePath: tempPath,
      maxEmbeddingDimension: 128,
      autoBackup: false,
      backupInterval: 3600000,
    };
    manager = new KnowledgeManager(config);
  });

  it('should ingest knowledge entry', async () => {
    const request = {
      type: 'text',
      title: 'Test Article',
      source: 'test-source',
      content: 'This is a test article about AI and machine learning.',
      domain: 'ai',
      expert: 'Test Expert',
      tags: ['ai', 'learning'],
    };

    const entry = await manager.ingest(request);
    expect(entry.id).toBeTruthy();
    expect(entry.title).toBe('Test Article');
    expect(entry.embedding.length).toBeGreaterThan(0);
    expect(entry.summary).toBeTruthy();
  });

  it('should search knowledge entries', async () => {
    // Ingest test entries
    await manager.ingest({
      type: 'text',
      title: 'AI Fundamentals',
      source: 'test',
      content: 'Machine learning is a subset of AI',
      domain: 'ai',
      tags: ['ai', 'ml'],
    });

    // Search
    const results = await manager.search({
      text: 'machine learning',
      limit: 5,
      minRelevance: 0.5,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].relevance).toBeGreaterThan(0);
  });

  it('should get entries by domain', async () => {
    await manager.ingest({
      type: 'text',
      title: 'Marketing Strategy',
      source: 'test',
      content: 'Marketing strategies for growth',
      domain: 'marketing',
      tags: ['marketing'],
    });

    const entries = await manager.getEntriesByDomain('marketing');
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].metadata.domain).toBe('marketing');
  });

  it('should get statistics', async () => {
    const stats = await manager.getStatistics();
    expect(stats.totalEntries).toBeGreaterThan(0);
    expect(stats.entriesByType).toBeTruthy();
    expect(stats.entriesByDomain).toBeTruthy();
  });

  it('should export and import', async () => {
    const exported = await manager.export();
    expect(exported).toBeTruthy();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
  });

  afterAll(async () => {
    await manager.clear();
  });
});
