# BookMe Web UI

Interactive web interface for creating, editing, and publishing structured books.

## Features

✅ **Book Creation** — Create new books from Drive files or uploads
✅ **Chapter Management** — Add, edit, delete chapters with auto-save
✅ **Section Editing** — Full-text editing with live preview
✅ **Export** — One-click export to Markdown, HTML, PDF
✅ **Auto-Save** — All changes persist automatically
✅ **Real-Time Preview** — See formatting changes instantly

## Architecture

- **Frontend:** Next.js 14 + React 18
- **Backend:** BookMe Engine (Node.js)
- **Storage:** ProjectManager (file-based)
- **Integration:** Google Drive Worker for file access

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
# Opens at http://localhost:3000
```

## Build & Production

```bash
npm run build
npm start
```

## API Integration

The Web UI communicates with:
- **GET /api/books** — List all books
- **GET /api/books/:id** — Get book content
- **POST /api/books** — Create book
- **PUT /api/books/:id** — Update book
- **DELETE /api/books/:id** — Delete book
- **GET /api/projects** — List projects
- **POST /api/drive/import** — Import from Google Drive

## File Structure

```
src/
├── components/     # React components
├── pages/         # Next.js pages
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
└── styles/        # CSS modules
```

## Usage

1. Open dashboard
2. Create new book or import from Drive
3. Edit chapters and sections
4. Export to desired format
5. Publish or share

---

**BookMe Web UI v1.0** — Transform ideas into beautiful, structured books
