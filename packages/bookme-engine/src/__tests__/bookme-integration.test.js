'use strict';

const fs = require('fs');
const path = require('path');
const { BookProcessor, BookExporter, BookIntegrator } = require('../index');
const { ProjectManager } = require('../../../project-manager/src');
const { DriveExtractor, DriveDownloader } = require('../../../google-drive-worker/src');

describe('BookMe Full Integration', () => {
  let tempDir;
  let projectsDir;
  let pm;
  let integrator;

  beforeEach(() => {
    tempDir = path.join(__dirname, '.test-bookme-' + Date.now());
    projectsDir = path.join(tempDir, 'projects');
    fs.mkdirSync(projectsDir, { recursive: true });
    pm = new ProjectManager(projectsDir);
    // Create BookIntegrator with custom projectsDir to match test PM
    integrator = new BookIntegrator(tempDir);
    // Override BookIntegrator's ProjectManager to use the test PM
    integrator.pm = pm;
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('BookProcessor', () => {
    test('creates book with proper structure', () => {
      const book = BookProcessor.createBook({
        title: 'Test Novel',
        author: 'Test Author',
        description: 'A test novel',
        content: '',
      });

      expect(book).toBeDefined();
      expect(book.id).toMatch(/^book_/);
      expect(book.title).toBe('Test Novel');
      expect(book.author).toBe('Test Author');
      expect(book.chapters).toEqual([]);
      expect(book.metadata.chapterCount).toBe(0);
      expect(book.metadata.wordCount).toBe(0);
    });

    test('processes content with automatic chapter detection', () => {
      const content = `# Chapter 1: Beginning
## Section 1.1
This is the opening section with some content here.

## Section 1.2
More content in the second section.

# Chapter 2: Middle
## Section 2.1
The story continues in chapter two.

Content goes here and continues.`;

      const book = BookProcessor.createBook({
        title: 'Multi-Chapter Book',
        author: 'Writer',
        description: 'Test book',
      });

      BookProcessor.processContent(book, content);

      expect(book.metadata.chapterCount).toBe(2);
      expect(book.chapters.length).toBe(2);
      expect(book.chapters[0].title).toBe('Beginning');
      expect(book.chapters[0].sections.length).toBe(2);
      expect(book.chapters[1].title).toBe('Middle');
      expect(book.metadata.wordCount).toBeGreaterThan(0);
    });

    test('adds chapters programmatically', () => {
      const book = BookProcessor.createBook({
        title: 'Book',
        author: 'Author',
        description: 'Test',
      });

      BookProcessor.addChapter(book, 'New Chapter', 'Chapter content here.');

      expect(book.chapters.length).toBe(1);
      expect(book.chapters[0].title).toBe('New Chapter');
      expect(book.metadata.chapterCount).toBe(1);
    });

    test('edits chapters and sections', () => {
      const book = BookProcessor.createBook({
        title: 'Book',
        author: 'Author',
        description: 'Test',
      });

      BookProcessor.addChapter(book, 'Chapter 1', 'Content');
      const chapterId = book.chapters[0].id;

      BookProcessor.editChapter(book, chapterId, {
        title: 'Edited Chapter',
        content: 'New content',
      });

      expect(book.chapters[0].title).toBe('Edited Chapter');

      // Get section ID after editing (new sections were created)
      const sectionId = book.chapters[0].sections[0].id;

      BookProcessor.editSection(book, chapterId, sectionId, {
        content: 'Updated section content',
      });

      expect(book.chapters[0].sections[0].content).toBe('Updated section content');
    });

    test('deletes chapters', () => {
      const book = BookProcessor.createBook({
        title: 'Book',
        author: 'Author',
        description: 'Test',
      });

      BookProcessor.addChapter(book, 'Chapter 1', 'Content 1');
      BookProcessor.addChapter(book, 'Chapter 2', 'Content 2');

      const chapterId = book.chapters[0].id;
      BookProcessor.deleteChapter(book, chapterId);

      expect(book.chapters.length).toBe(1);
      expect(book.metadata.chapterCount).toBe(1);
    });
  });

  describe('BookExporter', () => {
    let book;

    beforeEach(() => {
      book = BookProcessor.createBook({
        title: 'Export Test',
        author: 'Author',
        description: 'Testing export',
      });

      BookProcessor.processContent(book, `# Chapter 1
## Section 1
Content here.

# Chapter 2
Content continues.`);
    });

    test('exports to markdown with TOC', () => {
      const markdown = BookExporter.exportMarkdown(book);

      expect(markdown).toContain('# Export Test');
      expect(markdown).toContain('By Author');
      expect(markdown).toContain('## Table of Contents');
      expect(markdown).toContain('Chapter 1');
      expect(markdown).toContain('Chapter 2');
    });

    test('exports to HTML', () => {
      const html = BookExporter.exportHTML(book);

      expect(html).toContain('<html');
      expect(html).toContain('Export Test');
      expect(html).toContain('Chapter 1');
      expect(html).toContain('<style');
    });

    test('exports to JSON', () => {
      const json = BookExporter.exportJSON(book);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe(book.id);
      expect(parsed.title).toBe('Export Test');
      expect(parsed.chapters.length).toBe(2);
    });

    test('exports to plain text', () => {
      const text = BookExporter.exportText(book);

      expect(text).toContain('Export Test');
      expect(text).toContain('Chapter 1');
      expect(text).not.toContain('<');
    });

    test('exports to file', () => {
      const outputPath = path.join(tempDir, 'test-export.md');
      const result = BookExporter.exportToFile(book, outputPath, 'markdown');

      expect(fs.existsSync(outputPath)).toBe(true);
      expect(result).toBe(outputPath);

      const content = fs.readFileSync(outputPath, 'utf8');
      expect(content).toContain('Export Test');
    });
  });

  describe('BookIntegrator', () => {
    test('creates book from project', () => {
      const project = pm.createProject({
        title: 'Test Project',
        description: 'A test project',
        driveUrl: 'https://drive.google.com/file/d/test-id/view',
      });

      const book = integrator.createBookFromProject(project.id, {
        author: 'Test Author',
      });

      expect(book).toBeDefined();
      expect(book.title).toBe('Test Project');
      expect(book.author).toBe('Test Author');
      expect(book.driveUrl).toBe('https://drive.google.com/file/d/test-id/view');
    });

    test('integrates from drive with content processing', () => {
      const driveUrl = 'https://drive.google.com/file/d/test-id/view';

      const result = integrator.integrateFromDrive('test-proj', driveUrl, {
        title: 'Drive Book',
        author: 'Drive Author',
        description: 'From Drive',
        content: `# Chapter 1
Content here.

# Chapter 2
More content.`,
      });

      expect(result.project).toBeDefined();
      expect(result.book).toBeDefined();
      expect(result.book.metadata.chapterCount).toBe(2);
    });

    test('updates book and maintains sync', () => {
      const book = integrator.createBookFromProject(
        pm.createProject({
          title: 'Original',
          description: 'Test',
          driveUrl: 'https://drive.google.com/file/d/123/view',
        }).id,
        { author: 'Author' }
      );

      const updated = integrator.updateBook(book.id, {
        title: 'Updated Title',
        author: 'New Author',
        description: 'Updated description',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.author).toBe('New Author');

      // Verify persistence
      const loaded = integrator.getBookWithProject(book.id);
      expect(loaded.book.title).toBe('Updated Title');
    });

    test('exports book to all formats', () => {
      const book = integrator.createBookFromProject(
        pm.createProject({
          title: 'Export Book',
          description: 'Test',
          driveUrl: 'https://drive.google.com/file/d/test/view',
        }).id,
        { author: 'Author' }
      );

      BookProcessor.processContent(book, `# Chapter 1
Content.`);

      integrator.updateBook(book.id, {});

      const result = integrator.exportBook(book.id);

      expect(result.bookId).toBe(book.id);
      expect(result.exports).toBeDefined();
      expect(result.exports.markdown).toBeDefined();
      expect(result.exports.html).toBeDefined();
      expect(result.exports.json).toBeDefined();
      expect(result.exports.text).toBeDefined();

      // Verify files exist
      Object.values(result.exports).forEach(filePath => {
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('lists books with filters', () => {
      pm.createProject({
        title: 'Project 1',
        description: 'Test',
        driveUrl: 'https://drive.google.com/file/d/123/view',
      });

      pm.createProject({
        title: 'Project 2',
        description: 'Test',
      });

      integrator.createBookFromProject(
        pm.listProjects()[0].id,
        { author: 'Author' }
      );

      integrator.createBookFromProject(
        pm.listProjects()[1].id,
        { author: 'Author' }
      );

      const allBooks = integrator.listBooks();
      expect(allBooks.length).toBe(2);

      const withDrive = integrator.listBooks({ withDrive: true });
      expect(withDrive.length).toBe(1);
      expect(withDrive[0].driveUrl).toBeDefined();
    });

    test('gets workflow status', () => {
      const project = pm.createProject({
        title: 'Workflow Test',
        description: 'Test',
        driveUrl: 'https://drive.google.com/file/d/123/view',
      });

      const book = integrator.createBookFromProject(project.id, {
        author: 'Author',
      });

      BookProcessor.processContent(book, '# Chapter 1\nContent.');
      integrator.updateBook(book.id, {});

      const status = integrator.getWorkflowStatus(project.id);

      expect(status.project).toBeDefined();
      expect(status.book).toBeDefined();
      expect(status.workflow).toBeDefined();
      expect(status.workflow.steps.length).toBe(3);
      expect(status.workflow.step).toBeGreaterThanOrEqual(2);
    });
  });

  describe('End-to-End Workflow', () => {
    test('complete book creation and export pipeline', () => {
      // Step 1: Create project
      const project = pm.createProject({
        title: 'Complete Novel',
        description: 'A complete test novel',
        driveUrl: 'https://drive.google.com/file/d/test-novel/view',
      });

      // Step 2: Create book from project
      const book = integrator.createBookFromProject(project.id, {
        author: 'Test Writer',
      });

      // Step 3: Process content
      const content = `# Chapter 1: The Beginning
## The Call
Luke stared at the horizon, wondering about his destiny. The vast expanse of sky stretched before him, filled with endless possibilities and untold secrets. The wind carried whispers of adventure, calling to something deep within his soul. Every fiber of his being yearned for something greater than the ordinary life he had always known.

## The Decision
He made up his mind. Today was the day. He would no longer hesitate or doubt. The time for action had come, and he was ready to face whatever challenges awaited him on the road ahead. His heart raced with both fear and excitement.

# Chapter 2: The Journey
## On the Road
The path ahead was uncertain but full of possibility. Every step forward brought new experiences and unexpected encounters. Miles stretched before him, each step a new discovery. The world seemed to open up before his eyes, revealing wonders he had never imagined possible.

## The Encounter
Then she appeared, just as he turned the corner. Their eyes met for the first time, and in that moment, everything changed. She was unlike anyone he had ever met before.`;

      BookProcessor.processContent(book, content);
      // Save the processed book to disk
      integrator.saveBook(book);

      // Step 4: Verify book structure
      expect(book.metadata.chapterCount).toBe(2);
      expect(book.metadata.wordCount).toBeGreaterThan(100);

      // Step 5: Update book metadata
      integrator.updateBook(book.id, {
        title: 'The Quest',
        author: 'Luke Skywalker',
        description: 'An epic tale of adventure',
      });

      // Step 6: Export to all formats
      const exportResult = integrator.exportBook(book.id);

      expect(exportResult.exports.markdown).toBeDefined();
      expect(exportResult.exports.html).toBeDefined();
      expect(exportResult.exports.json).toBeDefined();
      expect(exportResult.exports.text).toBeDefined();

      // Step 7: Verify all files exist
      Object.values(exportResult.exports).forEach(filePath => {
        expect(fs.existsSync(filePath)).toBe(true);
        const size = fs.statSync(filePath).size;
        expect(size).toBeGreaterThan(0);
      });

      // Step 8: Get workflow status
      const status = integrator.getWorkflowStatus(project.id);
      expect(status.workflow.step).toBe(2);
      expect(status.book.chapters).toBe(2);

      // Step 9: List books
      const books = integrator.listBooks();
      expect(books.length).toBeGreaterThan(0);
      const foundBook = books.find(b => b.id === book.id);
      expect(foundBook).toBeDefined();
      expect(foundBook.chapters).toBe(2);
    });
  });
});
