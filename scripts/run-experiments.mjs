#!/usr/bin/env node
/** Generate a complete, reproducible simulation handoff; no external packages. */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runExperiment, runSensitivity, DEFAULT_EXPERIMENT } from '../simulation/experiment.js';
import { paperReport, summaryCsvRows, trialCsvRows, sensitivityCsvRows, toCsv, buildFigures } from '../simulation/reporting.js';

const args=process.argv.slice(2);
const options={};
for(const arg of args){
  if(arg==='--sensitivity')continue;
  const match=arg.match(/^--([a-z-]+)=(.+)$/);
  if(!match)throw new Error(`Unknown argument ${arg}`);
  const map={'seed':'seed','trials':'trials','learners':'learners','activities':'activitiesPerLearner',
    'learning-rate':'learningRate','slope':'slope','ability-mean':'initialAbilityMean','ability-sd':'initialAbilitySd','fixed':'fixedDifficulty'};
  const key=map[match[1]];
  if(!key)throw new Error(`Unknown option --${match[1]}`);
  options[key]=key==='fixedDifficulty'?match[2]:Number(match[2]);
}
const outDir=resolve('results','official');
const exp=runExperiment(options,{includeLearners:true});
const sensitivity=runSensitivity(options);
await mkdir(outDir,{recursive:true});
const files={
  'experiment.json':JSON.stringify({config:exp.config,trialResults:exp.trialResults,summary:exp.summary},null,2)+'\n',
  'sensitivity.json':JSON.stringify(sensitivity,null,2)+'\n',
  'summary.csv':toCsv(summaryCsvRows(exp)),
  'trials.csv':toCsv(trialCsvRows(exp)),
  'sensitivity.csv':toCsv(sensitivityCsvRows(sensitivity)),
  'learner-records.csv':toCsv(exp.learners),
  'paper-results.md':paperReport(exp,sensitivity),
  ...buildFigures(exp,sensitivity),
};
for(const [filename,content] of Object.entries(files)){
  await writeFile(resolve(outDir,filename),content,'utf8');
}
const c=exp.summary.comparison.final;
console.log('READORO — REPRODUCIBLE RESULTS');
console.log(`Configuration: ${exp.config.trials} trials × ${exp.config.learners} learners × ${exp.config.activitiesPerLearner} activities`);
console.log(`Trial seeds: ${exp.config.seed}–${exp.config.seed+exp.config.trials-1}`);
console.log(`Fixed: ${c.fixed.mean.toFixed(2)}% | Adaptive: ${c.adaptive.mean.toFixed(2)}%`);
console.log(`Adaptive − Fixed: ${c.difference.mean.toFixed(2)} [${c.difference.low.toFixed(2)}, ${c.difference.high.toFixed(2)}] pp`);
console.log(`Adaptive wins: ${exp.summary.adaptiveWins}/${exp.config.trials}`);
console.log(`Generated ${Object.keys(files).length} files in ${outDir}`);
