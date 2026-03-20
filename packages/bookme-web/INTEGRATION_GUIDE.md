# BookMe Web UI — Integration Guide

## Quick Start (Developer)

### 1. Setup

```bash
# Install dependencies
cd packages/bookme-web
npm install

# Start dev server
npm run dev
```

Opens at `http://localhost:3000`

### 2. Create First API Route

Example: `pages/api/books.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { BookIntegrator } from '@aiox-fullstack/bookme-engine';

const integrator = new BookIntegrator('./data');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const books = integrator.listBooks();
    res.status(200).json(books);
  } else if (req.method === 'POST') {
    const { title, author, description, driveUrl } = req.body;
    const project = pm.createProject({ title, description, driveUrl });
    const book = integrator.createBookFromProject(project.id, { author });
    res.status(201).json(book);
  }
}
```

### 3. Create Component

Example: `components/BookDashboard.tsx`

```typescript
import { useEffect, useState } from 'react';

interface Book {
  id: string;
  title: string;
  author: string;
  chapters: number;
  words: number;
}

export function BookDashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/books')
      .then(r => r.json())
      .then(setBooks)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid">
      {books.map(book => (
        <div key={book.id} className="card">
          <h3>{book.title}</h3>
          <p>By {book.author}</p>
          <p>{book.chapters} chapters • {book.words} words</p>
          <a href={`/editor/${book.id}`}>Edit</a>
        </div>
      ))}
    </div>
  );
}
```

### 4. Create Page

Example: `pages/dashboard.tsx`

```typescript
import { BookDashboard } from '../components/BookDashboard';

export default function DashboardPage() {
  return (
    <div>
      <h1>My Books</h1>
      <BookDashboard />
    </div>
  );
}
```

## Implementation Checklist

### Phase 1: Core Pages (Week 1)
- [ ] Landing page (`/`)
- [ ] Dashboard page (`/dashboard`)
- [ ] Create/Import page (`/create`)
- [ ] Editor page (`/editor/:id`)

### Phase 2: Core Components (Week 2)
- [ ] BookDashboard
- [ ] BookEditor
- [ ] ChapterList
- [ ] SectionEditor
- [ ] Preview pane
- [ ] ExportModal

### Phase 3: Hooks & Utils (Week 3)
- [ ] useBook hook
- [ ] useChapters hook
- [ ] useSections hook
- [ ] API client utility
- [ ] Auto-save logic

### Phase 4: Integration (Week 4)
- [ ] Connect to BookMe Engine
- [ ] Test full workflows
- [ ] Add error handling
- [ ] Mobile responsiveness

### Phase 5: Deployment (Week 5)
- [ ] Build & test production build
- [ ] Deploy to hosting
- [ ] Setup CI/CD
- [ ] Monitor in production

## Backend Integration Points

### BookIntegrator API

```javascript
// Create book from project
const book = integrator.createBookFromProject(projectId, {
  author: 'John Doe',
});

// Update book
const updated = integrator.updateBook(bookId, {
  title: 'New Title',
  author: 'Jane Doe',
});

// Get workflow status
const status = integrator.getWorkflowStatus(projectId);

// Export book
const result = integrator.exportBook(bookId, outputDir);

// List books
const books = integrator.listBooks();
```

### ProjectManager API

```javascript
const pm = new ProjectManager(projectsDir);

// Create project
const project = pm.createProject({
  title: 'My Book',
  description: 'A test book',
  driveUrl: 'https://drive.google.com/file/d/...',
});

// Get project
const project = pm.getProject(projectId);

// List projects
const projects = pm.listProjects();

// Update project
pm.updateProject(projectId, { title: 'Updated' });
```

### BookProcessor API

```javascript
import { BookProcessor } from '@aiox-fullstack/bookme-engine';

// Add chapter
BookProcessor.addChapter(book, 'Chapter 1', 'Content here');

// Edit chapter
BookProcessor.editChapter(book, chapterId, {
  title: 'Updated Title',
  content: 'New content',
});

// Edit section
BookProcessor.editSection(book, chapterId, sectionId, {
  content: 'Updated section',
});

// Process content
BookProcessor.processContent(book, markdownContent);
```

## File Structure After Setup

```
packages/bookme-web/
├── .next/                          # Build output
├── public/                         # Static assets
├── src/
│   ├── components/
│   │   ├── BookDashboard.tsx
│   │   ├── BookEditor.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── index.tsx
│   │   ├── dashboard.tsx
│   │   ├── create.tsx
│   │   ├── editor
│   │   │   └── [id].tsx
│   │   └── api/
│   │       └── books.ts
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   └── types/
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
BOOKME_DATA_DIR=./data/bookme
PROJECT_DATA_DIR=./data/projects
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test
npm test -- BookDashboard.test.tsx

# Watch mode
npm test -- --watch
```

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Or deploy to hosting (Vercel, Railway, etc)
# See deployment docs for your platform
```

## Troubleshooting

### "Cannot find module '@aiox-fullstack/bookme-engine'"

```bash
# Link local packages
npm link ../bookme-engine
npm link ../project-manager
npm link ../google-drive-worker
```

### Port 3000 already in use

```bash
npm run dev -- -p 3001
```

### Changes not appearing

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Docker configuration
- Environment setup
- CI/CD pipeline
- Monitoring & logging
- Database initialization

---

**Next Steps:** Start with Phase 1 pages, then implement components
