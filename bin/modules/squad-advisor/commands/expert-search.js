const SquadManager = require('../lib/squad-manager');

class ExpertSearchHandler {
  async handler(domain, options) {
    try {
      console.log(`\n🔍 Searching for experts in: "${domain}"\n`);

      const squadManager = new SquadManager();
      const results = squadManager.searchExperts(domain, options.squad);

      if (results.length === 0) {
        console.log('No experts found for this domain.\n');
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(`Found ${results.length} experts:\n`);

        results.forEach((expert, idx) => {
          console.log(`${idx + 1}. ${expert.name}`);
          console.log(`   Squad: ${expert.squad}`);
          console.log(`   Expertise: ${expert.expertise.join(', ')}`);
          console.log(`   Collection: ${expert.collection}`);
          console.log();
        });
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
}

module.exports = new ExpertSearchHandler();
