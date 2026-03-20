const fs = require('fs');
const path = require('path');
const SquadManager = require('../lib/squad-manager');
const RoundtableOrchestrator = require('../lib/roundtable-orchestrator');
const SpecGenerator = require('../lib/spec-generator');
const StoryCreator = require('../lib/story-creator');

class NewProjectHandler {
  async handler(description, options) {
    try {
      console.log('\n🚀 Squad Advisor — Starting New Project\n');

      // Step 1: Parse project description
      console.log('📋 Analyzing project description...');
      const projectInfo = await this.parseProjectDescription(description);
      const projectName = options.projectName || projectInfo.slug;

      console.log(`✓ Project: ${projectName}`);
      console.log(`✓ Identified domains: ${projectInfo.domains.join(', ')}\n`);

      // Step 2: Find top 3 experts per domain
      console.log('🔍 Searching for top 3 experts per domain...');
      const squadManager = new SquadManager();
      const selectedExperts = await this.findTopExperts(projectInfo.domains, squadManager);

      console.log('✓ Selected experts:');
      selectedExperts.forEach((exp, idx) => {
        console.log(`  ${idx + 1}. ${exp.name} (${exp.expertise.join(', ')})`);
      });
      console.log();

      // Step 3: Clone experts (load from Brain Factory)
      console.log('🧠 Cloning selected experts from Brain Factory...');
      const clonedExperts = await this.cloneExperts(selectedExperts);
      console.log(`✓ Cloned ${clonedExperts.length} experts\n`);

      if (options.skipRoundtable) {
        console.log('⏭️  Skipping roundtable (--skip-roundtable flag set)\n');
        return;
      }

      // Step 4: Orchestrate roundtable discussion
      console.log('💬 Orchestrating expert roundtable discussion...');
      const roundtableOrchestrator = new RoundtableOrchestrator();
      const roundtableId = `roundtable_${projectName}_${Date.now()}`;

      const roundtableOutput = await roundtableOrchestrator.orchestrate({
        id: roundtableId,
        projectName,
        projectDescription: description,
        experts: clonedExperts,
        rounds: 3,
      });

      console.log('✓ Roundtable completed\n');

      // Step 5: Generate auto-evolved spec
      console.log('📝 Generating auto-evolutionary specification...');
      const specGenerator = new SpecGenerator();
      const spec = await specGenerator.generate({
        projectName,
        description,
        roundtableOutput,
        experts: clonedExperts,
      });

      console.log('✓ Spec generated\n');

      // Step 6: Save outputs
      const outputDir = options.outputDir || path.join('docs/stories', projectName.replace(/\s+/g, '-').toLowerCase());
      await this.saveOutputs(outputDir, projectName, roundtableOutput, spec);

      // Step 7: Create initial stories
      console.log('📚 Creating story backlog from auto-evolved spec...');
      const storyCreator = new StoryCreator();
      const stories = await storyCreator.createStories({
        projectName,
        spec,
        outputDir,
      });

      console.log(`✓ Created ${stories.length} stories:\n`);
      stories.forEach((story, idx) => {
        console.log(`  ${idx + 1}. ${story.title}`);
      });

      console.log('\n✅ Project setup complete!\n');
      console.log('Next steps:');
      console.log(`  1. Review spec: ${path.join(outputDir, 'spec-auto-evolved.md')}`);
      console.log(`  2. Review roundtable: ${path.join(outputDir, 'roundtable-discussion.md')}`);
      console.log(`  3. Review evolution rules: ${path.join(outputDir, 'project-evolution.yaml')}`);
      console.log('  4. Assign stories to @dev for implementation\n');

    } catch (error) {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  }

  async parseProjectDescription(description) {
    // Simple parsing - in real implementation, could use Claude for deeper analysis
    const domainKeywords = {
      'business_growth': ['scaling', 'gtm', 'market', 'growth', 'founder', 'startup', 'revenue'],
      'technical_architecture': ['architecture', 'backend', 'system', 'database', 'performance', 'scalability'],
      'ai_ml': ['ai', 'ml', 'machine learning', 'neural', 'model', 'prediction', 'algorithm'],
      'product_design': ['ui', 'ux', 'design', 'interface', 'user', 'experience', 'product'],
      'leadership_culture': ['team', 'culture', 'organization', 'leadership', 'people', 'structure'],
      'marketing_copywriting': ['marketing', 'messaging', 'positioning', 'funnel', 'copy', 'conversion'],
      'research_analytics': ['data', 'analytics', 'metrics', 'research', 'measurement', 'kpi'],
      'finance_operations': ['economics', 'pricing', 'operations', 'finance', 'cost', 'unit'],
    };

    const lowerDesc = description.toLowerCase();
    const identifiedDomains = [];

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(kw => lowerDesc.includes(kw))) {
        identifiedDomains.push(domain);
      }
    }

    // Always include primary domains
    if (identifiedDomains.length === 0) {
      identifiedDomains.push('product_design', 'technical_architecture');
    }

    const slug = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join('-');

    return {
      description,
      domains: identifiedDomains.slice(0, 3),
      slug: slug || 'project',
    };
  }

  async findTopExperts(domains, squadManager) {
    const experts = [];
    const selectedSlugs = new Set();

    for (const domain of domains) {
      const squad = squadManager.getSquad(domain);
      if (squad) {
        squad.members.slice(0, 2).forEach(member => {
          if (!selectedSlugs.has(member.slug)) {
            experts.push(member);
            selectedSlugs.add(member.slug);
          }
        });
      }
    }

    return experts.slice(0, 3);
  }

  async cloneExperts(experts) {
    // In real implementation, this loads clones from Brain Factory (outputs/minds/{slug}/)
    return experts.map(expert => ({
      ...expert,
      systemPrompt: `You are ${expert.name}, an expert in ${expert.expertise.join(', ')}.
        Respond from your unique perspective and expertise.
        Be direct, practical, and highlight non-obvious insights.`,
      collection: `brain_clone_${expert.slug}`,
      ready: true,
    }));
  }

  async saveOutputs(outputDir, projectName, roundtableOutput, spec) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save roundtable discussion
    const roundtableFile = path.join(outputDir, 'roundtable-discussion.md');
    fs.writeFileSync(roundtableFile, roundtableOutput.markdown);

    // Save auto-evolved spec
    const specFile = path.join(outputDir, 'spec-auto-evolved.md');
    fs.writeFileSync(specFile, spec.markdown);

    // Save evolution rules
    const evolutionFile = path.join(outputDir, 'project-evolution.yaml');
    fs.writeFileSync(evolutionFile, spec.evolutionYaml);

    console.log(`✓ Outputs saved to: ${outputDir}`);
  }
}

module.exports = new NewProjectHandler();
