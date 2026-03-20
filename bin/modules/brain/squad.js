#!/usr/bin/env node

const axios = require('axios');
const { spinner, colors } = require('../../utils');

async function askSquad(options) {
  const { question, synthesize, debate, json } = options;

  if (!question) {
    console.error('❌ --ask question is required');
    process.exit(1);
  }

  const payload = {
    question,
    use_rag: true,
    synthesize: synthesize || false,
    debate_rounds: debate ? parseInt(debate) : 0,
  };

  const sp = spinner(`🧠 Querying squad on: "${question}"`);

  try {
    const response = await axios.post('http://localhost:8000/brain/squad/ask', payload);
    sp.succeed('✅ Squad responses received');

    if (json) {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.log('\n📊 Squad Responses:\n');
      const { responses, synthesis, metrics } = response.data;

      if (responses) {
        for (const [clone, result] of Object.entries(responses)) {
          console.log(`\n🧠 ${clone}:`);
          if (result.error) {
            console.log(`  ❌ ${result.error}`);
          } else {
            console.log(`  ${result.response || result}`);
          }
        }
      }

      if (synthesis) {
        console.log('\n\n✨ Synthesis:');
        console.log(synthesis);
      }

      if (metrics) {
        console.log('\n\n📈 Metrics:', JSON.stringify(metrics, null, 2));
      }
    }
  } catch (error) {
    sp.fail(`❌ Squad error: ${error.message}`);
    process.exit(1);
  }
}

async function listSquad() {
  const sp = spinner('📋 Loading available clones...');

  try {
    const response = await axios.get('http://localhost:8000/brain/squad/clones');
    sp.succeed('✅ Clones loaded');

    const clones = response.data;
    console.log('\n🧠 Available Clones:\n');

    for (const clone of clones) {
      console.log(`  📌 ${clone.name}`);
      if (clone.chunk_count !== undefined) {
        console.log(`     Chunks: ${clone.chunk_count}`);
      }
    }
  } catch (error) {
    sp.fail(`❌ Failed to list clones: ${error.message}`);
    process.exit(1);
  }
}

async function execute(args, options) {
  if (options.list) {
    await listSquad();
  } else if (options.ask) {
    await askSquad({
      question: options.ask,
      synthesize: options.synthesize,
      debate: options.debate,
      json: options.json,
    });
  } else {
    console.error('❌ Use --ask <question> or --list');
    process.exit(1);
  }
}

module.exports = { execute };
