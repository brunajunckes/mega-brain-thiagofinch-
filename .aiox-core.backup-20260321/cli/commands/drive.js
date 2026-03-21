'use strict';

const fs = require('fs');
const path = require('path');
const { DriveExtractor, DriveDownloader } = require('../../../packages/google-drive-worker/src');

async function handleDriveCommand(args) {
  try {
    const subcommand = args._?.[0];

    if (!subcommand) {
      showHelp();
      process.exit(0);
    }

    const verbose = args.verbose || args.v || false;

    if (subcommand === 'download') {
      await handleDownload(args, verbose);
    } else if (subcommand === 'info') {
      await handleInfo(args, verbose);
    } else if (subcommand === 'batch') {
      await handleBatch(args, verbose);
    } else if (subcommand === 'export') {
      await handleExport(args, verbose);
    } else {
      console.error(`Unknown subcommand: ${subcommand}`);
      showHelp();
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Drive command failed: ${error.message}`);
    if (args.verbose) console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Download a file from Google Drive
 */
async function handleDownload(args, verbose) {
  const url = args._?.[1];

  if (!url) {
    console.error('❌ URL required: aiox drive download <url> [--output file]');
    process.exit(1);
  }

  if (!DriveExtractor.isValidDriveUrl(url)) {
    console.error('❌ Invalid Google Drive URL');
    process.exit(1);
  }

  if (verbose) console.log(`📥 Downloading from ${url}`);

  const downloader = new DriveDownloader({
    maxRetries: args.retries || 3,
    timeout: args.timeout || 30000,
  });

  const buffer = await downloader.download(url);
  const filename = args.output || getFilenameFromUrl(url);

  fs.writeFileSync(filename, buffer);
  console.log(`✅ Downloaded ${buffer.length} bytes to ${filename}`);
}

/**
 * Get file information
 */
function handleInfo(args, verbose) {
  const url = args._?.[1];

  if (!url) {
    console.error('❌ URL required: aiox drive info <url>');
    process.exit(1);
  }

  if (!DriveExtractor.isValidDriveUrl(url)) {
    console.error('❌ Invalid Google Drive URL');
    process.exit(1);
  }

  const downloader = new DriveDownloader();
  const info = downloader.getFileInfo(url);

  console.log('\n📄 File Information');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`File ID:        ${info.fileId}`);
  console.log(`Type:           ${info.type}`);
  console.log(`Native Document: ${info.isNativeDocument ? 'Yes' : 'No'}`);

  if (info.isNativeDocument) {
    console.log(`\n📋 Available Formats:`);
    info.availableFormats.forEach(format => {
      console.log(`  • ${format}`);
    });
  }

  console.log(`\n🔗 Direct URL: ${info.directUrl}`);
  console.log('');
}

/**
 * Download multiple files from a file list
 */
async function handleBatch(args, verbose) {
  const inputFile = args._?.[1];

  if (!inputFile) {
    console.error('❌ Input file required: aiox drive batch <urls.txt>');
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`❌ File not found: ${inputFile}`);
    process.exit(1);
  }

  const urls = fs.readFileSync(inputFile, 'utf-8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => line.trim());

  if (urls.length === 0) {
    console.error('❌ No URLs found in input file');
    process.exit(1);
  }

  console.log(`📦 Downloading ${urls.length} files...`);

  const downloader = new DriveDownloader({
    maxRetries: args.retries || 3,
    timeout: args.timeout || 30000,
  });

  const results = await downloader.downloadBatch(urls);

  const outputDir = args.output || './drive-downloads';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let successCount = 0;
  Object.entries(results.success).forEach(([url, buffer]) => {
    const filename = path.join(outputDir, getFilenameFromUrl(url));
    fs.writeFileSync(filename, buffer);
    console.log(`✅ ${filename} (${buffer.length} bytes)`);
    successCount++;
  });

  if (Object.keys(results.errors).length > 0) {
    console.log('\n⚠️ Errors:');
    Object.entries(results.errors).forEach(([url, error]) => {
      console.log(`❌ ${url}: ${error}`);
    });
  }

  console.log(`\n✅ Downloaded ${successCount}/${urls.length} files to ${outputDir}`);
}

/**
 * Export Google Doc/Sheet/Slide to specific format
 */
async function handleExport(args, verbose) {
  const url = args._?.[1];
  const format = args.format || args._?.[2] || 'pdf';

  if (!url) {
    console.error('❌ URL required: aiox drive export <url> [--format pdf]');
    process.exit(1);
  }

  if (!DriveExtractor.isValidDriveUrl(url)) {
    console.error('❌ Invalid Google Drive URL');
    process.exit(1);
  }

  if (verbose) console.log(`📥 Exporting to ${format}`);

  const downloader = new DriveDownloader({
    maxRetries: args.retries || 3,
    timeout: args.timeout || 30000,
  });

  const buffer = await downloader.download(url, format);
  const filename = args.output || `export.${format}`;

  fs.writeFileSync(filename, buffer);
  console.log(`✅ Exported to ${filename} (${buffer.length} bytes)`);
}

/**
 * Extract filename from Google Drive URL
 */
function getFilenameFromUrl(url) {
  const fileId = DriveExtractor.extractFileId(url);
  if (!fileId) return 'download';

  // Try to get a meaningful name
  if (url.includes('document')) return `${fileId}.pdf`;
  if (url.includes('spreadsheets')) return `${fileId}.xlsx`;
  if (url.includes('presentation')) return `${fileId}.pptx`;
  return fileId;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
📁 Google Drive Worker

Usage:
  aiox drive <command> [options]

Commands:
  download <url>           Download a file from Google Drive
  info <url>              Show file information
  export <url> [format]   Export Google Doc/Sheet/Slide
  batch <urls.txt>        Download multiple files from a list

Options:
  --output FILE           Output filename or directory
  --format FORMAT         Export format (pdf, csv, docx, xlsx, etc)
  --retries N             Max retry attempts (default: 3)
  --timeout MS            Request timeout in milliseconds (default: 30000)
  --verbose, -v           Show detailed output

Examples:
  aiox drive download https://drive.google.com/file/d/1ABC/view
  aiox drive info https://docs.google.com/document/d/1ABC/edit
  aiox drive export https://docs.google.com/spreadsheets/d/1ABC/edit --format csv
  aiox drive batch urls.txt --output ./downloads

Supported URL Formats:
  • https://drive.google.com/file/d/FILE_ID/view
  • https://drive.google.com/drive/folders/FOLDER_ID/
  • https://docs.google.com/document/d/FILE_ID/edit
  • https://docs.google.com/spreadsheets/d/FILE_ID/edit
  • https://docs.google.com/presentation/d/FILE_ID/edit
`);
}

module.exports = { handleDriveCommand };
