'use strict';

const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: () => require('crypto').randomUUID() } : { v4: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };

/**
 * BookProcessor — Transform any file into structured book
 *
 * Features:
 * - Automatic chapter detection
 * - Content parsing and structuring
 * - Metadata extraction
 * - Book outline generation
 *
 * @class BookProcessor
 * @version 1.0.0
 */
class BookProcessor {
  /**
   * Create book from file content
   * @param {Object} options Processing options
   * @returns {Object} Processed book structure
   */
  static createBook(options = {}) {
    const {
      title = 'Untitled Book',
      author = 'Anonymous',
      description = '',
      content = '',
      driveUrl = null,
      driveFileId = null,
    } = options;

    const bookId = this.generateBookId();
    const now = new Date().toISOString();

    const book = {
      id: bookId,
      title,
      author,
      description,
      driveUrl,
      driveFileId,
      cover: {
        title,
        author,
        subtitle: '',
        backgroundColor: '#1a1a2e',
        textColor: '#ffffff',
        imageUrl: null,
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        wordCount: 0,
        chapterCount: 0,
        status: 'draft', // draft, editing, published
      },
      chapters: [],
      tableOfContents: [],
      settings: {
        fontSize: 14,
        fontFamily: 'Georgia',
        lineHeight: 1.6,
        theme: 'light', // light, dark, sepia
      },
    };

    // Process content if provided
    if (content) {
      this.processContent(book, content);
    }

    return book;
  }

  /**
   * Process content and structure into chapters
   * @private
   */
  static processContent(book, content) {
    // Simple chapter detection (can be enhanced)
    const chapters = this.parseChapters(content);

    chapters.forEach((chapterData, idx) => {
      const chapter = {
        id: this.generateChapterId(),
        title: chapterData.title || `Chapter ${idx + 1}`,
        number: idx + 1,
        sections: [],
        wordCount: 0,
        status: 'draft',
      };

      const sections = this.parseSections(chapterData.content);
      let chapterWordCount = 0;

      sections.forEach((sectionData, sIdx) => {
        const section = {
          id: this.generateSectionId(),
          title: sectionData.title || '',
          content: sectionData.content,
          wordCount: this.countWords(sectionData.content),
          status: 'draft',
        };

        chapterWordCount += section.wordCount;
        chapter.sections.push(section);
      });

      chapter.wordCount = chapterWordCount;
      book.chapters.push(chapter);
    });

    // Update metadata
    book.metadata.chapterCount = book.chapters.length;
    book.metadata.wordCount = book.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

    // Generate table of contents
    this.generateTableOfContents(book);
  }

  /**
   * Parse chapters from content
   * @private
   */
  static parseChapters(content) {
    // Split by common chapter markers
    const chapterPatterns = [
      /^#\s+Chapter\s+\d+:?\s+(.+)$/gm,
      /^##\s+(.+)$/gm,
      /^Capítulo\s+\d+:?\s+(.+)$/gm,
    ];

    const chapters = [];
    let lastIndex = 0;

    for (const pattern of chapterPatterns) {
      const matches = [...content.matchAll(pattern)];

      if (matches.length > 0) {
        matches.forEach((match, idx) => {
          const startIdx = match.index;
          const endIdx = idx < matches.length - 1 ? matches[idx + 1].index : content.length;
          const chapterContent = content.substring(startIdx, endIdx).trim();

          chapters.push({
            title: match[1]?.trim() || `Chapter ${chapters.length + 1}`,
            content: chapterContent,
          });
        });

        return chapters;
      }
    }

    // Fallback: treat entire content as single chapter
    return [{
      title: 'Chapter 1',
      content,
    }];
  }

  /**
   * Parse sections from chapter content
   * @private
   */
  static parseSections(content) {
    const sections = [];
    const lines = content.split('\n').filter(l => l.trim());

    let currentSection = {
      title: '',
      content: [],
    };

    lines.forEach(line => {
      if (line.startsWith('###') || line.startsWith('- ')) {
        if (currentSection.content.length > 0) {
          sections.push({
            title: currentSection.title,
            content: currentSection.content.join('\n'),
          });
        }

        currentSection = {
          title: line.replace(/^#+\s+/, '').replace(/^-\s+/, '').trim(),
          content: [],
        };
      } else if (line.trim()) {
        currentSection.content.push(line);
      }
    });

    if (currentSection.content.length > 0) {
      sections.push({
        title: currentSection.title,
        content: currentSection.content.join('\n'),
      });
    }

    return sections.length > 0 ? sections : [{
      title: '',
      content,
    }];
  }

  /**
   * Generate table of contents
   * @private
   */
  static generateTableOfContents(book) {
    book.tableOfContents = book.chapters.map((ch, idx) => ({
      chapterNumber: ch.number,
      chapterTitle: ch.title,
      sections: ch.sections.map(s => ({
        title: s.title || `Section ${s.id.substring(0, 4)}`,
        sectionId: s.id,
      })),
    }));
  }

  /**
   * Add chapter
   */
  static addChapter(book, title = '', content = '') {
    const chapter = {
      id: this.generateChapterId(),
      title: title || `Chapter ${book.chapters.length + 1}`,
      number: book.chapters.length + 1,
      sections: [],
      wordCount: 0,
      status: 'draft',
    };

    if (content) {
      const sections = this.parseSections(content);
      let wordCount = 0;

      sections.forEach(sectionData => {
        const section = {
          id: this.generateSectionId(),
          title: sectionData.title || '',
          content: sectionData.content,
          wordCount: this.countWords(sectionData.content),
          status: 'draft',
        };

        wordCount += section.wordCount;
        chapter.sections.push(section);
      });

      chapter.wordCount = wordCount;
    }

    book.chapters.push(chapter);
    book.metadata.chapterCount = book.chapters.length;
    book.metadata.wordCount += chapter.wordCount;
    book.metadata.updatedAt = new Date().toISOString();

    this.generateTableOfContents(book);
    return chapter;
  }

  /**
   * Edit chapter
   */
  static editChapter(book, chapterId, updates) {
    const chapter = book.chapters.find(ch => ch.id === chapterId);
    if (!chapter) throw new Error(`Chapter not found: ${chapterId}`);

    if (updates.title) chapter.title = updates.title;
    if (updates.content !== undefined) {
      chapter.sections = [];
      const sections = this.parseSections(updates.content);
      let wordCount = 0;

      sections.forEach(sectionData => {
        const section = {
          id: this.generateSectionId(),
          title: sectionData.title || '',
          content: sectionData.content,
          wordCount: this.countWords(sectionData.content),
          status: 'draft',
        };

        wordCount += section.wordCount;
        chapter.sections.push(section);
      });

      chapter.wordCount = wordCount;
    }

    book.metadata.updatedAt = new Date().toISOString();
    this.generateTableOfContents(book);
    return chapter;
  }

  /**
   * Edit section
   */
  static editSection(book, chapterId, sectionId, updates) {
    const chapter = book.chapters.find(ch => ch.id === chapterId);
    if (!chapter) throw new Error(`Chapter not found: ${chapterId}`);

    const section = chapter.sections.find(s => s.id === sectionId);
    if (!section) throw new Error(`Section not found: ${sectionId}`);

    const oldWordCount = section.wordCount;

    if (updates.title) section.title = updates.title;
    if (updates.content) {
      section.content = updates.content;
      section.wordCount = this.countWords(updates.content);

      chapter.wordCount = chapter.wordCount - oldWordCount + section.wordCount;
      book.metadata.wordCount = book.metadata.wordCount - oldWordCount + section.wordCount;
    }

    book.metadata.updatedAt = new Date().toISOString();
    return section;
  }

  /**
   * Delete chapter
   */
  static deleteChapter(book, chapterId) {
    const idx = book.chapters.findIndex(ch => ch.id === chapterId);
    if (idx === -1) throw new Error(`Chapter not found: ${chapterId}`);

    const chapter = book.chapters[idx];
    book.metadata.wordCount -= chapter.wordCount;
    book.chapters.splice(idx, 1);

    // Renumber chapters
    book.chapters.forEach((ch, i) => {
      ch.number = i + 1;
    });

    book.metadata.chapterCount = book.chapters.length;
    book.metadata.updatedAt = new Date().toISOString();

    this.generateTableOfContents(book);
  }

  /**
   * Get book summary
   */
  static getSummary(book) {
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.description,
      wordCount: book.metadata.wordCount,
      chapterCount: book.metadata.chapterCount,
      status: book.metadata.status,
      createdAt: book.metadata.createdAt,
      updatedAt: book.metadata.updatedAt,
    };
  }

  /**
   * Count words in text
   * @private
   */
  static countWords(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Generate IDs
   * @private
   */
  static generateBookId() {
    return `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateChapterId() {
    return `chap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateSectionId() {
    return `sect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = BookProcessor;
