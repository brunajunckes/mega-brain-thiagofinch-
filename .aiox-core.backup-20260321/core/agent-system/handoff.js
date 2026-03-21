'use strict';

const crypto = require('crypto');

/**
 * HandoffArtifact - Structured handoff between agents
 * Preserves context and decisions across agent switches
 */
class HandoffArtifact {
  constructor({
    from_agent,
    to_agent,
    story_context = {},
    decisions = [],
    files_modified = [],
    blockers = [],
    next_action = '',
    context_summary = '',
    metadata = {},
  } = {}) {
    this.id = crypto.randomUUID();
    this.from_agent = from_agent;
    this.to_agent = to_agent;
    this.story_context = story_context;
    this.decisions = decisions;
    this.files_modified = files_modified;
    this.blockers = blockers;
    this.next_action = next_action;
    this.context_summary = context_summary;
    this.created_at = new Date().toISOString();
    this.consumed_at = null;
    this.consumed = false;
    this.metadata = metadata;
  }

  /**
   * Serialize to JSON (for storage)
   */
  toJSON() {
    return {
      id: this.id,
      from_agent: this.from_agent,
      to_agent: this.to_agent,
      story_context: this.story_context,
      decisions: this.decisions,
      files_modified: this.files_modified,
      blockers: this.blockers,
      next_action: this.next_action,
      context_summary: this.context_summary,
      created_at: this.created_at,
      consumed_at: this.consumed_at,
      consumed: this.consumed,
      metadata: this.metadata,
    };
  }

  /**
   * Deserialize from JSON (for loading)
   */
  static fromJSON(json) {
    const handoff = new HandoffArtifact({
      from_agent: json.from_agent,
      to_agent: json.to_agent,
      story_context: json.story_context,
      decisions: json.decisions,
      files_modified: json.files_modified,
      blockers: json.blockers,
      next_action: json.next_action,
      context_summary: json.context_summary,
      metadata: json.metadata,
    });

    // Restore original ID and timestamps
    handoff.id = json.id;
    handoff.created_at = json.created_at;
    handoff.consumed_at = json.consumed_at;
    handoff.consumed = json.consumed;

    return handoff;
  }

  /**
   * Mark handoff as consumed
   */
  markConsumed() {
    this.consumed = true;
    this.consumed_at = new Date().toISOString();
  }

  /**
   * Add a decision to the handoff
   */
  addDecision(decision, rationale) {
    this.decisions.push({
      decision,
      rationale,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Add a file change record
   */
  addFileModified(path, status, lines_added = 0, lines_removed = 0) {
    this.files_modified.push({
      path,
      status,
      lines_added,
      lines_removed,
    });
  }

  /**
   * Add a blocker
   */
  addBlocker(blocker, severity = 'MEDIUM', workaround = '') {
    this.blockers.push({
      blocker,
      severity,
      workaround,
    });
  }

  /**
   * Validate handoff against schema
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.from_agent) errors.push('from_agent is required');
    if (!this.to_agent) errors.push('to_agent is required');
    if (!Array.isArray(this.decisions)) errors.push('decisions must be an array');

    // Field constraints
    if (this.from_agent && this.from_agent.length > 50) {
      errors.push('from_agent exceeds 50 character limit');
    }
    if (this.to_agent && this.to_agent.length > 50) {
      errors.push('to_agent exceeds 50 character limit');
    }

    // Decision count
    if (this.decisions.length > 5) {
      errors.push('decisions array exceeds 5 item limit');
    }

    // Files modified count
    if (this.files_modified.length > 10) {
      errors.push('files_modified array exceeds 10 item limit');
    }

    // Blockers count
    if (this.blockers.length > 3) {
      errors.push('blockers array exceeds 3 item limit');
    }

    // Context summary length
    if (this.context_summary && this.context_summary.length > 500) {
      errors.push('context_summary exceeds 500 character limit');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get handoff summary for display
   */
  getSummary() {
    return `
Handoff: ${this.from_agent} → ${this.to_agent}
Status: ${this.consumed ? '✅ Consumed' : '⏳ Pending'}
Story: ${this.story_context.story_id || 'N/A'}
Task: ${this.story_context.current_task || 'N/A'}
Next: ${this.next_action || 'N/A'}

Decisions: ${this.decisions.length}
Files Modified: ${this.files_modified.length}
Blockers: ${this.blockers.length}

Summary: ${this.context_summary || 'No summary'}
`.trim();
  }
}

module.exports = { HandoffArtifact };
