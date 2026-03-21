/**
 * Ask Council Command
 * Submit a question to the deliberation council for multi-perspective advice
 */

const path = require('path');
const { DeliberationCouncil } = require('../deliberation/council');
const { KnowledgeManager } = require('../knowledge/manager');
const { RAGSearchEngine } = require('../rag/search-engine');

async function askCouncilCommand(input) {
  try {
    const config = {
      storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    // Initialize components
    const knowledgeManager = new KnowledgeManager(config);
    const ragEngine = new RAGSearchEngine({
      knowledgeManager,
      minRelevance: 0.6,
      maxResults: 5,
    });

    const council = new DeliberationCouncil({
      knowledgeManager,
      ragEngine,
      councilSize: 11,
    });

    // Conduct deliberation
    const deliberation = await council.deliberate(input.question, input.domains);

    // Format response
    const argumentsList = Array.from(deliberation.arguments.values()).map(
      (arg) => ({
        agent: arg.agentId,
        position: arg.position,
        confidence: (arg.confidence * 100).toFixed(1) + '%',
        evidence: arg.evidence.length,
      })
    );

    const votes = Array.from(deliberation.votes.entries()).map(
      ([memberId, vote]) => ({
        member: memberId,
        vote: vote > 0 ? 'SUPPORT' : vote < 0 ? 'OPPOSE' : 'NEUTRAL',
      })
    );

    return {
      success: true,
      recommendation: {
        position: deliberation.consensus.position,
        confidence: (deliberation.consensus.confidence * 100).toFixed(1) + '%',
        reasoning: deliberation.consensus.reasoning,
        alternativePerspectives: deliberation.consensus.alternativePerspectives,
        caveats: deliberation.consensus.caveats,
        actionItems: deliberation.consensus.actionItems,
      },
      arguments: argumentsList,
      evidence: {
        citations: deliberation.evidence.length,
        sources: deliberation.evidence.map((c) => c.source),
      },
      message: `🎯 Council Deliberation Complete (${deliberation.duration}ms)`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Deliberation failed: ${error.message}`,
    };
  }
}

/**
 * Get council composition
 */
async function getCouncilComposition() {
  try {
    const config = {
      storagePath: path.join(process.cwd(), '.aiox-core', 'data', 'knowledge'),
      maxEmbeddingDimension: 256,
      autoBackup: true,
      backupInterval: 3600000,
    };

    const knowledgeManager = new KnowledgeManager(config);
    const ragEngine = new RAGSearchEngine({
      knowledgeManager,
      minRelevance: 0.6,
      maxResults: 5,
    });

    const council = new DeliberationCouncil({
      knowledgeManager,
      ragEngine,
      councilSize: 11,
    });

    const members = council.getCouncilComposition();

    return {
      success: true,
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        expertise: m.expertise,
        perspective: m.perspective,
      })),
      message: `👥 Council has ${members.length} members`,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Failed to get composition: ${error.message}`,
    };
  }
}

module.exports = { askCouncilCommand, getCouncilComposition };
