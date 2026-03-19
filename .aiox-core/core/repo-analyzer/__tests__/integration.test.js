'use strict';

const fs = require('fs-extra');
const path = require('path');
const { RepoScanner } = require('../scanner');
const { DependencyAnalyzer } = require('../dependency-analyzer');
const { PatternDetector } = require('../pattern-detector');
const { MetricsCollector } = require('../metrics-collector');
const { ReportGenerator } = require('../report-generator');

/**
 * Integration tests for complete Repo Analyzer workflow
 * Tests the full pipeline: Scanner → Deps → Patterns → Metrics → Reports
 */
describe('RepoAnalyzer Integration', () => {
  let testDir;

  beforeEach(async () => {
    testDir = path.join(__dirname, '.test-integration');
    await fs.ensureDir(testDir);

    // Create a sample project structure
    // src/
    //   app.js
    //   components/
    //     ui.js
    // tests/
    //   app.test.js
    // package.json
    // requirements.txt

    const srcDir = path.join(testDir, 'src');
    const componentsDir = path.join(srcDir, 'components');
    const testsDir = path.join(testDir, 'tests');

    await fs.ensureDir(componentsDir);
    await fs.ensureDir(testsDir);

    // Write source files
    const appCode = `
/**
 * Main application file
 */
function initApp() {
  console.log('App initialized');
  return {
    start: () => console.log('Started'),
    stop: () => console.log('Stopped'),
  };
}

module.exports = initApp;
`;
    await fs.writeFile(path.join(srcDir, 'app.js'), appCode);

    const componentCode = `
function Button(props) {
  return props.label;
}

module.exports = Button;
`;
    await fs.writeFile(path.join(componentsDir, 'ui.js'), componentCode);

    // Write test file
    const testCode = `
const initApp = require('../src/app');

describe('App', () => {
  it('should initialize', () => {
    const app = initApp();
    expect(app.start).toBeDefined();
  });
});
`;
    await fs.writeFile(path.join(testsDir, 'app.test.js'), testCode);

    // Write package.json
    const pkgJson = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: { express: '^4.18.0', lodash: '^4.17.0' },
      devDependencies: { jest: '^29.0.0' },
    };
    await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(pkgJson));

    // Write requirements.txt
    const reqsContent = 'flask==2.0.0\nrequests>=2.28.0';
    await fs.writeFile(path.join(testDir, 'requirements.txt'), reqsContent);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should complete full analysis pipeline', async () => {
    // Phase 1: Scan
    const scanner = new RepoScanner({ rootPath: testDir });
    const scanResult = await scanner.scan();

    expect(scanResult.summary.totalFiles).toBeGreaterThan(0);
    expect(scanResult.languages.JavaScript).toBeDefined();
    expect(scanResult.frameworks).toContain('Node.js');

    // Phase 2: Dependencies
    const depsAnalyzer = new DependencyAnalyzer({ rootPath: testDir });
    const depsResult = await depsAnalyzer.analyze();

    expect(depsResult.summary.productionDeps).toBeGreaterThanOrEqual(2);
    expect(depsResult.summary.developmentDeps).toBeGreaterThanOrEqual(1);
    expect(
      depsResult.dependencies.production.some((d) => d.name === 'express') ||
        depsResult.dependencies.production.some((d) => d.name === 'flask'),
    ).toBe(true);

    // Phase 3: Patterns
    const patternDetector = new PatternDetector({ rootPath: testDir });
    const patternsResult = await patternDetector.detect();

    expect(patternsResult.patterns.architecture).toBeDefined();
    expect(patternsResult.patterns.architecture.score).toBeGreaterThanOrEqual(0);

    // Phase 4: Metrics
    const metricsCollector = new MetricsCollector({ rootPath: testDir });
    const metricsResult = await metricsCollector.collect();

    expect(metricsResult.metrics.avgFunctionLength).toBeGreaterThanOrEqual(0);
    expect(metricsResult.metrics.testCoverage).toBeGreaterThanOrEqual(0);

    // Phase 5: Reports
    const reportGen = new ReportGenerator({ rootPath: testDir, outputPath: testDir });
    const analysisData = {
      scanner: scanResult,
      deps: depsResult,
      patterns: patternsResult.patterns,
      metrics: metricsResult.metrics,
    };

    const reportResult = await reportGen.generate(analysisData);

    expect(fs.existsSync(reportResult.json)).toBe(true);
    expect(fs.existsSync(reportResult.markdown)).toBe(true);
    expect(fs.existsSync(reportResult.architecture)).toBe(true);

    // Verify report content
    const jsonContent = JSON.parse(await fs.readFile(reportResult.json, 'utf-8'));
    expect(jsonContent.metadata).toBeDefined();
    expect(jsonContent.summary).toBeDefined();
    expect(jsonContent.dependencies).toBeDefined();

    const mdContent = await fs.readFile(reportResult.markdown, 'utf-8');
    expect(mdContent).toContain('Repository Analysis Report');
    expect(mdContent).toContain('Dependencies');
  });

  it('should handle real project structure (monorepo simulation)', async () => {
    // Create monorepo structure
    const packages1 = path.join(testDir, 'packages', 'ui');
    const packages2 = path.join(testDir, 'packages', 'api');

    await fs.ensureDir(packages1);
    await fs.ensureDir(packages2);

    // Package 1
    await fs.writeFile(path.join(packages1, 'index.js'), 'module.exports = {}');
    await fs.writeFile(
      path.join(packages1, 'package.json'),
      JSON.stringify({ name: 'ui', version: '1.0.0' }),
    );

    // Package 2
    await fs.writeFile(path.join(packages2, 'index.js'), 'module.exports = {}');
    await fs.writeFile(
      path.join(packages2, 'package.json'),
      JSON.stringify({ name: 'api', version: '1.0.0' }),
    );

    // Root monorepo config
    const rootPkgJson = {
      name: 'monorepo-root',
      workspaces: ['packages/*'],
    };
    await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify(rootPkgJson));

    // Run analysis
    const scanner = new RepoScanner({ rootPath: testDir });
    const result = await scanner.scan();

    expect(result.summary.totalFiles).toBeGreaterThanOrEqual(3);
    expect(result.fileStats).toBeDefined();
  });

  it('should handle project with multiple languages', async () => {
    // Add Python file
    await fs.writeFile(path.join(testDir, 'script.py'), 'def hello():\n    print("hello")\n');

    // Add Go file
    await fs.writeFile(path.join(testDir, 'main.go'), 'package main\n\nfunc main() {}');

    // Add Go modules file
    await fs.writeFile(path.join(testDir, 'go.mod'), 'module github.com/test/app\n');

    // Run analysis
    const scanner = new RepoScanner({ rootPath: testDir });
    const result = await scanner.scan();

    expect(Object.keys(result.languages).length).toBeGreaterThan(1);
    expect(result.languages.Python).toBeDefined();
    expect(result.languages.Go).toBeDefined();
    expect(result.frameworks).toContain('Go');
  });

  it('should generate consistent reports on second run', async () => {
    const scanner1 = new RepoScanner({ rootPath: testDir });
    const result1 = await scanner1.scan();

    const scanner2 = new RepoScanner({ rootPath: testDir });
    const result2 = await scanner2.scan();

    expect(result1.summary.totalFiles).toBe(result2.summary.totalFiles);
    expect(result1.summary.totalLoc).toBe(result2.summary.totalLoc);
    expect(result1.summary.languages).toBe(result2.summary.languages);
  });
});
