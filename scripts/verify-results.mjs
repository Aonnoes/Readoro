#!/usr/bin/env node
// Re-runs the default experiment in memory and checks results/official still matches byte for byte.
// Red here means someone touched the engine or config and forgot to regenerate. Run `npm run results`.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runExperiment, runSensitivity } from '../simulation/experiment.js';
import { resultFiles } from '../simulation/reporting.js';

const experiment = runExperiment({}, { includeLearners: true });
const expected = resultFiles(experiment, runSensitivity({}, experiment));

const stale = [];
for (const [name, text] of Object.entries(expected)) {
  const onDisk = await readFile(resolve('results', 'official', name), 'utf8').catch(() => null);
  if (onDisk?.replace(/\r\n/g, '\n') !== text) stale.push(name);
}

if (stale.length) {
  console.error(`Stale or missing: ${stale.join(', ')}\nRun \`npm run results\` and commit the changes.`);
  process.exit(1);
}
console.log(`All ${Object.keys(expected).length} official result files match the engine. Receipts verified.`);
