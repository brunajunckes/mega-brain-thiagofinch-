#!/usr/bin/env node

const { run } = require('./modules/brain/index.js');

run(process.argv).catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
