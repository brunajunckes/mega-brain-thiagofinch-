# Project Manager

Auto-saving project management with Google Drive integration.

**Features:**
- ✅ Auto-save on any field change
- ✅ Google Drive file integration (all types: docs, audio, PDF, video, etc.)
- ✅ Automatic file type detection
- ✅ Project versioning with timestamps
- ✅ Import/Export functionality
- ✅ Zero external dependencies (except Google Drive Worker)

## Installation

```bash
npm install
```

## Usage

### JavaScript API

```javascript
const { ProjectManager } = require('@aiox-fullstack/project-manager');

const manager = new ProjectManager('./projects');

// Create project
const project = manager.createProject({
  title: 'BookMe v2',
  description: 'New book writing platform',
  driveUrl: 'https://drive.google.com/file/d/...'
});

// Update project (auto-saves)
manager.updateProject(project.id, {
  title: 'Updated Title',
  description: 'New description'
});

// Get project
const p = manager.getProject(project.id);

// List projects
const projects = manager.listProjects({
  fileType: 'document',
  hasDrive: true,
  search: 'book'
});

// Delete project
manager.deleteProject(project.id);

// Export/Import
const json = manager.exportProject(project.id);
manager.importProject(json);

// Statistics
const stats = manager.getStats();
```

### CLI Usage

```bash
# Create project
aiox project create "BookMe v2" \
  --description "New book writing platform" \
  --drive "https://drive.google.com/file/d/..."

# Update project (auto-save)
aiox project update proj_1234567_abc --title "New Title"
aiox project update proj_1234567_abc --drive "https://drive.google.com/file/d/..."

# List projects
aiox project list
aiox project list --with-drive
aiox project list --search "book"
aiox project list --type document

# Get project details
aiox project get proj_1234567_abc

# Delete project
aiox project delete proj_1234567_abc

# Export/Import
aiox project export proj_1234567_abc --output backup.json
aiox project import backup.json

# Statistics
aiox project stats
```

## Supported File Types

The Project Manager automatically detects and categorizes all Google Drive file types:

### Google Native Documents
- **Documents** (Google Docs) → exportable to PDF, DOCX, TXT, etc.
- **Spreadsheets** (Google Sheets) → exportable to CSV, XLSX, ODS, etc.
- **Presentations** (Google Slides) → exportable to PPTX, PDF, ODP, etc.

### Regular Files
- Audio (MP3, WAV, FLAC, OGG, etc.)
- Video (MP4, MOV, AVI, MKV, etc.)
- Documents (PDF, DOCX, ODT, RTF, etc.)
- Images (PNG, JPG, SVG, WEBP, etc.)
- Archives (ZIP, RAR, 7Z, TAR, etc.)
- Any file type Google Drive supports

## Project Structure

Each project is stored as a JSON file with:

```json
{
  "id": "proj_1234567_abc",
  "title": "BookMe v2",
  "description": "New book writing platform",
  "driveUrl": "https://drive.google.com/file/d/...",
  "driveFileId": "1ABC123...",
  "driveFileInfo": {
    "originalUrl": "...",
    "type": "document",
    "id": "1ABC123...",
    "isFolder": false,
    "isDoc": true,
    "isSheet": false,
    "isSlide": false,
    "directUrl": "..."
  },
  "fileType": "document",
  "createdAt": "2026-03-20T17:30:00.000Z",
  "updatedAt": "2026-03-20T17:32:00.000Z",
  "files": [],
  "metadata": {
    "url": "...",
    "extractedAt": "2026-03-20T17:30:00.000Z",
    "type": "document",
    "isNativeDocument": true
  }
}
```

## Auto-Save Behavior

Every field change triggers immediate auto-save:

1. **Create** — Creates project file immediately
2. **Update** — Saves to disk with timestamp
3. **Watch** — Optional file watcher for external changes

## API Reference

### Constructor

```javascript
new ProjectManager(projectsDir = './projects')
```

### Methods

#### `createProject(data)`
Create a new project and save immediately.

**Parameters:**
- `data` (Object) — Initial project data
  - `title` (string) — Project title
  - `description` (string) — Project description
  - `driveUrl` (string) — Google Drive URL

**Returns:** Project object

#### `updateProject(projectId, updates)`
Update project fields with auto-save.

**Parameters:**
- `projectId` (string) — Project ID
- `updates` (Object) — Fields to update

**Returns:** Updated project object

#### `getProject(projectId)`
Get project by ID.

**Returns:** Project object or null

#### `listProjects(filter)`
List projects with optional filtering.

**Parameters:**
- `filter` (Object) — Filter options
  - `fileType` (string) — Filter by file type
  - `hasDrive` (boolean) — Only with Drive URLs
  - `search` (string) — Search query

**Returns:** Array of projects

#### `deleteProject(projectId)`
Delete project.

**Returns:** boolean

#### `exportProject(projectId)`
Export project to JSON string.

**Returns:** JSON string

#### `importProject(jsonData)`
Import project from JSON string.

**Returns:** Project object

#### `getStats()`
Get project statistics.

**Returns:** Stats object with counts by type

## File Types Detected

- `document` — Google Docs or any text document
- `spreadsheet` — Google Sheets or any spreadsheet
- `presentation` — Google Slides or any presentation
- `generic` — Regular files (PDF, images, audio, video, archives, etc.)
- `folder` — Google Drive folders
- `unknown` — Unrecognized types

## Integration with Google Drive Worker

Projects automatically integrate with the Google Drive Worker:

1. When a Drive URL is added, file metadata is extracted
2. File ID is parsed automatically
3. File type is detected
4. Export formats are available for native documents

Example:

```javascript
const manager = new ProjectManager();

// Create with Drive URL
const project = manager.createProject({
  title: 'Research',
  driveUrl: 'https://docs.google.com/document/d/1ABC/edit'
});

// Access extracted metadata
console.log(project.driveFileInfo.type); // 'document'
console.log(project.fileType); // 'document'
console.log(project.driveFileId); // '1ABC'
```

## Testing

```bash
npm test -- packages/project-manager
```

## Architecture

### Layers
- **L1 (Create):** Project creation and initialization
- **L2 (Store):** File I/O and persistence
- **L3 (Extract):** Drive metadata extraction via Google Drive Worker
- **L4 (Manage):** CRUD operations and filtering

### Dependencies
- `@aiox-fullstack/google-drive-worker` — Drive URL extraction
- Node.js stdlib (`fs`, `path`) — File operations

## Future Enhancements

- Real-time sync with cloud storage
- Collaborative editing hooks
- Project templates
- Version history tracking
- Backup and restore functionality

---

**Project Manager v1.0**
*Auto-saving project management with Drive integration*
