#!/usr/bin/env node
const { readPresetData, checkPresetData } = require('./lib/preset-data');

const data = readPresetData();
const errors = checkPresetData(data);

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  console.error(`\n${errors.length} problem(s) in the preset data.`);
  process.exit(1);
}

const count = Object.values(data.productSets).reduce((total, set) => total + set.products.length, 0);
console.log(`Preset data is valid: ${Object.keys(data.productSets).length} product sets, ${count} products.`);
