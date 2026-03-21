/**
 * Knowledge Base Schema
 * Defines types for knowledge ingestion and management
 */

/**
 * @typedef {Object} KnowledgeMetadata
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {string} domain
 * @property {string} [expert]
 * @property {string[]} tags
 * @property {string} language
 * @property {string} [sourceUrl]
 */

/**
 * @typedef {Object} KnowledgeEntry
 * @property {string} id
 * @property {'video'|'pdf'|'course'|'podcast'|'text'|'article'|'transcript'} type
 * @property {string} title
 * @property {string} source
 * @property {string} content
 * @property {number[]} embedding
 * @property {string} summary
 * @property {string[]} keyPoints
 * @property {KnowledgeMetadata} metadata
 */

/**
 * @typedef {Object} KnowledgeQuery
 * @property {string} text
 * @property {string} [domain]
 * @property {number} [limit]
 * @property {number} [minRelevance]
 */

/**
 * @typedef {Object} SearchResult
 * @property {KnowledgeEntry} entry
 * @property {number} relevance
 * @property {string} [matchedText]
 */

/**
 * @typedef {Object} KnowledgeStatistics
 * @property {number} totalEntries
 * @property {Record<string, number>} entriesByType
 * @property {Record<string, number>} entriesByDomain
 * @property {number} totalSize
 * @property {Date} lastUpdated
 */

/**
 * @typedef {Object} IngestionRequest
 * @property {'video'|'pdf'|'course'|'podcast'|'text'|'article'|'transcript'} type
 * @property {string} title
 * @property {string} source
 * @property {string} content
 * @property {string} domain
 * @property {string} [expert]
 * @property {string[]} [tags]
 * @property {Record<string, any>} [metadata]
 */

/**
 * @typedef {Object} KnowledgeBaseConfig
 * @property {string} storagePath
 * @property {number} maxEmbeddingDimension
 * @property {boolean} autoBackup
 * @property {number} backupInterval
 */

module.exports = {
  // Empty - this file is for documentation and type hints only
};
