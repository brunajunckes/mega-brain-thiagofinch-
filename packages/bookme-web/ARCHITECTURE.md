# BookMe Web UI — Architecture & Integration Plan

## System Overview

```
User Browser
    ↓
Next.js Web UI (React)
    ↓
API Routes (Node.js)
    ↓
BookMe Engine
    ├── BookProcessor
    ├── BookExporter
    └── BookIntegrator
    ↓
ProjectManager
    ↓
GoogleDriveWorker
    ↓
File System / Google Drive
```

## Component Hierarchy

```
App (pages/_app.tsx)
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   └── Navigation
│   └── Sidebar
│       └── BookList
├── Pages
│   ├── Dashboard (/dashboard)
│   │   └── BookGrid
│   ├── Editor (/editor/:bookId)
│   │   ├── ChapterPanel (left)
│   │   ├── Editor (center)
│   │   └── Preview (right)
│   └── Create (/create)
│       └── ImportForm
└── Footer
```

## Data Flow

### 1. Create Book
```
User Input (Drive URL / File Upload)
  ↓
BookCreate Component
  ↓
POST /api/books {title, driveUrl, author}
  ↓
BookIntegrator.integrateFromDrive()
  ↓
Save to ProjectManager
  ↓
Return book ID to UI
  ↓
Redirect to Editor
```

### 2. Edit Book
```
User Edits Section
  ↓
SectionEditor Component (onChange)
  ↓
Auto-save trigger (debounced 1s)
  ↓
PUT /api/books/:id/chapters/:chapterId/sections/:sectionId
  ↓
BookProcessor.editSection()
  ↓
BookIntegrator.updateBook()
  ↓
Save to disk
  ↓
Return updated content
  ↓
Sync UI state
```

### 3. Export Book
```
User Clicks Export
  ↓
Export Modal (select format)
  ↓
POST /api/books/:id/export {format: 'html|md|json|txt'}
  ↓
BookIntegrator.exportBook()
  ↓
BookExporter.exportToFile()
  ↓
Download file
```

## API Endpoints

### Books
```
GET    /api/books                    # List all books
POST   /api/books                    # Create book
GET    /api/books/:id                # Get book content
PUT    /api/books/:id                # Update book metadata
DELETE /api/books/:id                # Delete book
```

### Chapters
```
POST   /api/books/:id/chapters                      # Add chapter
PUT    /api/books/:id/chapters/:chapterId           # Edit chapter
DELETE /api/books/:id/chapters/:chapterId           # Delete chapter
```

### Sections
```
PUT    /api/books/:id/chapters/:chapterId/sections/:sectionId  # Edit section
```

### Export
```
POST   /api/books/:id/export         # Export to file
GET    /api/books/:id/preview/:format # Get preview (HTML/Markdown)
```

### Projects
```
GET    /api/projects                 # List projects
POST   /api/projects                 # Create project
GET    /api/projects/:id             # Get project
```

### Drive
```
POST   /api/drive/extract            # Extract metadata from Drive URL
POST   /api/drive/import             # Import file from Drive
```

## State Management

Using React Hooks for simplicity:

```javascript
// useBook hook
const { book, loading, error } = useBook(bookId);
const { updateBook, deleteBook } = useBookActions(bookId);

// useChapters hook
const { chapters, addChapter, editChapter, deleteChapter } = useChapters(bookId);

// useSections hook
const { sections, editSection } = useSections(bookId, chapterId);
```

## Auto-Save Strategy

```
User Input
  ↓ (onChange triggered)
Debounce (1000ms)
  ↓
Check if changed from last save
  ↓
If yes: PUT /api/books/:id/...
If no: Skip save
  ↓
Show "Saving..." indicator
  ↓
On success: Show "Saved" checkmark
On error: Show toast with retry
```

## File Organization

```
src/
├── components/
│   ├── BookDashboard.tsx        # Main dashboard grid
│   ├── BookEditor.tsx            # Main editor layout
│   ├── ChapterList.tsx           # Chapter sidebar
│   ├── ChapterPanel.tsx          # Chapter editor
│   ├── SectionEditor.tsx         # Section text editor
│   ├── Preview.tsx               # Live preview pane
│   ├── ExportModal.tsx           # Export dialog
│   ├── ImportForm.tsx            # Create/import form
│   └── Common/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── LoadingSpinner.tsx
├── pages/
│   ├── _app.tsx                  # Next.js app wrapper
│   ├── index.tsx                 # Home page
│   ├── dashboard.tsx             # Book list
│   ├── editor/[id].tsx           # Editor page
│   ├── create.tsx                # Create/import page
│   └── api/
│       ├── books.ts
│       ├── projects.ts
│       ├── drive.ts
│       └── export.ts
├── hooks/
│   ├── use-book.ts              # Book data & operations
│   ├── use-chapters.ts          # Chapter operations
│   ├── use-sections.ts          # Section operations
│   └── use-debounce.ts          # Debounce utility
├── utils/
│   ├── api-client.ts            # HTTP client
│   ├── format.ts                # Text formatting
│   └── validators.ts            # Input validation
├── styles/
│   ├── global.css
│   ├── editor.module.css
│   └── dashboard.module.css
└── types/
    ├── book.ts
    ├── project.ts
    └── api.ts
```

## Integration Points

### With BookMe Engine
```javascript
import { BookIntegrator } from '@aiox-fullstack/bookme-engine';

// In API routes
const integrator = new BookIntegrator(baseDir);
const book = integrator.createBookFromProject(projectId, options);
const updated = integrator.updateBook(bookId, updates);
integrator.exportBook(bookId, outputDir);
```

### With ProjectManager
```javascript
import { ProjectManager } from '@aiox-fullstack/project-manager';

// In API routes
const pm = new ProjectManager(projectsDir);
const project = pm.createProject({title, description, driveUrl});
const projects = pm.listProjects();
```

### With GoogleDriveWorker
```javascript
import { DriveExtractor, DriveDownloader } from '@aiox-fullstack/google-drive-worker';

// In API routes
const fileId = DriveExtractor.extractFileId(driveUrl);
const content = await DriveDownloader.download(driveUrl);
```

## Performance Optimizations

1. **Code Splitting** — Each page lazy-loaded
2. **Image Optimization** — Next.js Image component
3. **Auto-Save Debouncing** — 1s delay to reduce saves
4. **Chapter Virtual Scrolling** — For large books (100+ chapters)
5. **Preview Caching** — Cache preview until content changes
6. **API Response Caching** — 30s cache for book list

## Security Considerations

1. **Authentication** — (To be implemented)
2. **CSRF Protection** — Next.js built-in
3. **Input Validation** — Server-side in API routes
4. **XSS Prevention** — React escaping + DOMPurify for user content
5. **Rate Limiting** — (To be implemented)

## Deployment Strategy

1. Build Next.js app: `npm run build`
2. Package with BookMe packages
3. Deploy to Node.js hosting (Vercel, Railway, VPS)
4. Set environment variables for API endpoint
5. Run migrations (create /bookme-projects directory)

## Testing Strategy

### Unit Tests
- Component rendering
- Hook logic
- Utility functions
- API client

### Integration Tests
- Create book → Edit → Export flow
- Auto-save persistence
- Multi-chapter navigation
- Export format verification

### E2E Tests
- Complete user journey (create → edit → export)
- Cross-browser testing
- Mobile responsiveness

---

**Phase:** Story 4.4 — BookMe Web UI
**Status:** Architecture → Component Implementation → Integration → Testing → Deployment
