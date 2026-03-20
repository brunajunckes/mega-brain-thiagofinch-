#!/usr/bin/env node

/**
 * AIOX Squad Advisor CLI
 * Expert roundtable orchestration for professional project planning
 */

const path = require('path');
const squadAdvisor = require(path.join(__dirname, 'modules', 'squad-advisor', 'index.js'));

// Parse and run
squadAdvisor.parseAsync(process.argv.slice(2)).catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
