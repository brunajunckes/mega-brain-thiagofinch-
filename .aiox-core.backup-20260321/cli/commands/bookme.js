'use strict';

const fs = require('fs');
const path = require('path');
const { BookProcessor, BookExporter } = require('../../../packages/bookme-engine/src');
const { ProjectManager } = require('../../../packages/project-manager/src');

async function handleBookmeCommand(args) {
  try {
    const subcommand = args._?.[0];

    if (!subcommand) {
      showHelp();
      process.exit(0);
    }

    const projectsDir = args.dir || './bookme-projects';
    const pm = new ProjectManager(projectsDir);

    if (subcommand === 'create') {
      await handleCreate(pm, args);
    } else if (subcommand === 'process') {
      await handleProcess(pm, args);
    } else if (subcommand === 'edit') {
      handleEdit(pm, args);
    } else if (subcommand === 'export') {
      handleExport(pm, args);
    } else if (subcommand === 'list') {
      handleList(pm, args);
    } else if (subcommand === 'view') {
      handleView(pm, args);
    } else {
      console.error(`Unknown subcommand: ${subcommand}`);
      showHelp();
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ BookMe error: ${error.message}`);
    if (args.verbose) console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Create new book from Drive URL
 */
function handleCreate(pm, args) {
  const title = args.title || args._?.[1] || '';
  const driveUrl = args.drive || '';
  const author = args.author || 'Anonymous';
  const description = args.description || '';

  if (!title) {
    console.error('❌ Title required: aiox bookme create "Title" --drive URL --author "Name"');
    process.exit(1);
  }

  // Create project
  const project = pm.createProject({
    title,
    description,
    driveUrl,
  });

  // Create book structure
  const book = BookProcessor.createBook({
    title,
    author,
    description,
    driveUrl,
    driveFileId: project.driveFileId,
  });

  // Save book
  const bookFile = path.join('.', 'bookme-projects', `${book.id}.json`);
  fs.mkdirSync(path.dirname(bookFile), { recursive: true });
  fs.writeFileSync(bookFile, JSON.stringify(book, null, 2), 'utf8');

  console.log('✅ Book created!');
  console.log(`📚 ID: ${book.id}`);
  console.log(`📖 Title: ${book.title}`);
  console.log(`✍️  Author: ${book.author}`);
  console.log(`💾 File: ${bookFile}`);
  console.log('\nNext: aiox bookme process <id> [--content file.txt]');
}

/**
 * Process Drive file into book structure
 */
function handleProcess(pm, args) {
  const bookId = args._?.[1];
  const contentFile = args.content || '';

  if (!bookId) {
    console.error('❌ Book ID required: aiox bookme process <id> [--content file.txt]');
    process.exit(1);
  }

  const bookFile = path.join('.', 'bookme-projects', `${bookId}.json`);
  if (!fs.existsSync(bookFile)) {
    console.error(`❌ Book not found: ${bookId}`);
    process.exit(1);
  }

  const book = JSON.parse(fs.readFileSync(bookFile, 'utf8'));
  let content = '';

  if (contentFile && fs.existsSync(contentFile)) {
    content = fs.readFileSync(contentFile, 'utf8');
  } else if (book.driveFileId) {
    console.log(`📥 Note: To process Drive file ${book.driveFileId}:`);
    console.log(`   1. Use: aiox drive download <url> --output content.txt`);
    console.log(`   2. Then: aiox bookme process ${bookId} --content content.txt`);
    process.exit(1);
  }

  BookProcessor.processContent(book, content);

  fs.writeFileSync(bookFile, JSON.stringify(book, null, 2), 'utf8');

  console.log('✅ Book processed!');
  console.log(`📊 Chapters: ${book.metadata.chapterCount}`);
  console.log(`📝 Words: ${book.metadata.wordCount}`);
}

/**
 * Edit book (show how-to)
 */
function handleEdit(pm, args) {
  const bookId = args._?.[1];

  if (!bookId) {
    console.error('❌ Book ID required: aiox bookme edit <id>');
    process.exit(1);
  }

  const bookFile = path.join('.', 'bookme-projects', `${bookId}.json`);
  if (!fs.existsSync(bookFile)) {
    console.error(`❌ Book not found: ${bookId}`);
    process.exit(1);
  }

  const book = JSON.parse(fs.readFileSync(bookFile, 'utf8'));

  console.log(`\n📚 Editing: ${book.title}\n`);
  console.log('Chapter List:\n');

  book.chapters.forEach((ch, idx) => {
    console.log(`${idx + 1}. ${ch.title} (${ch.wordCount} words)`);
    ch.sections.forEach(s => {
      console.log(`   └─ ${s.title || 'Untitled Section'}`);
    });
  });

  console.log('\n💡 To edit, use JavaScript API:');
  console.log(`
const { BookProcessor } = require('@aiox-fullstack/bookme-engine');
const fs = require('fs');

const book = JSON.parse(fs.readFileSync('${bookFile}', 'utf8'));

// Edit chapter
BookProcessor.editChapter(book, '${book.chapters[0]?.id || 'chap_id'}', {
  title: 'New Title',
  content: 'New content...'
});

// Edit section
BookProcessor.editSection(book, '${book.chapters[0]?.id}', '${book.chapters[0]?.sections[0]?.id}', {
  content: 'Updated content...'
});

fs.writeFileSync('${bookFile}', JSON.stringify(book, null, 2));
  `);
}

/**
 * Export book
 */
function handleExport(pm, args) {
  const bookId = args._?.[1];
  const format = args.format || 'markdown';
  const output = args.output || `${bookId}.${format}`;

  if (!bookId) {
    console.error('❌ Book ID required: aiox bookme export <id> [--format md] [--output file]');
    process.exit(1);
  }

  const bookFile = path.join('.', 'bookme-projects', `${bookId}.json`);
  if (!fs.existsSync(bookFile)) {
    console.error(`❌ Book not found: ${bookId}`);
    process.exit(1);
  }

  const book = JSON.parse(fs.readFileSync(bookFile, 'utf8'));
  const exportPath = BookExporter.exportToFile(book, output, format);

  console.log(`✅ Exported to: ${exportPath}`);
  console.log(`   Format: ${format}`);
  console.log(`   Size: ${fs.statSync(exportPath).size} bytes`);
}

/**
 * List books
 */
function handleList(pm, args) {
  const projectsDir = args.dir || './bookme-projects';

  if (!fs.existsSync(projectsDir)) {
    console.log('📭 No books created yet');
    process.exit(0);
  }

  const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log('📭 No books created yet');
    process.exit(0);
  }

  console.log(`\n📚 Books (${files.length})\n`);

  files.forEach(file => {
    try {
      const book = JSON.parse(fs.readFileSync(path.join(projectsDir, file), 'utf8'));
      console.log(`${book.title}`);
      console.log(`   ID: ${book.id}`);
      console.log(`   Author: ${book.author}`);
      console.log(`   Chapters: ${book.metadata.chapterCount}`);
      console.log(`   Words: ${book.metadata.wordCount}`);
      console.log('');
    } catch (err) {
      // Skip invalid files
    }
  });
}

/**
 * View book
 */
function handleView(pm, args) {
  const bookId = args._?.[1];

  if (!bookId) {
    console.error('❌ Book ID required: aiox bookme view <id>');
    process.exit(1);
  }

  const bookFile = path.join('.', 'bookme-projects', `${bookId}.json`);
  if (!fs.existsSync(bookFile)) {
    console.error(`❌ Book not found: ${bookId}`);
    process.exit(1);
  }

  const book = JSON.parse(fs.readFileSync(bookFile, 'utf8'));

  console.log(`\n📚 ${book.title}\n`);
  console.log(`By ${book.author}\n`);
  console.log(`${book.description}\n`);
  console.log(`─`.repeat(60) + '\n');

  book.chapters.forEach((ch, idx) => {
    console.log(`\nChapter ${idx + 1}: ${ch.title}\n`);
    ch.sections.forEach(s => {
      if (s.title) console.log(`  ${s.title}\n`);
      console.log(`  ${s.content.substring(0, 200)}...\n`);
    });
  });
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
📚 BookMe — Transform Files into Books

Usage:
  aiox bookme <command> [options]

Commands:
  create <title>              Create new book
  process <id> [--content]    Structure content into chapters
  edit <id>                   Edit book chapters/sections
  export <id>                 Export to PDF/HTML/Markdown
  list                        List all books
  view <id>                   View book content

Options:
  --drive URL                 Google Drive URL
  --author NAME               Book author
  --description TEXT          Book description
  --content FILE              Content file to process
  --format FORMAT             Export format (md, html, json, txt)
  --output FILE               Output file path
  --dir DIR                   Projects directory

Examples:
  # Create book from Google Drive
  aiox bookme create "My Book" \\
    --drive "https://drive.google.com/file/d/..." \\
    --author "John Doe"

  # Process content into chapters
  aiox bookme process book_123 --content chapter1.txt

  # Export to formats
  aiox bookme export book_123 --format html --output book.html
  aiox bookme export book_123 --format markdown

  # View book
  aiox bookme view book_123

  # List all books
  aiox bookme list
`);
}

module.exports = { handleBookmeCommand };
