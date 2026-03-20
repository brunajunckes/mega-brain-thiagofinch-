const fs = require('fs');
const path = require('path');

class SquadManager {
  constructor() {
    this.squads = this.loadSquads();
    this.specialists = this.loadSpecialists();
  }

  loadSquads() {
    const squads = {};
    const squadsDir = path.join(process.cwd(), 'squads');

    if (!fs.existsSync(squadsDir)) {
      console.warn('Warning: squads directory not found');
      return squads;
    }

    const squadDirs = fs.readdirSync(squadsDir).filter(f => {
      const stat = fs.statSync(path.join(squadsDir, f));
      return stat.isDirectory() && f !== '_example';
    });

    squadDirs.forEach(squadDir => {
      const configPath = path.join(squadsDir, squadDir, 'squad.yaml');
      const membersPath = path.join(squadsDir, squadDir, 'members.json');

      if (fs.existsSync(membersPath)) {
        const members = JSON.parse(fs.readFileSync(membersPath, 'utf-8'));
        squads[squadDir] = {
          id: squadDir,
          members,
          path: path.join(squadsDir, squadDir),
        };
      }
    });

    return squads;
  }

  loadSpecialists() {
    const specialistsFile = path.join(process.cwd(), 'docs/specialists-classification.json');

    if (fs.existsSync(specialistsFile)) {
      return JSON.parse(fs.readFileSync(specialistsFile, 'utf-8'));
    }

    return { squads: {} };
  }

  getSquad(squadId) {
    return this.squads[squadId] || null;
  }

  searchExperts(domain, squadFilter = null) {
    const results = [];
    const domainLower = domain.toLowerCase();

    Object.values(this.squads).forEach(squad => {
      if (squadFilter && squad.id !== squadFilter) return;

      squad.members.forEach(member => {
        const expertiseStr = (member.expertise_tags || []).join(' ').toLowerCase();

        if (expertiseStr.includes(domainLower) || member.name.toLowerCase().includes(domainLower)) {
          results.push({
            slug: member.slug,
            name: member.name,
            squad: squad.id,
            expertise: member.expertise_tags || [],
            collection: member.qdrant_collection,
            role: member.role,
          });
        }
      });
    });

    return results.slice(0, 3); // Top 3
  }

  getTopExperts(domains, limit = 3) {
    const experts = [];
    const seen = new Set();

    domains.forEach(domain => {
      const found = this.searchExperts(domain);
      found.forEach(expert => {
        if (!seen.has(expert.slug) && experts.length < limit) {
          experts.push(expert);
          seen.add(expert.slug);
        }
      });
    });

    return experts;
  }
}

module.exports = SquadManager;
