'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * Pattern Detector — Identifies code and architecture patterns
 *
 * Detects:
 * - Architecture patterns (MVC, Layered, Modular, Monolithic)
 * - API patterns (REST, GraphQL, gRPC)
 * - Database patterns (ORM, raw SQL, migrations)
 * - Code abstractions (middleware, interceptors, guards)
 * - CLI structure (if present)
 *
 * Uses heuristics and confidence scoring (0-1.0)
 *
 * @class PatternDetector
 * @version 1.0.0
 * @story 2.1
 */
class PatternDetector {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();
    this.fileTree = options.fileTree || {};
    this.detectedPatterns = {};
  }

  /**
   * Detect all patterns
   * @returns {Promise<Object>} Detected patterns with confidence scores
   */
  async detect() {
    try {
      this._detectArchitecturePatterns();
      this._detectAPIPatterns();
      this._detectDatabasePatterns();
      this._detectAbstractions();
      this._detectCLIStructure();
      return this._generateReport();
    } catch (error) {
      throw new Error(`Pattern detection failed: ${error.message}`);
    }
  }

  /**
   * Detect architecture patterns
   * @private
   */
  _detectArchitecturePatterns() {
    const patterns = {
      mvc: this._scoreMVCPattern(),
      layered: this._scoreLayeredPattern(),
      modular: this._scoreModularPattern(),
      monolithic: this._scoreMonolithicPattern(),
    };

    this.detectedPatterns.architecture = this._selectBestPattern(patterns);
  }

  /**
   * Score MVC pattern (Model-View-Controller)
   * @private
   */
  _scoreMVCPattern() {
    let score = 0;
    const evidence = [];

    // Check for models, views, controllers directories
    if (this._directoryExists('models') || this._directoryExists('models')) {
      score += 0.25;
      evidence.push('models directory');
    }
    if (this._directoryExists('views') || this._directoryExists('templates')) {
      score += 0.25;
      evidence.push('views/templates directory');
    }
    if (this._directoryExists('controllers') || this._directoryExists('handlers')) {
      score += 0.25;
      evidence.push('controllers/handlers directory');
    }

    // Check for routes
    if (this._fileExists('routes.js') || this._directoryExists('routes')) {
      score += 0.15;
      evidence.push('routes file/directory');
    }

    // Check for common MVC files
    if (this._fileExists('app.js') || this._fileExists('server.js')) {
      score += 0.10;
      evidence.push('app/server entry point');
    }

    return {
      name: 'MVC',
      score: Math.min(score, 1.0),
      evidence,
    };
  }

  /**
   * Score Layered pattern
   * @private
   */
  _scoreLayeredPattern() {
    let score = 0;
    const evidence = [];

    // Check for layer-like directories
    const layers = ['api', 'application', 'domain', 'infrastructure', 'presentation'];
    const foundLayers = layers.filter((layer) => this._directoryExists(layer));

    if (foundLayers.length >= 2) {
      score += 0.4;
      evidence.push(`found ${foundLayers.length} layer directories`);
    }

    // Check for separation patterns
    if (this._directoryExists('services') && this._directoryExists('repositories')) {
      score += 0.3;
      evidence.push('services and repositories');
    }

    // Check for utility/helper structure
    if (this._directoryExists('utils') || this._directoryExists('helpers')) {
      score += 0.2;
      evidence.push('utils/helpers directory');
    }

    if (this._directoryExists('config')) {
      score += 0.1;
      evidence.push('config directory');
    }

    return {
      name: 'Layered',
      score: Math.min(score, 1.0),
      evidence,
    };
  }

  /**
   * Score Modular pattern
   * @private
   */
  _scoreModularPattern() {
    let score = 0;
    const evidence = [];

    // Check for feature/module directories
    const modules = ['modules', 'features', 'packages'];
    const foundModules = modules.filter((m) => this._directoryExists(m));

    if (foundModules.length > 0) {
      score += 0.3;
      evidence.push(`found ${foundModules[0]} directory`);
    }

    // Check for index.js pattern (module exports)
    const jsFiles = this._findFiles('.js');
    const indexFiles = jsFiles.filter((f) => f.endsWith('index.js')).length;
    if (indexFiles > 5) {
      score += 0.3;
      evidence.push(`${indexFiles} index.js files (module pattern)`);
    }

    // Check for clear boundaries (separate package.json per module)
    const packageJsons = this._findFiles('package.json').length;
    if (packageJsons > 1) {
      score += 0.2;
      evidence.push(`${packageJsons} package.json files (monorepo)`);
    }

    // Check for workspace configuration
    if (this._fileExists('lerna.json') || this._fileExists('pnpm-workspace.yaml')) {
      score += 0.2;
      evidence.push('monorepo configuration');
    }

    return {
      name: 'Modular',
      score: Math.min(score, 1.0),
      evidence,
    };
  }

  /**
   * Score Monolithic pattern
   * @private
   */
  _scoreMonolithicPattern() {
    let score = 0;
    const evidence = [];

    // Single entry point
    if ((this._fileExists('app.js') || this._fileExists('server.js')) && !this._directoryExists('modules')) {
      score += 0.3;
      evidence.push('single entry point, no modules');
    }

    // Large src directory
    const srcDir = this._directoryExists('src');
    if (srcDir) {
      score += 0.2;
      evidence.push('single src directory');
    }

    // Few separate modules
    const modules = ['modules', 'features', 'packages'];
    const foundModules = modules.filter((m) => this._directoryExists(m)).length;
    if (foundModules === 0) {
      score += 0.2;
      evidence.push('no module separation');
    }

    // Complex routing
    const routeFiles = this._findFiles('route');
    if (routeFiles.length > 10) {
      score += 0.3;
      evidence.push(`${routeFiles.length} route files`);
    }

    return {
      name: 'Monolithic',
      score: Math.min(score, 1.0),
      evidence,
    };
  }

  /**
   * Detect API patterns
   * @private
   */
  _detectAPIPatterns() {
    const patterns = {};

    // REST pattern
    if (this._fileExists('package.json')) {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(this.rootPath, 'package.json'), 'utf-8'));
      const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

      if (allDeps['express'] || allDeps['fastify']) {
        patterns.rest = { detected: true, confidence: 0.95 };
      }

      if (allDeps['graphql']) {
        patterns.graphql = { detected: true, confidence: 0.90 };
      }

      if (allDeps['grpc'] || allDeps['@grpc/grpc-js']) {
        patterns.grpc = { detected: true, confidence: 0.90 };
      }
    }

    this.detectedPatterns.api = patterns;
  }

  /**
   * Detect database patterns
   * @private
   */
  _detectDatabasePatterns() {
    const patterns = {};

    if (this._fileExists('package.json')) {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(this.rootPath, 'package.json'), 'utf-8'));
      const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

      // ORM patterns
      if (allDeps['prisma']) {
        patterns.prisma = { detected: true, confidence: 0.95 };
      }
      if (allDeps['sequelize']) {
        patterns.sequelize = { detected: true, confidence: 0.95 };
      }
      if (allDeps['typeorm']) {
        patterns.typeorm = { detected: true, confidence: 0.95 };
      }

      // Raw SQL
      if (allDeps['pg'] || allDeps['mysql2'] || allDeps['sqlite3']) {
        patterns.rawSql = { detected: true, confidence: 0.85 };
      }
    }

    // Check for migrations
    if (this._directoryExists('migrations') || this._directoryExists('db')) {
      patterns.migrations = { detected: true, confidence: 0.80 };
    }

    this.detectedPatterns.database = patterns;
  }

  /**
   * Detect code abstractions
   * @private
   */
  _detectAbstractions() {
    const patterns = {};

    // Middleware pattern
    if (this._directoryExists('middleware') || this._findFiles('middleware').length > 2) {
      patterns.middleware = { detected: true, confidence: 0.85 };
    }

    // Interceptors
    if (this._findFiles('interceptor').length > 2) {
      patterns.interceptors = { detected: true, confidence: 0.80 };
    }

    // Guards/Auth
    if (this._directoryExists('guards') || this._findFiles('guard').length > 1) {
      patterns.guards = { detected: true, confidence: 0.80 };
    }

    // Decorators (TypeScript)
    const tsFiles = this._findFiles('.ts');
    const hasDecorators = tsFiles.some((f) => {
      try {
        const content = fs.readFileSync(path.join(this.rootPath, f), 'utf-8');
        return content.includes('@');
      } catch {
        return false;
      }
    });
    if (hasDecorators) {
      patterns.decorators = { detected: true, confidence: 0.75 };
    }

    this.detectedPatterns.abstractions = patterns;
  }

  /**
   * Detect CLI structure
   * @private
   */
  _detectCLIStructure() {
    const hasCLI = this._directoryExists('cli') || this._fileExists('cli.js') || this._fileExists('bin/index.js');

    this.detectedPatterns.cli = {
      detected: hasCLI,
      confidence: hasCLI ? 0.90 : 0.0,
    };
  }

  /**
   * Select best pattern from scored patterns
   * @private
   */
  _selectBestPattern(patterns) {
    let best = null;
    let maxScore = 0;

    Object.entries(patterns).forEach(([name, pattern]) => {
      if (pattern.score > maxScore) {
        maxScore = pattern.score;
        best = pattern;
      }
    });

    return best || { name: 'Unknown', score: 0, evidence: [] };
  }

  /**
   * Check if directory exists
   * @private
   */
  _directoryExists(dirName) {
    const fullPath = path.join(this.rootPath, dirName);
    try {
      const stat = fs.statSync(fullPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check if file exists
   * @private
   */
  _fileExists(fileName) {
    const fullPath = path.join(this.rootPath, fileName);
    try {
      return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
    } catch {
      return false;
    }
  }

  /**
   * Find files by pattern
   * @private
   */
  _findFiles(pattern) {
    try {
      // Simple implementation: just list files and filter
      const files = [];
      const traverse = (dir) => {
        try {
          const entries = fs.readdirSync(dir);
          entries.forEach((entry) => {
            if (['node_modules', '.git', 'dist', 'build'].includes(entry)) {
              return;
            }
            const fullPath = path.join(dir, entry);
            if (fs.statSync(fullPath).isDirectory()) {
              traverse(fullPath);
            } else if (entry.includes(pattern)) {
              files.push(path.relative(this.rootPath, fullPath));
            }
          });
        } catch {
          // Skip inaccessible directories
        }
      };

      traverse(this.rootPath);
      return files;
    } catch {
      return [];
    }
  }

  /**
   * Generate detection report
   * @private
   */
  _generateReport() {
    return {
      timestamp: new Date().toISOString(),
      patterns: {
        architecture: this.detectedPatterns.architecture,
        api: this.detectedPatterns.api || {},
        database: this.detectedPatterns.database || {},
        abstractions: this.detectedPatterns.abstractions || {},
        cli: this.detectedPatterns.cli || { detected: false },
      },
    };
  }

  /**
   * Get detected patterns
   */
  getPatterns() {
    return this.detectedPatterns;
  }

  /**
   * Get architecture pattern
   */
  getArchitecturePattern() {
    return this.detectedPatterns.architecture;
  }
}

module.exports = { PatternDetector };
