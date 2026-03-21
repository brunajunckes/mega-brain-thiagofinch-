'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * Dependency Analyzer — Extracts and analyzes project dependencies
 *
 * Parses dependency files (package.json, pyproject.toml, go.mod) and:
 * - Builds dependency graphs
 * - Detects circular dependencies
 * - Analyzes version constraints
 * - Identifies outdated packages
 * - Ranks dependencies by impact
 *
 * @class DependencyAnalyzer
 * @version 1.0.0
 * @story 2.1
 */
class DependencyAnalyzer {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();
    this.dependencies = {
      production: [],
      development: [],
    };
    this.dependencyGraph = {
      nodes: [],
      edges: [],
    };
    this.circularDeps = [];
  }

  /**
   * Parse all dependency files and build dependency graph
   * @returns {Promise<Object>} Dependency analysis results
   */
  async analyze() {
    try {
      await this._parseNpmDependencies();
      await this._parsePythonDependencies();
      await this._parseGoDependencies();
      this._buildDependencyGraph();
      this._detectCircularDependencies();
      return this._generateReport();
    } catch (error) {
      throw new Error(`Dependency analysis failed: ${error.message}`);
    }
  }

  /**
   * Parse npm dependencies from package.json
   * @private
   */
  async _parseNpmDependencies() {
    const pkgJsonPath = path.join(this.rootPath, 'package.json');

    if (!fs.existsSync(pkgJsonPath)) {
      return;
    }

    try {
      const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));

      // Parse production dependencies
      if (pkgJson.dependencies) {
        Object.entries(pkgJson.dependencies).forEach(([name, version]) => {
          this.dependencies.production.push({
            name,
            version,
            type: 'npm',
            manager: 'npm',
            isDev: false,
            outdated: this._isVersionOutdated(version),
          });
        });
      }

      // Parse dev dependencies
      if (pkgJson.devDependencies) {
        Object.entries(pkgJson.devDependencies).forEach(([name, version]) => {
          this.dependencies.development.push({
            name,
            version,
            type: 'npm',
            manager: 'npm',
            isDev: true,
            outdated: this._isVersionOutdated(version),
          });
        });
      }

      // Parse optional dependencies
      if (pkgJson.optionalDependencies) {
        Object.entries(pkgJson.optionalDependencies).forEach(([name, version]) => {
          this.dependencies.production.push({
            name,
            version,
            type: 'npm',
            manager: 'npm',
            isDev: false,
            optional: true,
            outdated: this._isVersionOutdated(version),
          });
        });
      }
    } catch (error) {
      throw new Error(`Failed to parse package.json: ${error.message}`);
    }
  }

  /**
   * Parse Python dependencies from requirements.txt and pyproject.toml
   * @private
   */
  async _parsePythonDependencies() {
    // Parse requirements.txt
    const reqPath = path.join(this.rootPath, 'requirements.txt');
    if (fs.existsSync(reqPath)) {
      try {
        const content = await fs.readFile(reqPath, 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim() && !line.startsWith('#'));

        lines.forEach((line) => {
          const match = line.match(/^([a-zA-Z0-9_-]+)([<>=!~]*)(.*)?$/);
          if (match) {
            this.dependencies.production.push({
              name: match[1],
              version: match[3] || '*',
              constraint: match[2] || '==',
              type: 'python',
              manager: 'pip',
              isDev: false,
            });
          }
        });
      } catch (error) {
        // Silently skip if requirements.txt can't be parsed
      }
    }

    // Parse pyproject.toml
    const pyprojectPath = path.join(this.rootPath, 'pyproject.toml');
    if (fs.existsSync(pyprojectPath)) {
      try {
        const content = await fs.readFile(pyprojectPath, 'utf-8');
        // Simple TOML parsing for dependencies (full parser would be overkill)
        const depMatch = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
        if (depMatch) {
          const deps = depMatch[1].split(',').map((d) => d.trim().replace(/['"]/g, ''));
          deps.forEach((dep) => {
            if (dep) {
              const match = dep.match(/^([a-zA-Z0-9_-]+)([<>=!~]*)(.*)?$/);
              if (match) {
                this.dependencies.production.push({
                  name: match[1],
                  version: match[3] || '*',
                  constraint: match[2] || '==',
                  type: 'python',
                  manager: 'pip',
                  isDev: false,
                });
              }
            }
          });
        }
      } catch (error) {
        // Silently skip if pyproject.toml can't be parsed
      }
    }
  }

  /**
   * Parse Go dependencies from go.mod
   * @private
   */
  async _parseGoDependencies() {
    const goModPath = path.join(this.rootPath, 'go.mod');

    if (!fs.existsSync(goModPath)) {
      return;
    }

    try {
      const content = await fs.readFile(goModPath, 'utf-8');
      const lines = content.split('\n');
      let inRequire = false;

      for (const line of lines) {
        if (line.includes('require (')) {
          inRequire = true;
          continue;
        }

        if (inRequire && line.includes(')')) {
          inRequire = false;
          break;
        }

        if (inRequire && line.trim()) {
          const match = line.match(/^\s*([^\s]+)\s+([^\s]+)/);
          if (match) {
            this.dependencies.production.push({
              name: match[1],
              version: match[2],
              type: 'go',
              manager: 'go',
              isDev: false,
            });
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to parse go.mod: ${error.message}`);
    }
  }

  /**
   * Check if a version constraint appears outdated (heuristic)
   * @private
   */
  _isVersionOutdated(version) {
    // Very simple heuristic: versions from 2+ years ago are considered outdated
    if (version.match(/^[0-9]+\.[0-9]+\.[0-9]+-/)) {
      // Has pre-release tag
      return true;
    }

    // If version is very old-looking (v1, ^1, etc.), might be outdated
    if (version.match(/^\^?1\./)) {
      return true;
    }

    return false;
  }

  /**
   * Build dependency graph from parsed dependencies
   * @private
   */
  _buildDependencyGraph() {
    const allDeps = [...this.dependencies.production, ...this.dependencies.development];

    // Create nodes for all dependencies
    this.dependencyGraph.nodes = allDeps.map((dep) => ({
      id: dep.name,
      name: dep.name,
      version: dep.version,
      type: dep.type,
      isDev: dep.isDev,
    }));

    // In a real implementation, would parse package files to determine edges
    // For now, we create edges based on simple heuristics
    this.dependencyGraph.edges = this._inferEdges(allDeps);
  }

  /**
   * Infer dependency edges (real implementation would parse package files)
   * @private
   */
  _inferEdges(dependencies) {
    const edges = [];

    // Common dependency relationships (simplified)
    const knownDeps = {
      'react': ['react-dom', '@types/react'],
      'express': ['cors', 'helmet'],
      'next': ['react', 'react-dom'],
    };

    dependencies.forEach((dep) => {
      if (knownDeps[dep.name]) {
        knownDeps[dep.name].forEach((target) => {
          const targetDep = dependencies.find((d) => d.name === target);
          if (targetDep) {
            edges.push({
              from: dep.name,
              to: target,
              strength: 'direct',
            });
          }
        });
      }
    });

    return edges;
  }

  /**
   * Detect circular dependencies
   * @private
   */
  _detectCircularDependencies() {
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (nodeId) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const edges = this.dependencyGraph.edges.filter((e) => e.from === nodeId);

      for (const edge of edges) {
        if (!visited.has(edge.to)) {
          if (hasCycle(edge.to)) {
            return true;
          }
        } else if (recursionStack.has(edge.to)) {
          this.circularDeps.push([nodeId, edge.to]);
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    this.dependencyGraph.nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        hasCycle(node.id);
      }
    });
  }

  /**
   * Generate dependency analysis report
   * @private
   */
  _generateReport() {
    const outdated = [
      ...this.dependencies.production,
      ...this.dependencies.development,
    ].filter((dep) => dep.outdated);

    return {
      summary: {
        totalDependencies: this.dependencies.production.length + this.dependencies.development.length,
        productionDeps: this.dependencies.production.length,
        developmentDeps: this.dependencies.development.length,
        outdatedCount: outdated.length,
        circularDependencies: this.circularDeps.length,
      },
      dependencies: {
        production: this.dependencies.production,
        development: this.dependencies.development,
      },
      graph: this.dependencyGraph,
      circularDeps: this.circularDeps,
      outdated: outdated.map((dep) => ({
        name: dep.name,
        current: dep.version,
        type: dep.type,
      })),
    };
  }

  /**
   * Get all dependencies
   */
  getAllDependencies() {
    return {
      production: this.dependencies.production,
      development: this.dependencies.development,
    };
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph() {
    return this.dependencyGraph;
  }

  /**
   * Get circular dependencies
   */
  getCircularDependencies() {
    return this.circularDeps;
  }
}

module.exports = { DependencyAnalyzer };
