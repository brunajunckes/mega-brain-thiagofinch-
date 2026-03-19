'use strict';

const fs = require('fs-extra');
const path = require('path');

/**
 * Repository Scanner — Analyzes project structure and extracts metadata
 *
 * Scans directories to detect:
 * - Programming languages used
 * - Frameworks and runtimes
 * - Project structure (files, directories)
 * - Lines of code per language
 * - File statistics
 *
 * @class RepoScanner
 * @version 1.0.0
 * @story 2.1
 */
class RepoScanner {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();
    this.ignoredDirs = new Set([
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      'venv',
      '__pycache__',
      '.pytest_cache',
      'coverage',
      '.vscode',
      '.idea',
      'target',
    ]);
    this.ignoredFiles = new Set(['.DS_Store', 'Thumbs.db', '.gitignore', '.env']);
    this.fileStats = {};
    this.languages = {};
    this.frameworks = [];
    this.fileTree = {};
  }

  /**
   * Scan directory recursively and collect statistics
   * @returns {Promise<Object>} Scan results
   */
  async scan() {
    try {
      await this._scanDirectory(this.rootPath);
      this._detectFrameworks();
      return this._generateReport();
    } catch (error) {
      throw new Error(`Scan failed: ${error.message}`);
    }
  }

  /**
   * Scan directory recursively
   * @private
   * @param {string} dir Directory to scan
   * @param {string} relativePath Path relative to root
   */
  async _scanDirectory(dir, relativePath = '') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;

        if (entry.isDirectory()) {
          if (!this.ignoredDirs.has(entry.name)) {
            await this._scanDirectory(fullPath, relPath);
          }
        } else if (entry.isFile()) {
          if (!this.ignoredFiles.has(entry.name)) {
            await this._analyzeFile(fullPath, relPath, entry.name);
          }
        }
      }
    } catch (error) {
      // Silently skip inaccessible directories
      if (error.code !== 'EACCES') {
        throw error;
      }
    }
  }

  /**
   * Analyze individual file
   * @private
   */
  async _analyzeFile(fullPath, relPath, fileName) {
    try {
      const ext = path.extname(fileName).toLowerCase();
      const language = this._getLanguageFromExt(ext);

      if (!language) {
        return; // Skip unknown file types
      }

      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n').filter((line) => line.trim().length > 0).length;

      // Track language statistics
      if (!this.languages[language]) {
        this.languages[language] = {
          files: 0,
          loc: 0,
          bytes: 0,
          exts: new Set(),
        };
      }

      this.languages[language].files += 1;
      this.languages[language].loc += lines;
      this.languages[language].bytes += stats.size;
      this.languages[language].exts.add(ext);

      // Track file statistics
      this.fileStats[relPath] = {
        language,
        loc: lines,
        bytes: stats.size,
        ext,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      // Skip files that can't be read
      if (error.code !== 'ENOENT' && error.code !== 'EACCES') {
        throw error;
      }
    }
  }

  /**
   * Map file extension to language
   * @private
   */
  _getLanguageFromExt(ext) {
    const map = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.go': 'Go',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.rust': 'Rust',
      '.rs': 'Rust',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.sh': 'Shell',
      '.bash': 'Shell',
      '.yml': 'YAML',
      '.yaml': 'YAML',
      '.json': 'JSON',
      '.xml': 'XML',
      '.html': 'HTML',
      '.htm': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.less': 'LESS',
      '.sql': 'SQL',
      '.md': 'Markdown',
    };

    return map[ext];
  }

  /**
   * Detect frameworks from package files and imports
   * @private
   */
  _detectFrameworks() {
    const frameworks = new Set();

    // Detect from package.json if available
    const packageJsonPath = path.join(this.rootPath, 'package.json');
    try {
      if (fs.existsSync(packageJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };

        if (allDeps['react']) frameworks.add('React');
        if (allDeps['vue']) frameworks.add('Vue');
        if (allDeps['next']) frameworks.add('Next.js');
        if (allDeps['express']) frameworks.add('Express');
        if (allDeps['fastify']) frameworks.add('Fastify');
        if (allDeps['jest']) frameworks.add('Jest');
        if (allDeps['mocha']) frameworks.add('Mocha');
        if (allDeps['typescript']) frameworks.add('TypeScript');
        if (allDeps['graphql']) frameworks.add('GraphQL');
        if (allDeps['prisma']) frameworks.add('Prisma');
        if (allDeps['sequelize']) frameworks.add('Sequelize');
      }
    } catch (error) {
      // Silently skip if package.json can't be read
    }

    // Detect Node.js runtime
    if (this.languages['JavaScript'] || this.languages['TypeScript']) {
      if (fs.existsSync(path.join(this.rootPath, 'package.json'))) {
        frameworks.add('Node.js');
      }
    }

    // Detect Python runtime
    if (this.languages['Python']) {
      if (
        fs.existsSync(path.join(this.rootPath, 'requirements.txt'))
        || fs.existsSync(path.join(this.rootPath, 'pyproject.toml'))
        || fs.existsSync(path.join(this.rootPath, 'Pipfile'))
      ) {
        frameworks.add('Python');
      }
    }

    // Detect Go runtime
    if (this.languages['Go']) {
      if (fs.existsSync(path.join(this.rootPath, 'go.mod'))) {
        frameworks.add('Go');
      }
    }

    this.frameworks = Array.from(frameworks);
  }

  /**
   * Generate scan report
   * @private
   */
  _generateReport() {
    const totalLoc = Object.values(this.languages).reduce((sum, lang) => sum + lang.loc, 0);
    const totalFiles = Object.values(this.languages).reduce((sum, lang) => sum + lang.files, 0);
    const totalBytes = Object.values(this.languages).reduce((sum, lang) => sum + lang.bytes, 0);

    // Convert Sets to Arrays for serialization
    const languagesReport = {};
    Object.entries(this.languages).forEach(([lang, stats]) => {
      languagesReport[lang] = {
        files: stats.files,
        loc: stats.loc,
        bytes: stats.bytes,
        percentage: totalLoc > 0 ? Math.round((stats.loc / totalLoc) * 100) : 0,
        extensions: Array.from(stats.exts),
      };
    });

    return {
      repository: {
        path: this.rootPath,
        name: path.basename(this.rootPath),
        scannedAt: new Date().toISOString(),
      },
      summary: {
        totalFiles,
        totalLoc,
        totalBytes,
        languages: Object.keys(languagesReport).length,
        frameworks: this.frameworks.length,
      },
      languages: languagesReport,
      frameworks: this.frameworks,
      fileStats: this.fileStats,
    };
  }

  /**
   * Get language breakdown
   */
  getLanguages() {
    return Object.entries(this.languages).map(([name, stats]) => ({
      name,
      files: stats.files,
      loc: stats.loc,
    }));
  }

  /**
   * Get detected frameworks
   */
  getFrameworks() {
    return this.frameworks;
  }

  /**
   * Get total lines of code
   */
  getTotalLoc() {
    return Object.values(this.languages).reduce((sum, lang) => sum + lang.loc, 0);
  }

  /**
   * Get total file count
   */
  getTotalFiles() {
    return Object.values(this.languages).reduce((sum, lang) => sum + lang.files, 0);
  }
}

module.exports = { RepoScanner };
