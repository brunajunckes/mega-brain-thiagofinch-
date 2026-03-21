#!/usr/bin/env node

/**
 * Repo Analyzer Worker — Parallel repository analysis for adoption pipeline
 * Analyzes multiple repos concurrently to identify high-value adoption candidates
 * Uses token-efficient classification and minimal context
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class RepoAnalyzerWorker {
  constructor() {
    this.repos = [];
    this.results = [];
    this.scores = {};
  }

  /**
   * Fetch repository list from GitHub API (cached locally)
   */
  async fetchRepoList() {
    const candidates = [
      'https://github.com/SynkraAI/aiox-core',
      'https://github.com/agents-squads/agents-squads',
      'https://github.com/awslabs/agent-squad',
      'https://github.com/bradygaster/squad',
      'https://github.com/SynkraAI/aiox-tasks',
      'https://github.com/SynkraAI/aiox-workflows',
    ];

    return candidates;
  }

  /**
   * Quick classification without full clone
   * Returns: size, file count, asset type, value score (0-100)
   */
  async classifyRepo(url) {
    const name = url.split('/').pop();
    const tempDir = `/tmp/repo-scan-${Date.now()}`;

    try {
      // Shallow clone to analyze structure
      execSync(`git clone --depth 1 --single-branch ${url} ${tempDir} 2>/dev/null`, {
        stdio: 'ignore',
        timeout: 30000
      });

      const stats = this.analyzeStructure(tempDir);
      const score = this.scoreRepo(stats, name);

      return {
        url,
        name,
        status: 'ANALYZED',
        ...stats,
        adoptionScore: score,
        recommendation: score > 70 ? 'HIGH_PRIORITY' : score > 50 ? 'MEDIUM' : 'LOW'
      };
    } catch (e) {
      return {
        url,
        name,
        status: 'ERROR',
        error: e.message,
        adoptionScore: 0,
        recommendation: 'SKIP'
      };
    } finally {
      try { execSync(`rm -rf ${tempDir}`); } catch {}
    }
  }

  /**
   * Analyze repo structure and count key assets
   */
  analyzeStructure(dir) {
    const stats = {
      agents: 0,
      squads: 0,
      tasks: 0,
      workflows: 0,
      skills: 0,
      scripts: 0,
      totalFiles: 0,
      totalSize: 0,
      hasSquadYaml: false,
      hasConfig: false,
    };

    try {
      const files = execSync(`find ${dir} -type f 2>/dev/null | wc -l`).toString().trim();
      stats.totalFiles = parseInt(files) || 0;

      const size = execSync(`du -sh ${dir} 2>/dev/null | cut -f1`).toString().trim();
      stats.totalSize = size;

      // Count key files
      const agents = execSync(`find ${dir} -path "*/agents/*.md" 2>/dev/null | wc -l`).toString().trim();
      stats.agents = parseInt(agents) || 0;

      const squads = execSync(`find ${dir} -name "squad.yaml" -o -name "squad.yml" 2>/dev/null | wc -l`).toString().trim();
      stats.squads = parseInt(squads) || 0;

      const tasks = execSync(`find ${dir} -path "*/tasks/*.md" 2>/dev/null | wc -l`).toString().trim();
      stats.tasks = parseInt(tasks) || 0;

      const workflows = execSync(`find ${dir} -name "*.yaml" -path "*/workflows/*" 2>/dev/null | wc -l`).toString().trim();
      stats.workflows = parseInt(workflows) || 0;

      const scripts = execSync(`find ${dir} -path "*/scripts/*" -type f 2>/dev/null | wc -l`).toString().trim();
      stats.scripts = parseInt(scripts) || 0;

      stats.hasConfig = fs.existsSync(path.join(dir, 'config.yaml')) ||
                       fs.existsSync(path.join(dir, '.aiox-core'));
    } catch (e) {
      // Graceful degradation
    }

    return stats;
  }

  /**
   * Score repository for adoption value (0-100)
   * Factors: agents count, squads, tasks, size, completeness
   */
  scoreRepo(stats, name) {
    let score = 0;

    // Weighted factors
    score += Math.min((stats.agents / 5) * 20, 20);      // Agents: 0-20
    score += Math.min((stats.squads / 2) * 15, 15);      // Squads: 0-15
    score += Math.min((stats.tasks / 50) * 20, 20);      // Tasks: 0-20
    score += Math.min((stats.workflows / 10) * 15, 15);  // Workflows: 0-15
    score += Math.min((stats.scripts / 30) * 15, 15);    // Scripts: 0-15

    if (stats.hasConfig) score += 5;                     // Config: +5
    if (name.includes('aiox') || name.includes('squad')) score += 10; // Name bonus: +10

    return Math.min(Math.round(score), 100);
  }

  /**
   * Analyze all repos in parallel (token-efficient)
   */
  async analyzeAll() {
    const repos = await this.fetchRepoList();
    console.log(`🔍 Analyzing ${repos.length} repositories...\n`);

    const results = await Promise.all(
      repos.map(url => this.classifyRepo(url))
    );

    // Sort by adoption score
    results.sort((a, b) => b.adoptionScore - a.adoptionScore);

    return results;
  }

  /**
   * Generate priority queue for adoption
   */
  generatePriorityQueue(results) {
    const queue = {
      highPriority: results.filter(r => r.adoptionScore > 70),
      mediumPriority: results.filter(r => r.adoptionScore > 50 && r.adoptionScore <= 70),
      lowPriority: results.filter(r => r.adoptionScore <= 50),
      failed: results.filter(r => r.status === 'ERROR'),
    };

    return queue;
  }

  /**
   * Output results in adoption-ready format
   */
  reportResults(results) {
    const queue = this.generatePriorityQueue(results);

    console.log('\n📊 REPO ANALYSIS RESULTS\n');
    console.log('='.repeat(80));

    // High priority
    console.log('\n🔴 HIGH PRIORITY (Score >70)');
    queue.highPriority.forEach(r => {
      console.log(`  ✅ ${r.name.padEnd(30)} Score: ${r.adoptionScore}/100`);
      console.log(`     ${r.agents} agents | ${r.squads} squads | ${r.tasks} tasks | Size: ${r.totalSize}`);
    });

    // Medium priority
    console.log('\n🟡 MEDIUM PRIORITY (50-70)');
    queue.mediumPriority.forEach(r => {
      console.log(`  ⚠️  ${r.name.padEnd(30)} Score: ${r.adoptionScore}/100`);
    });

    // Low priority
    if (queue.lowPriority.length > 0) {
      console.log('\n🟢 LOW PRIORITY (<50)');
      queue.lowPriority.forEach(r => {
        console.log(`  ℹ️  ${r.name.padEnd(30)} Score: ${r.adoptionScore}/100`);
      });
    }

    // Failed
    if (queue.failed.length > 0) {
      console.log('\n❌ FAILED');
      queue.failed.forEach(r => {
        console.log(`  ✗ ${r.name}: ${r.error}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\nTotal analyzed: ${results.length}`);
    console.log(`Ready for adoption: ${queue.highPriority.length + queue.mediumPriority.length}`);
    console.log(`Recommended next: ${queue.highPriority[0]?.name || 'None'}`);

    return queue;
  }
}

// Run analysis
async function main() {
  const worker = new RepoAnalyzerWorker();
  const results = await worker.analyzeAll();
  const queue = worker.reportResults(results);

  // Save results for next session
  const outputFile = '/srv/aiox/docs/research/repo-analysis-queue.json';
  fs.writeFileSync(outputFile, JSON.stringify(queue, null, 2));
  console.log(`\n✅ Results saved to: ${outputFile}`);
}

main().catch(console.error);
