const fs = require('fs');
const path = require('path');
const StoryCreator = require('../lib/story-creator');

class ProjectKickoffHandler {
  async handler(projectName, options) {
    try {
      console.log(`\n📚 Creating Story Backlog for: ${projectName}\n`);

      const specFile = options.specFile || `docs/stories/${projectName}/spec-auto-evolved.md`;
      const outputDir = path.dirname(specFile);

      if (!fs.existsSync(specFile)) {
        console.error(`❌ Spec file not found: ${specFile}\n`);
        process.exit(1);
      }

      const spec = fs.readFileSync(specFile, 'utf-8');

      const storyCreator = new StoryCreator();
      const stories = await storyCreator.createStories({
        projectName,
        spec,
        outputDir
      });

      console.log(`✓ Created ${stories.length} stories:\n`);

      stories.forEach((story, idx) => {
        const storyPath = path.join(outputDir, `${story.id}.story.md`);
        console.log(`  ${idx + 1}. ${story.id} — ${story.title}`);
        console.log(`     File: ${storyPath}`);
      });

      console.log('\n✅ Project kickoff complete!\n');
      console.log(`Next: Assign stories to @dev for implementation.\n`);

    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
}

module.exports = new ProjectKickoffHandler();
