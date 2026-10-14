import test from 'node:test';
import assert from 'node:assert/strict';
import {runExperiment, runSensitivity, trialMetrics, confidenceInterval} from '../../simulation/experiment.js';
import {toCsv, summaryCsvRows, trialCsvRows, sensitivityCsvRows, paperReport, buildFigures} from '../../simulation/reporting.js';
import {runTrial} from '../../simulation/engine.js';
import {SKILLS,DIFFICULTIES} from '../../simulation/lib/config.js';

const tiny={trials:3,learners:8,activitiesPerLearner:3,seed:321};
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} not equal ${b}`);

test('multi-trial runner repeats exactly with the same settings',()=>{
  const a=runExperiment(tiny),b=runExperiment(tiny);
  assert.deepEqual(a,b);
  assert.deepEqual(a.trialResults.map(x=>x.seed),[321,322,323]);
});

test('each trial keeps a shared baseline and estimates a paired difference',()=>{
  const e=runExperiment(tiny);
  for(const t of e.trialResults)approx(t.fixed.baseline,t.adaptive.baseline);
  approx(e.summary.comparison.baseline.difference.mean,0);
  const paired=e.trialResults.map(t=>t.adaptive.final-t.fixed.final);
  approx(e.summary.comparison.final.difference.mean,paired.reduce((a,b)=>a+b,0)/paired.length);
  assert.equal(e.summary.adaptiveWins+e.summary.fixedWins+e.summary.ties,e.config.trials);
});

test('learner-level export records both strategies, linked by trial and learner ID',()=>{
  const e=runExperiment(tiny,{includeLearners:true});
  assert.equal(e.learners.length,tiny.trials*tiny.learners*2);
  for(let i=0;i<e.learners.length;i+=2){
    const a=e.learners[i],b=e.learners[i+1];
    assert.equal(a.learnerId,b.learnerId);
    assert.equal(a.seed,b.seed);
    assert.equal(a.baselinePercent,b.baselinePercent);
    assert.equal(a.strategy,'fixed');assert.equal(b.strategy,'adaptive');
    assert.equal(a.practiceTotal,12);assert.equal(b.practiceTotal,12);
  }
});

test('per-trial skill results and difficulty shares come from actual engine responses',()=>{
  const run=runTrial({learners:8,activitiesPerLearner:3,seed:321});
  const m=trialMetrics(run,'fixed');
  for(const skill of SKILLS)assert.ok(m.skills[skill].final>=0&&m.skills[skill].final<=100);
  assert.equal(m.difficulties.Intermediate,100);
  assert.equal(m.difficulties.Beginner,0);
  assert.equal(m.difficulties.Advanced,0);
  approx(DIFFICULTIES.reduce((s,l)=>s+m.levels[l].baseline,0),100);
});

test('zero practice activities do not fabricate practice percentages or learning',()=>{
  const e=runExperiment({...tiny,activitiesPerLearner:0});
  assert.equal(e.summary.comparison.practice.fixed,null);
  assert.equal(e.summary.activity.length,0);
  assert.equal(e.summary.comparison.ability.fixed.mean,0);
  assert.equal(e.summary.comparison.ability.adaptive.mean,0);
});

test('95% CI uses trial-level Student t and rejects insufficient data',()=>{
  const a=confidenceInterval([1,2,3]);
  approx(a.mean,2);
  approx(a.margin,4.302653/Math.sqrt(3));
  assert.throws(()=>confidenceInterval([3]),RangeError);
  assert.throws(()=>confidenceInterval([1,NaN]),RangeError);
});

test('sensitivity changes one parameter and preserves the same seed sequence',()=>{
  const x=runSensitivity(tiny);
  assert.equal(x.cases.length,9);
  assert.ok(x.cases.every(c=>Object.keys(c.overrides).length===1));
  const beginner=x.cases.find(c=>c.id==='fixed-beginner');
  assert.ok(Number.isFinite(beginner.difference.mean));
  assert.equal(x.base.trials,3);
});

test('reject invalid trial ranges and RNG overflow',()=>{
  assert.throws(()=>runExperiment({...tiny,trials:1}),RangeError);
  assert.throws(()=>runExperiment({...tiny,trials:1001}),RangeError);
  assert.throws(()=>runExperiment({...tiny,seed:0xffffffff}),RangeError);
  assert.throws(()=>runExperiment({...tiny,learners:0}),RangeError);
});

test('CSV, paper narrative, and four figures are generated from measured outputs',()=>{
  const e=runExperiment(tiny,{includeLearners:true});
  const x=runSensitivity(tiny);
  const trialCsv=toCsv(trialCsvRows(e));
  assert.equal(trialCsv.trim().split(/\r?\n/).length,4);
  assert.equal(toCsv(summaryCsvRows(e)).trim().split(/\r?\n/).length,7);
  assert.equal(toCsv(sensitivityCsvRows(x)).trim().split(/\r?\n/).length,11);
  assert.ok(toCsv(e.learners).includes('learnerId'));
  const report=paperReport(e,x);
  assert.ok(report.includes(e.summary.comparison.final.adaptive.mean.toFixed(1)));
  assert.ok(report.includes('synthetic dataset'));
  const charts=buildFigures(e,x);
  assert.equal(Object.keys(charts).length,4);
  assert.ok(Object.values(charts).every(v=>v.startsWith('<svg')&&v.includes('</svg>')));
});

test('CSV escapes quotes, commas, and newlines',()=>{
  assert.equal(toCsv([{name:'A,"B"',note:'one\ntwo'}]),'name,note\r\n"A,""B""","one\ntwo"\r\n');
});
