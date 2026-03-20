'use strict';

const fs = require('fs');
const path = require('path');
const ProjectManager = require('../project-manager');

describe('ProjectManager', () => {
  let manager;
  const testDir = path.join(__dirname, '../.test-projects');

  beforeEach(() => {
    // Clean test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    manager = new ProjectManager(testDir);
  });

  afterEach(() => {
    // Clean up
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('createProject', () => {
    test('should create project with title', () => {
      const project = manager.createProject({
        title: 'Test Project',
      });

      expect(project).toHaveProperty('id');
      expect(project.title).toBe('Test Project');
      expect(project).toHaveProperty('createdAt');
      expect(project).toHaveProperty('updatedAt');
    });

    test('should create project with all fields', () => {
      const project = manager.createProject({
        title: 'BookMe',
        description: 'Book writing platform',
        driveUrl: 'https://drive.google.com/file/d/1ABC123DEF456GHI789JKL12/view',
      });

      expect(project.title).toBe('BookMe');
      expect(project.description).toBe('Book writing platform');
      expect(project.driveFileId).toBe('1ABC123DEF456GHI789JKL12');
      expect(project.fileType).toBe('generic');
    });

    test('should auto-save to disk', () => {
      const project = manager.createProject({
        title: 'Test',
      });

      const filePath = path.join(testDir, `${project.id}.json`);
      expect(fs.existsSync(filePath)).toBe(true);

      const saved = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(saved.id).toBe(project.id);
      expect(saved.title).toBe('Test');
    });
  });

  describe('updateProject', () => {
    test('should update project fields', () => {
      const project = manager.createProject({ title: 'Original' });
      const updated = manager.updateProject(project.id, {
        title: 'Updated',
        description: 'New description',
      });

      expect(updated.title).toBe('Updated');
      expect(updated.description).toBe('New description');
    });

    test('should auto-save updates to disk', () => {
      const project = manager.createProject({ title: 'Original' });
      manager.updateProject(project.id, { title: 'Updated' });

      const filePath = path.join(testDir, `${project.id}.json`);
      const saved = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(saved.title).toBe('Updated');
    });

    test('should extract Drive metadata on URL update', () => {
      const project = manager.createProject({ title: 'Test' });
      const updated = manager.updateProject(project.id, {
        driveUrl: 'https://docs.google.com/document/d/1ABC123DEF456GHI789JKL12/edit',
      });

      expect(updated.driveFileId).toBe('1ABC123DEF456GHI789JKL12');
      expect(updated.fileType).toBe('document');
      expect(updated.metadata.isNativeDocument).toBe(true);
    });

    test('should update timestamp on modification', () => {
      const project = manager.createProject({ title: 'Test' });
      const originalTime = new Date(project.updatedAt);

      // Wait a bit to ensure time difference
      const updated = manager.updateProject(project.id, {
        title: 'Updated',
      });

      const newTime = new Date(updated.updatedAt);
      expect(newTime.getTime()).toBeGreaterThan(originalTime.getTime());
    });
  });

  describe('getProject', () => {
    test('should retrieve project by ID', () => {
      const created = manager.createProject({ title: 'Test' });
      const retrieved = manager.getProject(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.title).toBe('Test');
    });

    test('should return null for non-existent project', () => {
      const project = manager.getProject('non-existent');
      expect(project).toBeNull();
    });
  });

  describe('listProjects', () => {
    test('should list all projects', () => {
      manager.createProject({ title: 'Project 1' });
      manager.createProject({ title: 'Project 2' });
      manager.createProject({ title: 'Project 3' });

      const projects = manager.listProjects();
      expect(projects.length).toBe(3);
    });

    test('should filter by file type', () => {
      manager.createProject({
        title: 'Doc',
        driveUrl: 'https://docs.google.com/document/d/1ABC/edit',
      });

      manager.createProject({
        title: 'Sheet',
        driveUrl: 'https://docs.google.com/spreadsheets/d/1ABC/edit',
      });

      const docs = manager.listProjects({ fileType: 'document' });
      expect(docs.length).toBe(1);
      expect(docs[0].title).toBe('Doc');
    });

    test('should filter by hasDrive flag', () => {
      manager.createProject({ title: 'With Drive', driveUrl: 'https://drive.google.com/file/d/1ABC/view' });
      manager.createProject({ title: 'Without Drive' });

      const withDrive = manager.listProjects({ hasDrive: true });
      expect(withDrive.length).toBe(1);
      expect(withDrive[0].title).toBe('With Drive');
    });

    test('should search by title', () => {
      manager.createProject({ title: 'BookMe v1' });
      manager.createProject({ title: 'BookMe v2' });
      manager.createProject({ title: 'Other Project' });

      const results = manager.listProjects({ search: 'BookMe' });
      expect(results.length).toBe(2);
    });

    test('should sort by updatedAt descending', () => {
      const p1 = manager.createProject({ title: 'First' });
      const p2 = manager.createProject({ title: 'Second' });

      const projects = manager.listProjects();
      expect(projects[0].id).toBe(p2.id); // Newest first
      expect(projects[1].id).toBe(p1.id);
    });
  });

  describe('deleteProject', () => {
    test('should delete project', () => {
      const project = manager.createProject({ title: 'Test' });
      const success = manager.deleteProject(project.id);

      expect(success).toBe(true);
      expect(manager.getProject(project.id)).toBeNull();
    });

    test('should remove file from disk', () => {
      const project = manager.createProject({ title: 'Test' });
      const filePath = path.join(testDir, `${project.id}.json`);

      expect(fs.existsSync(filePath)).toBe(true);
      manager.deleteProject(project.id);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    test('should return false for non-existent project', () => {
      const success = manager.deleteProject('non-existent');
      expect(success).toBe(false);
    });
  });

  describe('exportProject', () => {
    test('should export project to JSON', () => {
      const project = manager.createProject({
        title: 'Test',
        description: 'Test Description',
      });

      const json = manager.exportProject(project.id);
      const exported = JSON.parse(json);

      expect(exported.id).toBe(project.id);
      expect(exported.title).toBe('Test');
      expect(exported.description).toBe('Test Description');
    });

    test('should throw error for non-existent project', () => {
      expect(() => {
        manager.exportProject('non-existent');
      }).toThrow('Project not found');
    });
  });

  describe('importProject', () => {
    test('should import project from JSON', () => {
      const original = manager.createProject({ title: 'Original' });
      const json = manager.exportProject(original.id);

      // Create new manager to simulate fresh import
      const newManager = new ProjectManager(testDir);
      const imported = newManager.importProject(json);

      expect(imported.id).toBe(original.id);
      expect(imported.title).toBe('Original');
    });

    test('should save imported project to disk', () => {
      const original = manager.createProject({ title: 'Original' });
      const json = manager.exportProject(original.id);

      const newManager = new ProjectManager(testDir);
      const imported = newManager.importProject(json);

      const filePath = path.join(testDir, `${imported.id}.json`);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    test('should throw error for invalid JSON', () => {
      expect(() => {
        manager.importProject('invalid json');
      }).toThrow();
    });
  });

  describe('getStats', () => {
    test('should return statistics', () => {
      manager.createProject({ title: 'Project 1' });
      manager.createProject({
        title: 'Project 2',
        driveUrl: 'https://drive.google.com/file/d/1ABC/view',
      });

      const stats = manager.getStats();
      expect(stats.totalProjects).toBe(2);
      expect(stats.withDriveUrl).toBe(1);
    });

    test('should count by file type', () => {
      manager.createProject({
        title: 'Doc',
        driveUrl: 'https://docs.google.com/document/d/1ABC/edit',
      });

      manager.createProject({
        title: 'Sheet',
        driveUrl: 'https://docs.google.com/spreadsheets/d/1ABC/edit',
      });

      const stats = manager.getStats();
      expect(stats.byFileType.document).toBe(1);
      expect(stats.byFileType.spreadsheet).toBe(1);
    });
  });

  describe('loadAll', () => {
    test('should load all projects from disk', () => {
      manager.createProject({ title: 'Project 1' });
      manager.createProject({ title: 'Project 2' });

      const newManager = new ProjectManager(testDir);
      expect(newManager.projects.length).toBe(2);
    });
  });
});
