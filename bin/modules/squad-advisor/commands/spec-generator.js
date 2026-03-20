const fs = require('fs');
const path = require('path');
const SpecGenerator = require('../lib/spec-generator');

class SpecGeneratorHandler {
  async handler(roundtableId, options) {
    try {
      console.log(`\n📝 Generating Spec from Roundtable: ${roundtableId}\n`);

      // In production, would load roundtable from Redis
      // For now, use options.outputFile or generate

      const generator = new SpecGenerator();
      const spec = await generator.generate({
        projectName: roundtableId,
        description: 'Project from roundtable',
        roundtableOutput: {
          synthesis: {
            recommendation: 'Build lean MVP, validate assumptions',
          },
        },
      });

      const outputFile = options.outputFile || `spec-${roundtableId}.md`;
      fs.writeFileSync(outputFile, spec.markdown);

      console.log(`✓ Spec generated: ${outputFile}\n`);

    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
}

module.exports = new SpecGeneratorHandler();
