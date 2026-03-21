/**
 * Skill Extractor
 * Extracts and classifies capabilities from knowledge entries
 */

class SkillExtractor {
  constructor() {
    this.skillPatterns = this.initializePatterns();
    this.extractedSkills = new Map();
  }

  /**
   * Extract skills from entry
   */
  extractSkills(entry) {
    const skills = [];

    // Pattern-based extraction
    const patternSkills = this.extractByPatterns(entry);
    skills.push(...patternSkills);

    // Content analysis extraction
    const contentSkills = this.extractFromContent(entry);
    skills.push(...contentSkills);

    // Structure-based extraction
    const structureSkills = this.extractFromStructure(entry);
    skills.push(...structureSkills);

    // Deduplicate
    const uniqueSkills = this.deduplicateSkills(skills);

    return uniqueSkills.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Classify skill by category
   */
  classifySkill(skillName) {
    const categories = {
      'system-design': [
        'architecture',
        'scalability',
        'performance',
        'optimization',
        'design pattern',
      ],
      'development': [
        'coding',
        'programming',
        'implementation',
        'debugging',
        'testing',
      ],
      'analysis': [
        'analysis',
        'research',
        'investigation',
        'evaluation',
        'assessment',
      ],
      'management': [
        'management',
        'leadership',
        'coordination',
        'planning',
        'organization',
      ],
      'communication': [
        'communication',
        'documentation',
        'presentation',
        'writing',
        'explanation',
      ],
      'security': ['security', 'privacy', 'encryption', 'protection', 'audit'],
      'operations': [
        'deployment',
        'monitoring',
        'maintenance',
        'operations',
        'infrastructure',
      ],
    };

    const skillLower = skillName.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((kw) => skillLower.includes(kw))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Calculate skill maturity level
   */
  assessMaturity(skillName, content) {
    const mentions = (content.match(new RegExp(skillName, 'gi')) || []).length;

    if (mentions >= 10) return 'expert';
    if (mentions >= 5) return 'advanced';
    if (mentions >= 2) return 'intermediate';
    return 'foundational';
  }

  // Private helpers

  initializePatterns() {
    return {
      'process-pattern': /(?:step|process|procedure|workflow)[\s:]*([^.!?]+)/gi,
      'concept-pattern': /(?:concept|principle|theory|approach)[\s:]*([^.!?]+)/gi,
      'tool-pattern': /(?:tool|framework|library|platform)[\s:]*([^.!?]+)/gi,
      'best-practice': /(?:best practice|recommended|should|must)[\s:]*([^.!?]+)/gi,
    };
  }

  extractByPatterns(entry) {
    const skills = [];
    const content = entry.content;

    for (const [patternName, pattern] of Object.entries(this.skillPatterns)) {
      const matches = [...content.matchAll(pattern)];
      matches.forEach((match) => {
        if (match[1]) {
          skills.push({
            id: `${patternName}_${skills.length}`,
            name: match[1].substring(0, 100).trim(),
            category: this.classifySkill(match[1]),
            source: patternName,
            confidence: 0.7,
          });
        }
      });
    }

    return skills;
  }

  extractFromContent(entry) {
    const skills = [];
    const keyPoints = entry.keyPoints || [];

    keyPoints.forEach((point, index) => {
      const skillName = point.split(':')[0].trim();
      skills.push({
        id: `keypoint_${index}`,
        name: skillName,
        category: this.classifySkill(skillName),
        source: 'key-points',
        confidence: 0.8,
      });
    });

    return skills;
  }

  extractFromStructure(entry) {
    const skills = [];

    // Analyze metadata
    if (entry.metadata.tags && entry.metadata.tags.length > 0) {
      entry.metadata.tags.forEach((tag) => {
        skills.push({
          id: `tag_${tag}`,
          name: tag.replace(/-/g, ' '),
          category: this.classifySkill(tag),
          source: 'metadata-tags',
          confidence: 0.9,
        });
      });
    }

    // Extract from domain
    const domainSkill = {
      id: `domain_${entry.metadata.domain}`,
      name: `${entry.metadata.domain} expertise`,
      category: entry.metadata.domain,
      source: 'metadata-domain',
      confidence: 0.85,
    };
    skills.push(domainSkill);

    return skills;
  }

  deduplicateSkills(skills) {
    const uniqueMap = new Map();

    skills.forEach((skill) => {
      const key = skill.name.toLowerCase();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, skill);
      } else {
        // Update with highest confidence
        const existing = uniqueMap.get(key);
        if (skill.confidence > existing.confidence) {
          uniqueMap.set(key, skill);
        }
      }
    });

    return Array.from(uniqueMap.values());
  }
}

module.exports = { SkillExtractor };
