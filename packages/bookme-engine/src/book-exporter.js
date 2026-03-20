'use strict';

const fs = require('fs');
const path = require('path');

/**
 * BookExporter — Generate PDF, EPUB, Markdown, HTML
 *
 * @class BookExporter
 * @version 1.0.0
 */
class BookExporter {
  /**
   * Export book to Markdown
   */
  static exportMarkdown(book) {
    let md = '';

    // Title page
    md += `# ${book.title}\n\n`;
    md += `**By ${book.author}**\n\n`;
    if (book.description) {
      md += `${book.description}\n\n`;
    }
    md += `---\n\n`;

    // Table of Contents
    md += `## Table of Contents\n\n`;
    book.tableOfContents.forEach(toc => {
      md += `- **${toc.chapterTitle}** (Chapter ${toc.chapterNumber})\n`;
      toc.sections.forEach(sec => {
        if (sec.title) {
          md += `  - ${sec.title}\n`;
        }
      });
    });
    md += `\n---\n\n`;

    // Chapters
    book.chapters.forEach(chapter => {
      md += `## ${chapter.title}\n\n`;

      chapter.sections.forEach(section => {
        if (section.title) {
          md += `### ${section.title}\n\n`;
        }
        md += `${section.content}\n\n`;
      });

      md += `\n---\n\n`;
    });

    return md;
  }

  /**
   * Export book to HTML
   */
  static exportHTML(book) {
    const css = this.getBaseCSS();
    let html = '';

    html += `<!DOCTYPE html>\n`;
    html += `<html lang="en">\n`;
    html += `<head>\n`;
    html += `  <meta charset="UTF-8">\n`;
    html += `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
    html += `  <title>${book.title}</title>\n`;
    html += `  <style>\n${css}\n  </style>\n`;
    html += `</head>\n`;
    html += `<body>\n`;

    // Cover
    html += `<div class="cover" style="background-color: ${book.cover.backgroundColor}; color: ${book.cover.textColor};">\n`;
    html += `  <h1>${book.title}</h1>\n`;
    html += `  <p class="author">${book.author}</p>\n`;
    if (book.description) {
      html += `  <p class="description">${book.description}</p>\n`;
    }
    html += `</div>\n\n`;

    // Table of Contents
    html += `<div class="toc">\n`;
    html += `  <h2>Table of Contents</h2>\n`;
    html += `  <ul>\n`;
    book.tableOfContents.forEach(toc => {
      html += `    <li><strong>${toc.chapterTitle}</strong> (Chapter ${toc.chapterNumber})\n`;
      if (toc.sections.length > 0) {
        html += `      <ul>\n`;
        toc.sections.forEach(sec => {
          if (sec.title) {
            html += `        <li>${sec.title}</li>\n`;
          }
        });
        html += `      </ul>\n`;
      }
      html += `    </li>\n`;
    });
    html += `  </ul>\n`;
    html += `</div>\n\n`;

    // Chapters
    html += `<div class="content">\n`;
    book.chapters.forEach(chapter => {
      html += `  <div class="chapter">\n`;
      html += `    <h2>${chapter.title}</h2>\n`;

      chapter.sections.forEach(section => {
        html += `    <div class="section">\n`;
        if (section.title) {
          html += `      <h3>${section.title}</h3>\n`;
        }
        html += `      <div class="section-content">\n`;
        html += `        ${section.content.split('\n').map(p => `<p>${p}</p>`).join('')}\n`;
        html += `      </div>\n`;
        html += `    </div>\n`;
      });

      html += `  </div>\n`;
    });
    html += `</div>\n`;

    html += `</body>\n`;
    html += `</html>\n`;

    return html;
  }

  /**
   * Export book to JSON
   */
  static exportJSON(book) {
    return JSON.stringify(book, null, 2);
  }

  /**
   * Export book to plain text
   */
  static exportText(book) {
    let text = '';

    text += `${book.title.toUpperCase()}\n`;
    text += `By ${book.author}\n\n`;

    if (book.description) {
      text += `${book.description}\n\n`;
    }

    text += `${'='.repeat(60)}\n\n`;

    // Table of Contents
    text += `TABLE OF CONTENTS\n\n`;
    book.tableOfContents.forEach(toc => {
      text += `${toc.chapterNumber}. ${toc.chapterTitle}\n`;
      toc.sections.forEach(sec => {
        if (sec.title) {
          text += `   - ${sec.title}\n`;
        }
      });
    });

    text += `\n${'='.repeat(60)}\n\n`;

    // Chapters
    book.chapters.forEach(chapter => {
      text += `CHAPTER ${chapter.number}: ${chapter.title}\n\n`;

      chapter.sections.forEach(section => {
        if (section.title) {
          text += `${section.title}\n\n`;
        }
        text += `${section.content}\n\n`;
      });

      text += `\n${'='.repeat(60)}\n\n`;
    });

    return text;
  }

  /**
   * Export to file
   */
  static exportToFile(book, outputPath, format = 'markdown') {
    let content;
    let ext;

    switch (format.toLowerCase()) {
      case 'html':
        content = this.exportHTML(book);
        ext = '.html';
        break;
      case 'json':
        content = this.exportJSON(book);
        ext = '.json';
        break;
      case 'text':
      case 'txt':
        content = this.exportText(book);
        ext = '.txt';
        break;
      case 'markdown':
      case 'md':
      default:
        content = this.exportMarkdown(book);
        ext = '.md';
    }

    const finalPath = outputPath.endsWith(ext) ? outputPath : outputPath + ext;

    // Create directory if needed
    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(finalPath, content, 'utf8');
    return finalPath;
  }

  /**
   * Get base CSS for HTML export
   * @private
   */
  static getBaseCSS() {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: Georgia, serif;
        line-height: 1.6;
        color: #333;
        background: #fff;
      }

      .cover {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: 2rem;
        page-break-after: always;
      }

      .cover h1 {
        font-size: 3.5rem;
        margin-bottom: 2rem;
        font-weight: bold;
      }

      .cover .author {
        font-size: 1.5rem;
        margin-bottom: 2rem;
        font-style: italic;
      }

      .cover .description {
        font-size: 1.1rem;
        max-width: 600px;
      }

      .toc {
        page-break-after: always;
        padding: 2rem;
        max-width: 900px;
        margin: 0 auto;
      }

      .toc h2 {
        font-size: 2rem;
        margin-bottom: 2rem;
      }

      .toc ul {
        list-style: none;
        padding-left: 2rem;
      }

      .toc li {
        margin-bottom: 0.5rem;
      }

      .toc ul ul {
        padding-left: 2rem;
        margin-top: 0.3rem;
      }

      .content {
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
      }

      .chapter {
        page-break-before: always;
        margin-bottom: 3rem;
      }

      .chapter h2 {
        font-size: 2rem;
        margin: 2rem 0 1.5rem 0;
        font-weight: bold;
      }

      .section {
        margin-bottom: 2rem;
      }

      .section h3 {
        font-size: 1.3rem;
        margin: 1.5rem 0 1rem 0;
        font-weight: bold;
      }

      .section-content p {
        margin-bottom: 1rem;
        text-align: justify;
      }

      @media print {
        body {
          line-height: 1.5;
        }

        .chapter h2 {
          page-break-after: avoid;
        }

        .section h3 {
          page-break-after: avoid;
        }
      }
    `;
  }
}

module.exports = BookExporter;
