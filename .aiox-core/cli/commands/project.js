'use strict';

const ProjectManager = require('../../../packages/project-manager/src');

async function handleProjectCommand(args) {
  try {
    const subcommand = args._?.[0];
    const projectsDir = args.dir || './projects';
    const manager = new ProjectManager(projectsDir);

    if (!subcommand) {
      showHelp();
      process.exit(0);
    }

    if (subcommand === 'create') {
      await handleCreate(manager, args);
    } else if (subcommand === 'update') {
      await handleUpdate(manager, args);
    } else if (subcommand === 'list') {
      handleList(manager, args);
    } else if (subcommand === 'get') {
      handleGet(manager, args);
    } else if (subcommand === 'delete') {
      handleDelete(manager, args);
    } else if (subcommand === 'export') {
      handleExport(manager, args);
    } else if (subcommand === 'import') {
      handleImport(manager, args);
    } else if (subcommand === 'stats') {
      handleStats(manager);
    } else {
      console.error(`Unknown subcommand: ${subcommand}`);
      showHelp();
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Project command failed: ${error.message}`);
    if (args.verbose) console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Create new project
 */
function handleCreate(manager, args) {
  const title = args.title || args._?.[1] || '';
  const description = args.description || '';
  const driveUrl = args.drive || '';

  if (!title) {
    console.error('❌ Title required: aiox project create "Project Title" [--description desc] [--drive url]');
    process.exit(1);
  }

  const project = manager.createProject({
    title,
    description,
    driveUrl: driveUrl || null,
  });

  console.log('✅ Project created');
  console.log(`📋 ID: ${project.id}`);
  console.log(`📝 Title: ${project.title}`);
  if (project.description) console.log(`📖 Description: ${project.description}`);
  if (project.driveUrl) {
    console.log(`🔗 Drive File: ${project.driveFileInfo.type}`);
    console.log(`   File ID: ${project.driveFileId}`);
  }
  console.log(`⏰ Created: ${new Date(project.createdAt).toLocaleString()}`);
}

/**
 * Update project (auto-save on each field)
 */
function handleUpdate(manager, args) {
  const projectId = args._?.[1];

  if (!projectId) {
    console.error('❌ Project ID required: aiox project update <id> --title "New Title"');
    process.exit(1);
  }

  const project = manager.getProject(projectId);
  if (!project) {
    console.error(`❌ Project not found: ${projectId}`);
    process.exit(1);
  }

  const updates = {};

  if (args.title) updates.title = args.title;
  if (args.description) updates.description = args.description;
  if (args.drive) updates.driveUrl = args.drive;

  if (Object.keys(updates).length === 0) {
    console.error('❌ No updates provided. Use --title, --description, or --drive');
    process.exit(1);
  }

  const updated = manager.updateProject(projectId, updates);

  console.log('✅ Project updated (auto-saved)');
  if (updates.title) console.log(`📝 Title: ${updated.title}`);
  if (updates.description) console.log(`📖 Description: ${updated.description}`);
  if (updates.drive) {
    console.log(`🔗 Drive File: ${updated.driveFileInfo.type}`);
    console.log(`   File Type: ${updated.fileType}`);
  }
  console.log(`⏰ Updated: ${new Date(updated.updatedAt).toLocaleString()}`);
}

/**
 * List projects
 */
function handleList(manager, args) {
  const projects = manager.listProjects({
    fileType: args.type || null,
    hasDrive: args['with-drive'] || false,
    search: args.search || null,
  });

  if (projects.length === 0) {
    console.log('📭 No projects found');
    process.exit(0);
  }

  console.log(`\n📁 Projects (${projects.length})\n`);

  projects.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.title}`);
    console.log(`   ID: ${p.id}`);
    if (p.description) console.log(`   📖 ${p.description}`);
    if (p.driveUrl) {
      console.log(`   🔗 Drive: ${p.fileType || 'unknown'} file`);
    }
    console.log(`   ⏰ ${new Date(p.updatedAt).toLocaleString()}`);
    console.log('');
  });
}

/**
 * Get project details
 */
function handleGet(manager, args) {
  const projectId = args._?.[1];

  if (!projectId) {
    console.error('❌ Project ID required: aiox project get <id>');
    process.exit(1);
  }

  const project = manager.getProject(projectId);
  if (!project) {
    console.error(`❌ Project not found: ${projectId}`);
    process.exit(1);
  }

  console.log('\n📋 Project Details\n');
  console.log(`ID:          ${project.id}`);
  console.log(`Title:       ${project.title}`);
  console.log(`Description: ${project.description || '(none)'}`);

  if (project.driveUrl) {
    console.log('\n🔗 Google Drive Integration');
    console.log(`   URL:      ${project.driveUrl}`);
    console.log(`   File ID:  ${project.driveFileId}`);
    console.log(`   Type:     ${project.driveFileInfo.type}`);
    console.log(`   File Format: ${project.fileType}`);

    if (project.metadata.isNativeDocument) {
      console.log(`   Native:   Yes (Google Doc/Sheet/Slide)`);
    }
  }

  console.log(`\n⏰ Created:   ${new Date(project.createdAt).toLocaleString()}`);
  console.log(`⏰ Updated:   ${new Date(project.updatedAt).toLocaleString()}`);
  console.log('');
}

/**
 * Delete project
 */
function handleDelete(manager, args) {
  const projectId = args._?.[1];

  if (!projectId) {
    console.error('❌ Project ID required: aiox project delete <id>');
    process.exit(1);
  }

  const success = manager.deleteProject(projectId);

  if (!success) {
    console.error(`❌ Project not found: ${projectId}`);
    process.exit(1);
  }

  console.log(`✅ Project deleted: ${projectId}`);
}

/**
 * Export project
 */
function handleExport(manager, args) {
  const projectId = args._?.[1];

  if (!projectId) {
    console.error('❌ Project ID required: aiox project export <id> [--output file.json]');
    process.exit(1);
  }

  const json = manager.exportProject(projectId);
  const output = args.output || `${projectId}.json`;

  const fs = require('fs');
  fs.writeFileSync(output, json, 'utf8');

  console.log(`✅ Exported to ${output}`);
}

/**
 * Import project
 */
function handleImport(manager, args) {
  const file = args._?.[1] || args.file;

  if (!file) {
    console.error('❌ File required: aiox project import <file.json>');
    process.exit(1);
  }

  const fs = require('fs');
  if (!fs.existsSync(file)) {
    console.error(`❌ File not found: ${file}`);
    process.exit(1);
  }

  const json = fs.readFileSync(file, 'utf8');
  const project = manager.importProject(json);

  console.log('✅ Project imported');
  console.log(`📋 ID: ${project.id}`);
  console.log(`📝 Title: ${project.title}`);
}

/**
 * Project statistics
 */
function handleStats(manager) {
  const stats = manager.getStats();

  console.log('\n📊 Project Statistics\n');
  console.log(`Total Projects: ${stats.totalProjects}`);
  console.log(`With Drive URL: ${stats.withDriveUrl}`);

  console.log('\nBy File Type:');
  Object.entries(stats.byFileType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  if (stats.lastModified) {
    console.log(`\nLast Modified: ${stats.lastModified.toLocaleString()}`);
  }
  console.log('');
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
📁 Project Manager

Usage:
  aiox project <command> [options]

Commands:
  create <title>              Create new project
  update <id> [options]       Update project (auto-save)
  list [options]              List all projects
  get <id>                    Get project details
  delete <id>                 Delete project
  export <id> [--output file] Export to JSON
  import <file>               Import from JSON
  stats                       Show statistics

Options:
  --title TEXT                Project title
  --description TEXT          Project description
  --drive URL                 Google Drive URL
  --type TYPE                 Filter by file type (document, spreadsheet, presentation, generic)
  --with-drive                Only show projects with Drive URLs
  --search QUERY              Search projects by title/description
  --output FILE               Output file path
  --dir DIR                   Projects directory (default: ./projects)

Examples:
  # Create project
  aiox project create "BookMe v2" \\
    --description "New book writing platform" \\
    --drive "https://drive.google.com/file/d/..."

  # Update project (each field auto-saves)
  aiox project update proj_1234567_abc --title "Updated Title"
  aiox project update proj_1234567_abc --drive "https://drive.google.com/..."

  # List projects
  aiox project list
  aiox project list --with-drive
  aiox project list --search "book"

  # Get project details
  aiox project get proj_1234567_abc

  # Export/Import
  aiox project export proj_1234567_abc --output backup.json
  aiox project import backup.json

  # Statistics
  aiox project stats

Notes:
  - Auto-save triggers on any field update
  - Google Drive URLs auto-extract file metadata
  - Supports all file types: documents, spreadsheets, presentations, audio, video, PDF, etc.
`);
}

module.exports = { handleProjectCommand };
