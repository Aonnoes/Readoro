#!/usr/bin/env node
// Regenerates results/official from the engine. Usage: npm run results [-- --trials=30 --seed=7]
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runExperiment, runSensitivity } from '../simulation/experiment.js';
import { resultFiles } from '../simulation/reporting.js';

const OPTIONS = {
  seed: 'seed', trials: 'trials', learners: 'learners', activities: 'activitiesPerLearner',
  'learning-rate': 'learningRate', slope: 'slope', 'ability-mean': 'initialAbilityMean',
  'ability-sd': 'initialAbilitySd', fixed: 'fixedDifficulty',
};

function parseArgs(args) {
  const overrides = {};
  for (const arg of args) {
    if (arg === '--sensitivity') continue; // always on now; kept so old commands still work
    const [, name, value] = arg.match(/^--([a-z-]+)=(.+)$/) ?? [];
    if (!name) throw new Error(`Unknown argument ${arg}`);
    const key = OPTIONS[name];
    if (!key) throw new Error(`Unknown option --${name}`);
    overrides[key] = key === 'fixedDifficulty' ? value : Number(value);
  }
  return overrides;
}

const overrides = parseArgs(process.argv.slice(2));
const experiment = runExperiment(overrides, { includeLearners: true });
const sensitivity = runSensitivity(overrides, experiment);
const files = resultFiles(experiment, sensitivity);

const outDir = resolve('results', 'official');
await mkdir(outDir, { recursive: true });
await Promise.all(Object.entries(files).map(([name, text]) => writeFile(resolve(outDir, name), text, 'utf8')));

const { config, summary } = experiment;
const { fixed, adaptive, difference } = summary.comparison.final;
console.log('READORO - fresh numbers, zero real students involved');
console.log(`${config.trials} trials x ${config.learners} learners x ${config.activitiesPerLearner} activities, seeds ${config.seed}-${config.seed + config.trials - 1}`);
console.log(`Fixed ${fixed.mean.toFixed(2)}%  |  Adaptive ${adaptive.mean.toFixed(2)}%`);
console.log(`Adaptive - Fixed: ${difference.mean.toFixed(2)} [${difference.low.toFixed(2)}, ${difference.high.toFixed(2)}] pp, adaptive won ${summary.adaptiveWins}/${config.trials}`);
console.log(`Wrote ${Object.keys(files).length} files to ${outDir}`);
