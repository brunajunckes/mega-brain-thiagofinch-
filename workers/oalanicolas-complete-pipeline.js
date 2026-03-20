#!/usr/bin/env node

/**
 * @oalanicolas Complete Pipeline
 *
 * Orchestrates:
 * 1. Extract transcripts from all 41 videos
 * 2. Analyze and map content
 * 3. Generate comprehensive reports
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIG
// ============================================================================

const EXTRACTION_SCRIPT = './workers/extract-oalanicolas-batch.js';
const MAPPING_SCRIPT = './workers/map-oalanicolas-transcripts.js';

const TRANSCRIPTS_DIR = './data/transcripts-apify';
const OUTPUT_DIR = './data/analysis/oalanicolas';

// ============================================================================
// UTILITIES
// ============================================================================

function runCommand(script, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Running: ${script}`);
    console.log(`${'='.repeat(70)}\n`);

    const child = spawn('node', [script, ...args], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    child.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function waitForTranscripts(maxWaitTime = 600000) {
  // Wait up to 10 minutes for transcripts to be extracted
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (checkFileExists(path.join(TRANSCRIPTS_DIR, 'INDEX.json'))) {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > maxWaitTime) {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for transcript extraction'));
      }
    }, 5000);
  });
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('OALANICOLAS COMPLETE PIPELINE');
  console.log('='.repeat(70));
  console.log('\nPhase 1: Extract Transcripts');
  console.log('Phase 2: Analyze & Map Content');
  console.log('Phase 3: Generate Reports\n');

  try {
    // Phase 1: Extract
    console.log('\nPHASE 1: TRANSCRIPT EXTRACTION');
    console.log('-'.repeat(70));

    if (!checkFileExists(EXTRACTION_SCRIPT)) {
      throw new Error(`Extraction script not found: ${EXTRACTION_SCRIPT}`);
    }

    await runCommand(EXTRACTION_SCRIPT, [TRANSCRIPTS_DIR]);

    // Wait for INDEX.json to appear
    console.log('\nWaiting for extraction to complete...');
    await waitForTranscripts();

    // Verify extraction
    if (!checkFileExists(path.join(TRANSCRIPTS_DIR, 'INDEX.json'))) {
      throw new Error('Extraction did not complete successfully');
    }

    const indexData = JSON.parse(
      fs.readFileSync(path.join(TRANSCRIPTS_DIR, 'INDEX.json'), 'utf8')
    );

    console.log(`\n✓ Extraction complete: ${indexData.totalSuccess}/${indexData.totalProcessed} videos`);

    // Phase 2: Analyze & Map
    console.log('\nPHASE 2: ANALYSIS & MAPPING');
    console.log('-'.repeat(70));

    if (!checkFileExists(MAPPING_SCRIPT)) {
      throw new Error(`Mapping script not found: ${MAPPING_SCRIPT}`);
    }

    await runCommand(MAPPING_SCRIPT, [TRANSCRIPTS_DIR, OUTPUT_DIR]);

    // Phase 3: Summary
    console.log('\nPHASE 3: PIPELINE COMPLETE');
    console.log('-'.repeat(70));

    const summaryPath = path.join(OUTPUT_DIR, 'EXECUTIVE-SUMMARY.md');
    if (checkFileExists(summaryPath)) {
      console.log('\n✓ Executive Summary generated');
    }

    const jsonPath = path.join(OUTPUT_DIR, 'ANALYSIS-DATA.json');
    if (checkFileExists(jsonPath)) {
      const analysisData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      console.log(`✓ Analysis Data: ${analysisData.metadata.videosAnalyzed} videos analyzed`);
    }

    console.log(`\n📁 All outputs saved to: ${OUTPUT_DIR}`);
    console.log('\n' + '='.repeat(70));
    console.log('PIPELINE SUCCESS');
    console.log('='.repeat(70) + '\n');

    process.exit(0);
  } catch (error) {
    console.error(`\n✗ Pipeline failed: ${error.message}\n`);
    process.exit(1);
  }
}

main();
