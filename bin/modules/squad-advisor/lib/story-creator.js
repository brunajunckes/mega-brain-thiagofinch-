const fs = require('fs');
const path = require('path');

class StoryCreator {
  async createStories(config) {
    const { projectName, spec, outputDir } = config;

    const stories = [
      this.createMVPStory(projectName),
      this.createPhase2Story(projectName),
      this.createPhase3Story(projectName),
      this.createQAGateStory(projectName),
      this.createEvolutionMonitoringStory(projectName),
    ];

    // Save stories to files
    stories.forEach((story, idx) => {
      const storyFile = path.join(outputDir, `${story.id}.story.md`);
      fs.writeFileSync(storyFile, story.markdown);
    });

    return stories;
  }

  createMVPStory(projectName) {
    const markdown = `# Story 1.1 — MVP Phase

**Epic:** 1 - ${projectName}
**Story ID:** 1.1
**Status:** Ready for Development
**Assigned:** @dev
**Priority:** High
**Story Points:** 21

---

## Summary

Implement the minimum viable product that solves the core user problem.
This story focuses on validating core assumptions with real users.

---

## Acceptance Criteria

- [ ] **AC1:** Core user problem solved end-to-end
- [ ] **AC2:** Metrics instrumentation complete (event tracking)
- [ ] **AC3:** 5+ beta users tested and provided feedback
- [ ] **AC4:** 80%+ unit test coverage
- [ ] **AC5:** npm run lint passes (zero errors)
- [ ] **AC6:** npm run typecheck passes (zero errors)
- [ ] **AC7:** All tests pass
- [ ] **AC8:** CodeRabbit review: no CRITICAL issues

---

## Implementation Plan

### Phase 1: Core Feature
- Build minimum feature set
- Focus on user problem resolution
- Skip nice-to-haves

### Phase 2: Instrumentation
- Add event tracking
- Set up metrics pipeline
- Create dashboards

### Phase 3: Testing & QA
- Unit tests (80%+ coverage)
- Manual user testing
- Performance baseline

---

## File List

(To be updated during implementation)

---

## Definition of Done

- [x] Code review approved
- [x] Tests passing
- [x] Documentation updated
- [x] Ready for QA gate
`;

    return {
      id: '1.1',
      title: 'MVP Phase',
      markdown,
    };
  }

  createPhase2Story(projectName) {
    const markdown = `# Story 1.2 — Phase 2: Scaling (Triggered at 500 DAU)

**Epic:** 1 - ${projectName}
**Story ID:** 1.2
**Status:** Blocked (awaiting Phase 1 completion + trigger metric)
**Assigned:** @dev
**Priority:** High
**Story Points:** 13

---

## Summary

Scale the system to handle 10k concurrent users.
Implement caching, optimize database, prepare for growth.

---

## Trigger Condition

**Start only when:** Daily Active Users >= 500

---

## Acceptance Criteria

- [ ] **AC1:** Caching layer implemented (Redis or similar)
- [ ] **AC2:** Database queries optimized (indexed)
- [ ] **AC3:** Load testing at 5000 CCU complete
- [ ] **AC4:** Latency p99 < 500ms
- [ ] **AC5:** All metrics updated

---

## Definition of Done

- [x] Code review approved
- [x] Load testing passed
- [x] Ready for QA gate
`;

    return {
      id: '1.2',
      title: 'Phase 2: Scaling (Triggered)',
      markdown,
    };
  }

  createPhase3Story(projectName) {
    const markdown = `# Story 1.3 — Phase 3: Enterprise Scale (Triggered at 5k DAU)

**Epic:** 1 - ${projectName}
**Story ID:** 1.3
**Status:** Blocked (awaiting Phase 2 + trigger metric)
**Assigned:** @dev
**Priority:** Medium
**Story Points:** 13

---

## Summary

Scale to 100k+ users with enterprise-grade features.
Multi-region deployment, CDN, advanced security.

---

## Trigger Condition

**Start only when:** Daily Active Users >= 5000

---

## Acceptance Criteria

- [ ] **AC1:** CDN implemented for static assets
- [ ] **AC2:** Multi-region deployment working
- [ ] **AC3:** Enterprise security features added
- [ ] **AC4:** Disaster recovery tested
- [ ] **AC5:** SLA compliance verified

---

## Definition of Done

- [x] All tests passing
- [x] Enterprise features verified
- [x] Ready for production
`;

    return {
      id: '1.3',
      title: 'Phase 3: Enterprise Scale (Triggered)',
      markdown,
    };
  }

  createQAGateStory(projectName) {
    const markdown = `# Story 2.1 — Quality Gates & Evolution Triggers

**Epic:** 2 - Quality & Evolution
**Story ID:** 2.1
**Status:** Ready for Development
**Assigned:** @qa
**Priority:** High
**Story Points:** 8

---

## Summary

Implement quality gates and evolution trigger monitoring.
Automatically flag when phase transitions should occur.

---

## Acceptance Criteria

- [ ] **AC1:** Metrics dashboard showing evolution triggers
- [ ] **AC2:** Automated alerts for trigger conditions
- [ ] **AC3:** Quality gate checklist automated
- [ ] **AC4:** Reports generated on evolution readiness
- [ ] **AC5:** All dashboards tested

---

## Evolution Triggers to Monitor

### Phase 2 Trigger
- Metric: daily_active_users
- Threshold: 500
- Action: Notify team to start Phase 2 planning

### Phase 3 Trigger
- Metric: daily_active_users
- Threshold: 5000
- Action: Notify team to start Phase 3 planning

### Performance Triggers
- API latency p99 > 500ms → Review caching
- Error rate > 1% → Reliability review
- CPU > 80% → Scaling review

---

## Definition of Done

- [x] All monitoring in place
- [x] Alerts configured
- [x] Ready for production
`;

    return {
      id: '2.1',
      title: 'Quality Gates & Evolution Triggers',
      markdown,
    };
  }

  createEvolutionMonitoringStory(projectName) {
    const markdown = `# Story 2.2 — Continuous Evolution Monitoring

**Epic:** 2 - Quality & Evolution
**Story ID:** 2.2
**Status:** Ready for Development
**Assigned:** @qa
**Priority:** Medium
**Story Points:** 5

---

## Summary

Monitor system health and recommend evolution actions
based on real-world metrics and user feedback.

---

## Acceptance Criteria

- [ ] **AC1:** Weekly evolution report generated
- [ ] **AC2:** Trend analysis of key metrics
- [ ] **AC3:** Recommendations for next phase
- [ ] **AC4:** Automated alerts for anomalies

---

## Definition of Done

- [x] Monitoring complete
- [x] Reports validated
- [x] Ready for production
`;

    return {
      id: '2.2',
      title: 'Continuous Evolution Monitoring',
      markdown,
    };
  }
}

module.exports = StoryCreator;
