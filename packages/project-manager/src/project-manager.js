'use strict';

const fs = require('fs');
const path = require('path');
const { DriveExtractor } = require('../../../packages/google-drive-worker/src');

/**
 * ProjectManager — Auto-save project state with Drive integration
 *
 * Features:
 * - Auto-save on any field change
 * - Google Drive file integration
 * - Metadata extraction from Drive URLs
 * - File type detection
 * - Project versioning
 *
 * @class ProjectManager
 * @version 1.0.0
 */
class ProjectManager {
  constructor(projectsDir = './projects') {
    this.projectsDir = projectsDir;
    this.ensureDir(projectsDir);
    this.projects = this.loadAll();
  }

  /**
   * Create new project with auto-save
   * @param {Object} data Project initial data
   * @returns {Object} Created project
   */
  createProject(data = {}) {
    const projectId = this.generateId();
    const now = new Date().toISOString();

    const project = {
      id: projectId,
      title: data.title || '',
      description: data.description || '',
      driveUrl: data.driveUrl || null,
      driveFileId: null,
      driveFileInfo: null,
      fileType: null,
      createdAt: now,
      updatedAt: now,
      files: [],
      metadata: {},
    };

    // Add to projects array first
    this.projects.push(project);

    // Process Drive URL if provided
    if (data.driveUrl) {
      this.updateProject(projectId, { driveUrl: data.driveUrl });
    } else {
      // Save if no Drive URL (updateProject saves internally)
      this.save(project);
    }

    return project;
  }

  /**
   * Update project with auto-save
   * @param {string} projectId Project ID
   * @param {Object} updates Fields to update
   * @returns {Object} Updated project
   */
  updateProject(projectId, updates) {
    const project = this.getProject(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const now = new Date().toISOString();
    Object.assign(project, updates, { updatedAt: now });

    // Process Drive URL if updated
    if (updates.driveUrl) {
      const fileId = DriveExtractor.extractFileId(updates.driveUrl);
      const fileInfo = DriveExtractor.parseUrl(updates.driveUrl);

      project.driveFileId = fileId;
      project.driveFileInfo = fileInfo;
      project.fileType = this.detectFileType(fileInfo.type);
      project.metadata = {
        url: updates.driveUrl,
        extractedAt: now,
        type: fileInfo.type,
        isNativeDocument: fileInfo.isDoc || fileInfo.isSheet || fileInfo.isSlide,
      };
    }

    // Auto-save
    this.save(project);
    return project;
  }

  /**
   * Get project by ID
   * @param {string} projectId Project ID
   * @returns {Object|null} Project or null
   */
  getProject(projectId) {
    return this.projects.find(p => p.id === projectId) || null;
  }

  /**
   * List all projects
   * @param {Object} filter Filter criteria
   * @returns {Array} Filtered projects
   */
  listProjects(filter = {}) {
    let projects = [...this.projects];

    if (filter.fileType) {
      projects = projects.filter(p => p.fileType === filter.fileType);
    }

    if (filter.hasDrive) {
      projects = projects.filter(p => p.driveUrl !== null);
    }

    if (filter.search) {
      const query = filter.search.toLowerCase();
      projects = projects.filter(p =>
        p.title.toLowerCase().includes(query)
        || p.description.toLowerCase().includes(query)
      );
    }

    return projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * Delete project
   * @param {string} projectId Project ID
   * @returns {boolean} Success
   */
  deleteProject(projectId) {
    const idx = this.projects.findIndex(p => p.id === projectId);
    if (idx === -1) return false;

    const project = this.projects[idx];
    const filePath = this.getFilePath(projectId);

    // Remove from memory
    this.projects.splice(idx, 1);

    // Remove file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return true;
  }

  /**
   * Export project to JSON
   * @param {string} projectId Project ID
   * @returns {string} JSON string
   */
  exportProject(projectId) {
    const project = this.getProject(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    return JSON.stringify(project, null, 2);
  }

  /**
   * Import project from JSON
   * @param {string} jsonData JSON string
   * @returns {Object} Imported project
   */
  importProject(jsonData) {
    const project = JSON.parse(jsonData);

    // Validate required fields
    if (!project.id || !project.title) {
      throw new Error('Invalid project format: missing id or title');
    }

    this.save(project);
    this.projects.push(project);

    return project;
  }

  /**
   * Detect file type from Drive type
   * @private
   */
  detectFileType(driveType) {
    const typeMap = {
      document: 'document',
      spreadsheet: 'spreadsheet',
      presentation: 'presentation',
      file: 'generic',
      folder: 'folder',
    };

    return typeMap[driveType] || 'unknown';
  }

  /**
   * Save project to disk
   * @private
   */
  save(project) {
    const filePath = this.getFilePath(project.id);
    const data = JSON.stringify(project, null, 2);
    fs.writeFileSync(filePath, data, 'utf8');
  }

  /**
   * Load all projects from disk
   * @private
   */
  loadAll() {
    if (!fs.existsSync(this.projectsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.projectsDir);
    const projects = [];

    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(this.projectsDir, file);
          const data = fs.readFileSync(filePath, 'utf8');
          projects.push(JSON.parse(data));
        } catch (error) {
          console.error(`Error loading project ${file}:`, error.message);
        }
      }
    });

    return projects;
  }

  /**
   * Get file path for project
   * @private
   */
  getFilePath(projectId) {
    return path.join(this.projectsDir, `${projectId}.json`);
  }

  /**
   * Generate unique project ID
   * @private
   */
  generateId() {
    return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure directory exists
   * @private
   */
  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Get project statistics
   * @returns {Object} Stats
   */
  getStats() {
    return {
      totalProjects: this.projects.length,
      withDriveUrl: this.projects.filter(p => p.driveUrl).length,
      byFileType: this.projects.reduce((acc, p) => {
        acc[p.fileType || 'unknown'] = (acc[p.fileType || 'unknown'] || 0) + 1;
        return acc;
      }, {}),
      lastModified: this.projects.length > 0
        ? new Date(Math.max(...this.projects.map(p => new Date(p.updatedAt))))
        : null,
    };
  }

  /**
   * Watch project for changes and auto-save
   * @param {string} projectId Project ID
   * @param {Function} callback Callback on change
   * @returns {Function} Unwatch function
   */
  watch(projectId, callback) {
    const filePath = this.getFilePath(projectId);
    let debounceTimer;

    const watcher = fs.watch(filePath, () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const project = this.getProject(projectId);
        callback(project);
      }, 300);
    });

    return () => watcher.close();
  }
}

module.exports = ProjectManager;
