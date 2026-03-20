const SquadManager = require('../../../bin/modules/squad-advisor/lib/squad-manager');

describe('SquadManager', () => {
  let squadManager;

  beforeAll(() => {
    squadManager = new SquadManager();
  });

  test('should load squads from squads directory', () => {
    expect(squadManager.squads).toBeDefined();
    expect(Object.keys(squadManager.squads).length).toBeGreaterThan(0);
  });

  test('should get a squad by ID', () => {
    const squad = squadManager.getSquad('business-growth');
    expect(squad).toBeDefined();
    expect(squad.members).toBeDefined();
  });

  test('should search experts by domain', () => {
    const results = squadManager.searchExperts('scaling');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  test('should limit expert search to specific squad', () => {
    const results = squadManager.searchExperts('scaling', 'business-growth');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].squad).toBe('business-growth');
  });

  test('should get top 3 experts for domains', () => {
    const experts = squadManager.getTopExperts(['scaling', 'marketing']);
    expect(Array.isArray(experts)).toBe(true);
    expect(experts.length).toBeLessThanOrEqual(3);
  });
});
