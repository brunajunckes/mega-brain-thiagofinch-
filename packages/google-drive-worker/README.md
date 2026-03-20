# Google Drive Worker

Access and download files from Google Drive URLs without requiring official API keys.

**Part of Story 4.1** — Autonomous file access and management capability.

## Features

### 1. DriveExtractor
Extract file information and generate direct access URLs:
- Extract File ID from share links
- Extract Folder ID from folder URLs
- Generate direct download URLs
- Generate export URLs for Google native documents (Docs, Sheets, Slides)
- Parse URLs to detect type (file, folder, document, spreadsheet, presentation)
- Validate Google Drive URLs
- Get available export formats per file type

### 2. DriveDownloader
Download files from Google Drive:
- Direct file downloads (no authentication required)
- Handle large file confirmation cookies
- Export Google native documents to various formats (PDF, DOCX, CSV, XLSX, PPTX, etc.)
- Automatic retry logic with exponential backoff
- Batch download support
- Get file information without downloading
- Configurable timeouts and retry attempts

## Installation

```bash
npm install
```

## Usage

### Extract File Information

```javascript
const { DriveExtractor } = require('@aiox-fullstack/core/google-drive-worker');

// Extract file ID from URL
const fileId = DriveExtractor.extractFileId('https://drive.google.com/file/d/1ABC/view');
// → '1ABC'

// Generate direct download URL
const url = DriveExtractor.getDirectDownloadUrl('https://drive.google.com/file/d/1ABC/view');
// → 'https://drive.google.com/uc?export=download&id=1ABC'

// Export Google Doc as PDF
const pdfUrl = DriveExtractor.getExportUrl('https://docs.google.com/document/d/1ABC/edit', 'pdf');

// Export Google Sheet as CSV
const csvUrl = DriveExtractor.getExportUrl('https://docs.google.com/spreadsheets/d/1ABC/edit', 'csv');

// Parse URL and get all information
const parsed = DriveExtractor.parseUrl('https://drive.google.com/file/d/1ABC/view');
// {
//   originalUrl: '...',
//   type: 'file',
//   id: '1ABC',
//   isFolder: false,
//   isDoc: false,
//   isSheet: false,
//   isSlide: false,
//   directUrl: '...'
// }

// Get available export formats
const formats = DriveExtractor.getExportFormats('document');
// ['pdf', 'docx', 'odt', 'rtf', 'txt', 'epub', 'zip']
```

### Download Files

```javascript
const { DriveDownloader } = require('@aiox-fullstack/core/google-drive-worker');

const downloader = new DriveDownloader({
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000
});

// Download a file
const buffer = await downloader.download('https://drive.google.com/file/d/1ABC/view');

// Download with specific export format
const pdfBuffer = await downloader.download('https://docs.google.com/document/d/1ABC/edit', 'pdf');

// Get file info without downloading
const info = downloader.getFileInfo('https://drive.google.com/file/d/1ABC/view');
// {
//   fileId: '1ABC',
//   type: 'file',
//   isNativeDocument: false,
//   availableFormats: [],
//   directUrl: '...'
// }

// Batch download multiple files
const urls = [
  'https://drive.google.com/file/d/1ABC/view',
  'https://drive.google.com/file/d/2DEF/view'
];

const results = await downloader.downloadBatch(urls);
// {
//   success: {
//     'https://...': <Buffer>,
//     'https://...': <Buffer>
//   },
//   errors: {
//     'https://...': 'error message'
//   }
// }
```

## Supported Google Drive URLs

### Regular Files
```
https://drive.google.com/file/d/FILE_ID/view
https://drive.google.com/file/d/FILE_ID/
```

### Folders
```
https://drive.google.com/drive/folders/FOLDER_ID/
```

### Google Docs
```
https://docs.google.com/document/d/FILE_ID/edit
```

### Google Sheets
```
https://docs.google.com/spreadsheets/d/FILE_ID/edit
```

### Google Slides
```
https://docs.google.com/presentation/d/FILE_ID/edit
```

### Alternative Format
```
https://drive.google.com/?id=FILE_ID
```

## Export Formats by Document Type

### Document
- pdf, docx, odt, rtf, txt, epub, zip

### Spreadsheet
- csv, tsv, xlsx, ods, pdf, xls, zip

### Presentation
- pptx, odp, pdf, txt, zip

## How It Works

### Direct Download Mechanism
The worker uses Google Drive's public export endpoints that don't require authentication:
- `https://drive.google.com/uc?export=download&id={fileId}` — Direct file download
- `https://docs.google.com/{docType}/d/{fileId}/export?format={format}` — Document export

### Cookie Handling
For large files, Google Drive shows a confirmation page. The downloader:
1. Detects the confirmation cookie from the response
2. Automatically retries with the confirmation cookie
3. Handles the download seamlessly

### Retry Logic
Built-in exponential backoff for:
- Connection errors (ECONNRESET, ETIMEDOUT, ECONNREFUSED)
- Rate limiting (429, 503 HTTP errors)
- Configurable max retries and delay

## Testing

```bash
npm test -- packages/google-drive-worker
```

## Architecture

### Layers
- **L1 Extract:** URL parsing and ID extraction
- **L2 Format:** URL generation for direct access and export
- **L3 Download:** File retrieval with retry logic
- **L4 Batch:** Multi-file handling and error aggregation

### Dependencies
- Node.js `https` module (stdlib)
- Node.js `url` module (stdlib)

## CLI Integration

Use with AIOX CLI:
```bash
aiox drive-download <url> [--format pdf] [--output file.pdf]
aiox drive-info <url>
aiox drive-batch <file-with-urls.txt>
```

## Story References

- **Story 2.1:** Repo Analyzer — Provides repo structure for analysis
- **Story 2.2:** Diff Engine — Analyzes file changes
- **Story 2.3:** Decision Engine — Provides recommendations
- **Story 2.4:** Evolution Dashboard — Tracks evolution over time
- **Story 3.1:** Health Reporter — Consolidates metrics
- **Story 4.1:** Google Drive Worker (this module)

---

**Google Drive Worker v1.0**
*No-API file access for Google Drive*
*Story 4.1: Phases 1-3 Complete*
