'use strict';

const fs = require('fs');
const path = require('path');
const BookProcessor = require('./book-processor');
const BookExporter = require('./book-exporter');
const { ProjectManager } = require('../../../packages/project-manager/src');
const { DriveExtractor, DriveDownloader } = require('../../../packages/google-drive-worker/src');

/**
 * BookIntegrator — Automatic integration with existing systems
 *
 * Workflow:
 * 1. Receive Drive URL or file from ProjectManager
 * 2. Extract Drive metadata
 * 3. Download file if needed
 * 4. Process into book structure
 * 5. Save to ProjectManager + BookMe storage
 * 6. Return ready-to-edit book
 *
 * @class BookIntegrator
 * @version 1.0.0
 */
class BookIntegrator {
  constructor(baseDir = './') {
    this.baseDir = baseDir;
    this.projectsDir = path.join(baseDir, 'bookme-projects');
    this.pm = new ProjectManager(path.join(baseDir, 'projects'));

    this.ensureDir(this.projectsDir);
  }

  /**
   * Create book from project (full integration)
   */
  createBookFromProject(projectId, options = {}) {
    // Get project from ProjectManager
    const project = this.pm.getProject(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    // Create book structure
    const book = BookProcessor.createBook({
      title: project.title,
      author: options.author || 'Anonymous',
      description: project.description,
      driveUrl: project.driveUrl,
      driveFileId: project.driveFileId,
    });

    // If Drive URL exists and content not provided, prepare for download
    if (project.driveUrl && !options.content) {
      console.log(`📥 Drive file ready: ${project.driveFileId}`);
      console.log('   Use: aiox drive download <url> --output content.txt');
      console.log('   Then: aiox bookme integrate <project-id> --content content.txt');
    }

    // Save book
    this.saveBook(book);

    // Link project to book
    this.pm.updateProject(projectId, {
      description: `${project.description}\n\n[BookMe ID: ${book.id}]`,
    });

    return book;
  }

  /**
   * Integrate Drive file → Process → Book (full pipeline)
   */
  integrateFromDrive(projectId, driveUrl, options = {}) {
    // Get or create project
    let project = this.pm.getProject(projectId);

    if (!project) {
      project = this.pm.createProject({
        title: options.title || 'Untitled Book',
        description: options.description || '',
        driveUrl,
      });
    } else {
      this.pm.updateProject(projectId, { driveUrl });
      project = this.pm.getProject(projectId);
    }

    // Extract metadata
    const fileId = DriveExtractor.extractFileId(driveUrl);
    const fileInfo = DriveExtractor.parseUrl(driveUrl);

    // Create book
    const book = BookProcessor.createBook({
      title: project.title,
      author: options.author || 'Anonymous',
      description: project.description,
      driveUrl,
      driveFileId: fileId,
    });

    // Try to download and process (if content provided)
    if (options.content) {
      BookProcessor.processContent(book, options.content);
      console.log(`✅ Processed: ${book.metadata.chapterCount} chapters, ${book.metadata.wordCount} words`);
    } else {
      console.log(`📥 Ready to process. Download file and provide content.`);
    }

    // Save everything
    this.saveBook(book);

    // Update project with book link
    this.pm.updateProject(project.id, {
      description: `${project.description}\n[BookMe: ${book.id}]`,
    });

    return { project, book };
  }

  /**
   * Update book and sync with ProjectManager
   */
  updateBook(bookId, updates = {}) {
    const book = this.loadBook(bookId);
    if (!book) throw new Error(`Book not found: ${bookId}`);

    // Apply updates
    if (updates.title) book.title = updates.title;
    if (updates.author) book.author = updates.author;
    if (updates.description) book.description = updates.description;
    if (updates.cover) Object.assign(book.cover, updates.cover);

    book.metadata.updatedAt = new Date().toISOString();

    this.saveBook(book);
    return book;
  }

  /**
   * Export book and return all formats
   */
  exportBook(bookId, outputDir = null) {
    const book = this.loadBook(bookId);
    if (!book) throw new Error(`Book not found: ${bookId}`);

    const dir = outputDir || path.join(this.baseDir, 'bookme-exports', bookId);
    this.ensureDir(dir);

    const exports = {};

    // Export all formats
    ['markdown', 'html', 'json', 'text'].forEach(format => {
      const filename = `${book.id}.${format === 'text' ? 'txt' : format === 'markdown' ? 'md' : format}`;
      const filepath = path.join(dir, filename);

      BookExporter.exportToFile(book, filepath, format);
      exports[format] = filepath;
    });

    return {
      bookId: book.id,
      title: book.title,
      exports,
      exportDir: dir,
    };
  }

  /**
   * Get book with project context
   */
  getBookWithProject(bookId) {
    const book = this.loadBook(bookId);
    if (!book) throw new Error(`Book not found: ${bookId}`);

    // Find related project
    const projects = this.pm.listProjects();
    const project = projects.find(p =>
      p.description?.includes(`BookMe: ${bookId}`)
    );

    return {
      book,
      project,
      summary: {
        title: book.title,
        author: book.author,
        chapters: book.metadata.chapterCount,
        words: book.metadata.wordCount,
        status: book.metadata.status,
        hasProject: !!project,
      },
    };
  }

  /**
   * List all books with project integration
   */
  listBooks(filter = {}) {
    const files = fs.readdirSync(this.projectsDir).filter(f => f.endsWith('.json') && f.startsWith('book_'));

    const books = files.map(file => {
      try {
        const book = JSON.parse(fs.readFileSync(path.join(this.projectsDir, file), 'utf8'));

        // Find project
        const projects = this.pm.listProjects();
        const project = projects.find(p => p.description?.includes(`BookMe: ${book.id}`));

        return {
          id: book.id,
          title: book.title,
          author: book.author,
          chapters: book.metadata.chapterCount,
          words: book.metadata.wordCount,
          status: book.metadata.status,
          projectId: project?.id || null,
          driveUrl: book.driveUrl,
        };
      } catch (err) {
        return null;
      }
    }).filter(Boolean);

    // Apply filters
    if (filter.status) {
      return books.filter(b => b.status === filter.status);
    }

    if (filter.withDrive) {
      return books.filter(b => b.driveUrl);
    }

    return books;
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(projectId) {
    const project = this.pm.getProject(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    // Find related book from project description
    let book = null;
    if (project.description) {
      const match = project.description.match(/\[BookMe(?: ID)?:\s*([^\]]+)\]/);
      if (match) {
        const bookId = match[1].trim();
        const fullBook = this.loadBook(bookId);
        if (fullBook) {
          book = {
            id: fullBook.id,
            chapters: fullBook.metadata.chapterCount,
            words: fullBook.metadata.wordCount,
            status: fullBook.metadata.status,
          };
        }
      }
    }

    return {
      project: {
        id: project.id,
        title: project.title,
        driveUrl: project.driveUrl,
        hasFile: !!project.driveFileId,
      },
      book: book ? {
        id: book.id,
        chapters: book.chapters,
        words: book.words,
        status: book.status,
      } : null,
      workflow: {
        step: book ? (book.status === 'draft' ? 2 : 3) : 1,
        totalSteps: 3,
        steps: [
          { step: 1, name: 'Create Project', done: !!project },
          { step: 2, name: 'Process Content', done: !!book },
          { step: 3, name: 'Export/Publish', done: book?.status === 'published' },
        ],
      },
    };
  }

  /**
   * Save book
   * @private
   */
  saveBook(book) {
    const filepath = path.join(this.projectsDir, `${book.id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(book, null, 2), 'utf8');
  }

  /**
   * Load book
   * @private
   */
  loadBook(bookId) {
    const filepath = path.join(this.projectsDir, `${bookId}.json`);
    if (!fs.existsSync(filepath)) return null;

    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
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
}

module.exports = BookIntegrator;
