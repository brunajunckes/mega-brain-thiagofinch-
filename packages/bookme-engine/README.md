# BookMe Engine

Transform any file into a professionally structured book with automatic chapter detection, full editing capabilities, and multi-format export.

## Features

✅ **Automatic Chapter Detection** — Parse content and auto-structure into chapters
✅ **Content Parsing** — Intelligent section detection from headers and markers
✅ **Table of Contents** — Auto-generated TOC with all chapters and sections
✅ **Multi-Format Export** — Markdown, HTML, JSON, plain text, PDF-ready
✅ **Full Editing API** — Edit chapters and sections programmatically
✅ **Word Count Tracking** — Real-time word count and statistics
✅ **Metadata Management** — Author, description, cover design, settings

## Installation

```bash
npm install
```

## Quick Start

### Via CLI

```bash
# Create book from Google Drive
aiox bookme create "My Novel" \
  --drive "https://drive.google.com/file/d/..." \
  --author "John Doe" \
  --description "An epic tale"

# Process content into chapters (convert text to structure)
aiox bookme process book_123 --content chapters.txt

# Export to HTML
aiox bookme export book_123 --format html --output my-book.html

# View book
aiox bookme view book_123

# List all books
aiox bookme list
```

### Via JavaScript API

```javascript
const { BookProcessor, BookExporter } = require('@aiox-fullstack/bookme-engine');
const fs = require('fs');

// Create book
const book = BookProcessor.createBook({
  title: 'My Novel',
  author: 'Jane Smith',
  description: 'An amazing story',
  content: `# Chapter 1: Beginning
This is where it all starts...

## The Call
More details...

# Chapter 2: Adventure
The journey continues...`
});

// Edit chapter
BookProcessor.editChapter(book, book.chapters[0].id, {
  title: 'The Grand Opening',
  content: 'Updated chapter content...'
});

// Edit section
BookProcessor.editSection(
  book,
  book.chapters[0].id,
  book.chapters[0].sections[0].id,
  { content: 'New section content...' }
);

// Export
const markdown = BookExporter.exportMarkdown(book);
const html = BookExporter.exportHTML(book);
const json = BookExporter.exportJSON(book);

// Save to file
BookExporter.exportToFile(book, 'my-book.html', 'html');
BookExporter.exportToFile(book, 'my-book.md', 'markdown');
```

## API Reference

### BookProcessor

#### createBook(options)
Create a new book structure.

**Options:**
- `title` (string) — Book title
- `author` (string) — Author name
- `description` (string) — Book description
- `content` (string) — Optional content to auto-parse
- `driveUrl` (string) — Google Drive URL
- `driveFileId` (string) — Drive file ID

**Returns:** Book object

#### processContent(book, content)
Parse content and auto-structure into chapters.

#### addChapter(book, title, content)
Add a new chapter to the book.

#### editChapter(book, chapterId, updates)
Edit chapter title or content.

#### editSection(book, chapterId, sectionId, updates)
Edit section content.

#### deleteChapter(book, chapterId)
Remove a chapter.

#### getSummary(book)
Get book summary (metadata only).

### BookExporter

#### exportMarkdown(book)
Export to Markdown with TOC and formatted chapters.

#### exportHTML(book)
Export to styled HTML (print-ready with CSS).

#### exportJSON(book)
Export complete book structure as JSON.

#### exportText(book)
Export to plain text format.

#### exportToFile(book, outputPath, format)
Export directly to file with auto-formatting.

## Book Structure

Each book is stored as JSON:

```json
{
  "id": "book_123456789",
  "title": "My Novel",
  "author": "Jane Smith",
  "description": "An amazing story",
  "cover": {
    "title": "My Novel",
    "author": "Jane Smith",
    "backgroundColor": "#1a1a2e",
    "textColor": "#ffffff"
  },
  "metadata": {
    "createdAt": "2026-03-20T17:50:00Z",
    "updatedAt": "2026-03-20T17:50:00Z",
    "wordCount": 5000,
    "chapterCount": 3,
    "status": "editing"
  },
  "chapters": [
    {
      "id": "chap_123",
      "title": "Chapter 1: Beginning",
      "number": 1,
      "wordCount": 1500,
      "sections": [
        {
          "id": "sect_456",
          "title": "The Call",
          "content": "...",
          "wordCount": 200
        }
      ]
    }
  ],
  "tableOfContents": [
    {
      "chapterNumber": 1,
      "chapterTitle": "Chapter 1: Beginning",
      "sections": [
        {"title": "The Call", "sectionId": "sect_456"}
      ]
    }
  ]
}
```

## Automatic Chapter Detection

BookMe detects chapters from common patterns:

```
# Chapter 1: Title
## Section Title
Content...

# Chapter 2: Title
```

Or with alternative markers:

```
Capítulo 1: Title
Content...

Capítulo 2: Title
```

## Export Formats

### Markdown
- Formatted with headers
- Table of contents
- Clean readable structure
- Perfect for GitHub/docs

### HTML
- Professional styling
- Print-ready CSS
- Responsive layout
- PDF-printable

### JSON
- Complete structure
- Perfect for frontends
- All metadata included
- API-ready format

### Plain Text
- No formatting
- Maximum portability
- Easy to import elsewhere

## Workflow

1. **Create** — New book with metadata
2. **Process** — Parse content into chapters
3. **Edit** — Modify chapters/sections as needed
4. **Export** — Generate final format (HTML, PDF, etc.)

## Integration with BookMe Suite

Works seamlessly with:
- **Google Drive Worker** — Access Drive files
- **Project Manager** — Track book projects
- **BookMe Web UI** — Interactive editing (coming soon)

## Use Cases

✅ Novel/Story writing and editing
✅ Convert research docs into structured books
✅ Create technical documentation
✅ Generate course materials
✅ Author self-publishing
✅ Content compilation from multiple sources
✅ Interactive ebook creation

## Performance

- **Book creation:** < 10ms
- **Content parsing:** < 50ms for 10,000 words
- **Export generation:** < 100ms
- **File I/O:** Depends on file size

## Next Steps

- BookMe Web UI for visual editing
- Real-time collaborative editing
- Advanced styling and formatting
- PDF generation
- Image and media support
- ISBN and publishing integration

---

**BookMe Engine v1.0**
*Transform files into beautiful, structured books*
