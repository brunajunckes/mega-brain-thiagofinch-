'use strict';

/**
 * Decision Engine — Main exports
 *
 * @module decision-engine
 * @version 1.0.0
 * @story 2.3
 */

const DecisionAnalyzer = require('./decision-analyzer');
const RecommendationGenerator = require('./recommendation-generator');
const DecisionFormatter = require('./decision-formatter');

module.exports = {
  DecisionAnalyzer: DecisionAnalyzer,
  RecommendationGenerator: RecommendationGenerator,
  DecisionFormatter: DecisionFormatter,
};
