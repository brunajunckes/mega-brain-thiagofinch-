const fs = require('fs');
const path = require('path');

class CloneExpertHandler {
  async handler(slug, options) {
    try {
      console.log(`\n🧠 Loading expert clone: ${slug}\n`);

      const clonePath = path.join(process.cwd(), 'outputs/minds', slug);

      if (!fs.existsSync(clonePath)) {
        console.error(`❌ Clone not found at: ${clonePath}\n`);
        process.exit(1);
      }

      const systemPromptPath = path.join(clonePath, 'implementation', 'system-prompt.md');
      if (!fs.existsSync(systemPromptPath)) {
        console.error(`❌ System prompt not found at: ${systemPromptPath}\n`);
        process.exit(1);
      }

      const systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');

      console.log(`✓ Clone loaded: ${slug}`);
      console.log(`✓ System prompt loaded (${systemPrompt.length} chars)\n`);
      console.log('Ready for roundtable discussion.\n');

      return {
        slug,
        systemPrompt,
        ready: true
      };

    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
}

module.exports = new CloneExpertHandler();
