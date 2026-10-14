/** Pure formatters used by the CLI and browser; no hard-coded research results. */
import { SKILLS, DIFFICULTIES } from './lib/config.js';

export const fixed = (n, decimals=1) => n === null || n === undefined ? 'N/A' : Number(n).toFixed(decimals);
export const interval = (ci, digits=1) => ci ? `${fixed(ci.mean,digits)} [${fixed(ci.low,digits)}–${fixed(ci.high,digits)}]` : 'N/A';
const esc = value => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g,'""') + '"' : text;
};
export function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  return [cols.map(esc).join(','), ...rows.map(row => cols.map(col => esc(row[col])).join(','))].join('\r\n') + '\r\n';
}

export function trialCsvRows(result) {
  return result.trialResults.map(t => ({
    trial:t.trial,seed:t.seed,
    baselinePercent:t.fixed.baseline,
    fixedFinalPercent:t.fixed.final,adaptiveFinalPercent:t.adaptive.final,
    finalDifferencePoints:t.adaptive.final-t.fixed.final,
    fixedGainPoints:t.fixed.gain,adaptiveGainPoints:t.adaptive.gain,
    fixedPracticePercent:t.fixed.practice,adaptivePracticePercent:t.adaptive.practice,
    fixedAbilityChange:t.fixed.ability,adaptiveAbilityChange:t.adaptive.ability,
    fixedLevelAdvancedPercent:t.fixed.advancement,adaptiveLevelAdvancedPercent:t.adaptive.advancement,
  }));
}

export function sensitivityCsvRows(sensitivity) {
  return [sensitivity.base,...sensitivity.cases].map(c => ({
    case:c.name,parameterOverrides:JSON.stringify(c.overrides),
    fixedFinalPercent:c.fixed.mean,adaptiveFinalPercent:c.adaptive.mean,
    differencePoints:c.difference.mean,
    differenceCI95Low:c.difference.low,differenceCI95High:c.difference.high,
    adaptiveWins:c.adaptiveWins,trials:c.trials,
  }));
}

export function summaryCsvRows(result) {
  return Object.entries(result.summary.comparison).map(([name,c]) => ({
    metric:name,
    fixedMean:c.fixed?.mean ?? null,fixedCI95Low:c.fixed?.low ?? null,fixedCI95High:c.fixed?.high ?? null,
    adaptiveMean:c.adaptive?.mean ?? null,adaptiveCI95Low:c.adaptive?.low ?? null,adaptiveCI95High:c.adaptive?.high ?? null,
    differenceMean:c.difference?.mean ?? null,differenceCI95Low:c.difference?.low ?? null,differenceCI95High:c.difference?.high ?? null,
  }));
}

/** Markdown for Results, with methodology/limitations, generated from the same calculations as CSVs. */
export function paperReport(exp, sensitivity) {
  const c = exp.config, s = exp.summary;
  const cmp = s.comparison;
  const appendixRows = [sensitivity.base,...sensitivity.cases];
  const metricNames = [
    ['Baseline assessment (%)','baseline',1],
    ['Final assessment (%)','final',1],
    ['Gain from baseline (percentage points)','gain',1],
    ['Practice quiz accuracy (%)','practice',1],
    ['Average simulated ability change (0–1)','ability',3],
    ['Learners advancing ≥1 level (%)','advancement',1],
  ];
  const heading = (cells) => '| '+cells.join(' | ')+' |';
  const table = (header,rows) => [heading(header),heading(header.map(()=> '---')),...rows.map(heading)].join('\n');
  const t1 = table(['Metric','Fixed','Adaptive','Adaptive − Fixed'], metricNames.map(([name,key,dp]) => [name,
    interval(cmp[key].fixed,dp),interval(cmp[key].adaptive,dp),interval(cmp[key].difference,dp)]));
  const t2 = table(['Comprehension skill','Baseline (%)','Final fixed (%)','Final adaptive (%)','Ability Δ fixed','Ability Δ adaptive'],
    SKILLS.map(skill => { const a=s.bySkill[skill]; return [skill,
      fixed(a.baseline.fixed.mean),fixed(a.final.fixed.mean),fixed(a.final.adaptive.mean),
      fixed(a.abilityChange.fixed.mean,3),fixed(a.abilityChange.adaptive.mean,3)]; }));
  const t3 = table(['Reading level','Baseline (%)','Fixed final (%)','Adaptive final (%)'],
    DIFFICULTIES.map(level => [level,fixed(s.byLevel[level].baseline.mean),
      fixed(s.byLevel[level].fixedFinal.mean),fixed(s.byLevel[level].adaptiveFinal.mean)]));
  const t4 = table(['Parameter changed','Fixed final (%)','Adaptive final (%)','Difference [95% CI]','Adaptive wins'],
    appendixRows.map(row => [row.name,fixed(row.fixed.mean),fixed(row.adaptive.mean),interval(row.difference),
      `${row.adaptiveWins}/${row.trials}`]));
  const t5 = table(['Activity','Fixed (%) [95% CI]','Adaptive (%) [95% CI]'],
    s.activity.map(row => [String(row.activity),interval(row.fixed),interval(row.adaptive)]));
  const diff = s.difficulty;
  const noLearn = appendixRows.find(r=>r.id==='learning-0');
  return `# Readoro — Official Simulation Results and Paper Handoff

> **Reproducible synthetic experiment.** Generated from the Readoro Monte Carlo engine. These are not observations of real students. This is a finalized **run of the stated configuration**, not an empirically validated model. If the engine or configuration changes, regenerate all results and revise the paper together.

## Exact simulation configuration

- Trial count: **${c.trials}**; virtual learners per trial: **${c.learners}** (independently generated for each trial).
- Seed sequence: **${c.seed}–${c.seed+c.trials-1}**, consecutive integer seeds; each trial uses the same initial learner profiles and baseline results under both strategies.
- Practice activities per learner: **${c.activitiesPerLearner}** with four simulated responses per activity.
- Baseline and final assessment: **${c.baselineQuestions} questions each**, at **Intermediate** difficulty; final uses the same question metadata but new Bernoulli responses. Assessment does not update ability.
- Fixed scenario: **${c.fixedDifficulty}** difficulty for every practice activity.
- Adaptive scenario: chooses difficulty using cumulative simulated score and the configured reading-level cutoffs.
- Logistic probability model: P(correct) = 1 / (1 + exp(−${c.slope} × (ability − difficulty))). Numeric difficulty values are Beginner **0.35**, Intermediate **0.60**, Advanced **0.85**.
- Initial per-skill ability: normal(mean **${c.initialAbilityMean}**, SD **${c.initialAbilitySd}**) clipped to [0,1]; ability rises by **${c.learningRate}** after each correct practice answer, clipped to [0,1]. All parameters are **assumed, not estimated from student data**.
- Reading levels use the **unrounded** overall ratio: Beginner <50%, Intermediate 50%–<75%, Advanced ≥75%.
- Outcomes are averaged **across trials**, with two-sided **95% Student-t confidence intervals for trial-level means** (df = ${c.trials-1}); scenario differences use **paired per-trial differences**, not independent CIs.

## Section 4.3 — Simulation procedure

The study executed ${c.trials} Monte Carlo trials with ${c.learners} synthetic virtual learners in each trial. Within each trial, both scenarios received identical initial skill profiles and baseline assessment results, then completed ${c.activitiesPerLearner} practice activities. Fixed difficulty remained ${c.fixedDifficulty}, whereas the adaptive strategy reassigned practice difficulty in response to each learner's cumulative simulated performance. Each scenario completed an ${c.baselineQuestions}-item Intermediate final assessment without further ability updates. Trial-level mean outcomes were aggregated with 95% confidence intervals. Nine one-at-a-time sensitivity cases were also run using the same seed sequence and changing only the listed parameter.

## Section 4.4 — Results

### Table 4.1 — Fixed versus adaptive outcomes (trial means, 95% CI)

${t1}

Adaptive finished above fixed in **${s.adaptiveWins}/${c.trials}** trials (fixed ahead: ${s.fixedWins}; ties: ${s.ties}). The trial-mean final difference was **${interval(cmp.final.difference)} percentage points**.

**Practice difficulty allocation:** Fixed: Beginner ${fixed(diff.fixed.Beginner?.mean??0)}%, Intermediate ${fixed(diff.fixed.Intermediate?.mean??0)}%, Advanced ${fixed(diff.fixed.Advanced?.mean??0)}%. Adaptive: Beginner ${fixed(diff.adaptive.Beginner?.mean??0)}%, Intermediate ${fixed(diff.adaptive.Intermediate?.mean??0)}%, Advanced ${fixed(diff.adaptive.Advanced?.mean??0)}%. Because the two strategies use different practice difficulties, their raw practice accuracies are **not like-for-like effectiveness measurements**.

### Table 4.2 — Comprehension skills

${t2}

Skills are scored as correct responses divided by assessed responses. Ability deltas are changes to **latent simulated ability**, not directly observed assessment gains.

### Reading level distribution

${t3}

Reading-level advancement can occur **without modeled learning** because baseline and final assessments draw separate stochastic responses. It must not be interpreted solely as a measure of learning caused by practice.

### Practice score across activities (source for Figure 4.5)

${t5}

### Table 4.3 — Sensitivity analysis (one change at a time)

${t4}

The default case is the first row. Every sensitivity case uses the same ${c.trials} seeds and leaves all other parameters unchanged.

## Section 4.5 — Analysis of results

Under the specified simulated assumptions, adaptive difficulty reached a higher final assessment average (**${fixed(cmp.final.adaptive.mean)}%**) than fixed ${c.fixedDifficulty} difficulty (**${fixed(cmp.final.fixed.mean)}%**), a paired trial-mean difference of **${fixed(cmp.final.difference.mean)} percentage points** (95% CI **${fixed(cmp.final.difference.low)} to ${fixed(cmp.final.difference.high)}**). Both strategies began at **${fixed(cmp.baseline.fixed.mean)}%** because they used the same baseline answers within each learner pair. The adaptive strategy assigned more practice at Beginner difficulty, which increased the probability of correct practice responses under the model's logistic rule. Because the learning rule increases skill ability only after a correct practice answer, easier practice can create a mechanical advantage.

Sensitivity experiments demonstrate that this advantage is conditional: Fixed Beginner yielded **${fixed(appendixRows.find(x=>x.id==='fixed-beginner').fixed.mean)}%** versus adaptive **${fixed(appendixRows.find(x=>x.id==='fixed-beginner').adaptive.mean)}%**, whereas Fixed Advanced yielded **${fixed(appendixRows.find(x=>x.id==='fixed-advanced').fixed.mean)}%** versus adaptive **${fixed(appendixRows.find(x=>x.id==='fixed-advanced').adaptive.mean)}%**. With learning rate zero, the observed final difference was **${fixed(noLearn.difference.mean)} points** (95% CI ${fixed(noLearn.difference.low)} to ${fixed(noLearn.difference.high)}), illustrating the stochastic retest variation when practice cannot increase latent ability. These results support the narrow statement that adaptive difficulty outperformed **fixed ${c.fixedDifficulty}** under this particular model and parameterization, **not** that adaptive systems necessarily improve real student reading comprehension.

## Figures included

- **Figure 4.5:** Practice accuracy by activity with 95% trial-level confidence bands.
- **Figure 4.6:** Reading level composition at baseline and at the two final assessments.
- **Figure 4.7:** Final assessment score with 95% confidence intervals (supporting figure).
- **Figure 4.8:** Sensitivity analysis of paired final-score differences with 95% CIs (supporting figure).

## Limitations and reproducibility notes

1. The learner population is synthetic; there is no surveyed or measured learner dataset and no fitted predictive model. In Sections 3.1 and 4.1, describe the generated records as a **synthetic dataset**; in 4.2, describe **parameter assumptions and sensitivity checks**, not model training.
2. The ability update is assumed and simplistic; it has no fatigue, forgetting, incorrect-answer learning, or differential skill learning. More correct answers mechanically generate more simulated learning.
3. Baseline and final reuse the same question metadata with independent response draws. Short 8-item assessments increase random classification variation; progression alone is not a causal learning estimate.
4. Initial abilities are clipped normal draws. The four skills share the same distribution and practice-selection rule. Exercise text is not scored; only exercise/question metadata determines skill and difficulty.
5. Both scenarios have the same baseline, but their later random response streams are independent. Paired trial aggregation and uncertainty quantify variation but do not remove this source of random variation.
6. Keep **engine version**, exact **trial seeds**, and **configuration** with these tables. Changing any one requires regeneration of the paper figures, tables, and conclusions.
7. Confidence intervals quantify variation **across this simulation's 20 trial replicates**, not the precision of a real-world educational effect.

## Files and verification

- \`summary.csv\`: summary means and trial-level confidence intervals.
- \`trials.csv\`: each trial's calculated measurements and seed.
- \`sensitivity.csv\`: parameter changes, paired difference, 95% interval, win counts.
- \`learner-records.csv\`: one row per simulated learner *per scenario*, for audit; no actual student data.
- \`experiment.json\`: exact configuration, trial statistics, summary results.
- \`sensitivity.json\`: full sensitivity output.
- \`figure-4-5.svg\`, \`figure-4-6.svg\`, \`figure-4-7.svg\`, \`figure-4-8.svg\`: regenerable vector figures.
- Run \`npm test\` and \`node scripts/run-experiments.mjs --sensitivity\` to verify and regenerate.
`;
}

function xml(v) {return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
const ink='#14213D', muted='#6F7988', grid='#DDE4EB', fixedColor='#CF755D', adaptiveColor='#437D8D', dark='#F6F8FA';
function chartShell(title,subtitle,parts,height=540) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${height}" viewBox="0 0 1000 ${height}"><rect width="1000" height="${height}" fill="#FFFFFF"/>`+
    `<text x="52" y="61" fill="${ink}" font-family="Arial,sans-serif" font-size="26" font-weight="700">${xml(title)}</text>`+
    `<text x="52" y="91" fill="${muted}" font-family="Arial,sans-serif" font-size="15">${xml(subtitle)}</text>`+
    parts + `<text x="52" y="${height-21}" font-family="Arial,sans-serif" font-size="12" fill="${muted}">Source: Readoro synthetic Monte Carlo experiment · trial-level 95% confidence intervals</text></svg>`;
}
const line = (x1,y1,x2,y2,color=grid,width=1) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
const label = (x,y,t,size=15,color=ink,anchor='middle') => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}">${xml(t)}</text>`;
const rect = (x,y,w,h,fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}"/>`;
const circle=(x,y,r,fill)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

export function buildFigures(exp, sensitivity) {
  const s=exp.summary;
  const figs={};
  { // Figure 4.5: confidence bands
    const a=s.activity, x0=105,x1=918,y0=410,y1=145;
    const xs=i=>x0+i*(x1-x0)/Math.max(1,a.length-1);
    const ys=v=>y0-(v-0)*(y0-y1)/100;
    let g='';for(let v=0;v<=100;v+=20){g+=line(x0,ys(v),x1,ys(v))+label(76,ys(v)+5,`${v}%`,14,muted,'end');}
    for(let i=0;i<a.length;i++)g+=label(xs(i),y0+30,String(a[i].activity),13,muted);
    for(const [key,color] of [['fixed',fixedColor],['adaptive',adaptiveColor]]){
      const upper=a.map((r,i)=>`${xs(i)},${ys(r[key].high)}`);
      const lower=a.map((r,i)=>`${xs(i)},${ys(r[key].low)}`).reverse();
      g+=`<polygon points="${upper.concat(lower).join(' ')}" fill="${color}" opacity="0.16"/>`;
      g+=`<polyline points="${a.map((r,i)=>`${xs(i)},${ys(r[key].mean)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3"/>`;
      for(let i=0;i<a.length;i++)g+=circle(xs(i),ys(a[i][key].mean),4,color);
    }
    g+=label(505,480,'Practice activity',15,ink);
    g+=rect(580,108,16,10,fixedColor)+label(605,119,'Fixed',14,ink,'start');
    g+=rect(699,108,16,10,adaptiveColor)+label(724,119,'Adaptive',14,ink,'start');
    figs['figure-4-5.svg']=chartShell('Practice accuracy across activities',
      'Mean percentage correct per activity · shaded bands indicate 95% trial-level CI',g);
  }
  { // Figure 4.6 grouped stacked bars
    const entries=[['Baseline',DIFFICULTIES.map(l=>s.byLevel[l].baseline.mean)],
      ['Fixed final',DIFFICULTIES.map(l=>s.byLevel[l].fixedFinal.mean)],
      ['Adaptive final',DIFFICULTIES.map(l=>s.byLevel[l].adaptiveFinal.mean)]];
    const colors=['#D1AB75','#84A8B1','#64886A'];
    let g='';for(let i=0;i<=100;i+=20){let x=205+i*6.7;g+=line(x,142,x,395)+label(x,421,`${i}%`,13,muted);}
    entries.forEach(([name,vals],j)=>{const y=171+j*87;g+=label(172,y+22,name,17,ink,'end');let offset=0;vals.forEach((v,k)=>{let w=v*6.7;g+=rect(205+offset*6.7,y,w,48,colors[k]);if(w>43)g+=label(205+(offset+v/2)*6.7,y+30,`${v.toFixed(1)}%`,14,'#FFFFFF');offset+=v;});});
    DIFFICULTIES.forEach((l,k)=>{g+=rect(275+k*225,470,17,12,colors[k])+label(299+k*225,482,l,14,ink,'start')});
    figs['figure-4-6.svg']=chartShell('Reading level distribution',
      'Share of synthetic learners classified Beginner, Intermediate, or Advanced',g,550);
  }
  { // Figure 4.7 final score with CI
    const a=[['Fixed',s.comparison.final.fixed,fixedColor],['Adaptive',s.comparison.final.adaptive,adaptiveColor]];
    let g='';for(let v=0;v<=100;v+=20){let y=425-v*2.75;g+=line(115,y,920,y)+label(95,y+5,`${v}%`,14,muted,'end');}
    a.forEach(([name,ci,color],i)=>{const x=350+i*320,top=425-ci.mean*2.75;
      g+=rect(x-72,top,144,425-top,color);
      const highY=425-ci.high*2.75,lowY=425-ci.low*2.75;
      g+=line(x,highY,x,lowY,ink,2)+line(x-16,highY,x+16,highY,ink,2)+line(x-16,lowY,x+16,lowY,ink,2);
      g+=label(x,top-22,`${ci.mean.toFixed(1)}%`,22,ink);
      g+=label(x,456,name,18,ink);});
    const d=s.comparison.final.difference;
    g+=label(500,510,`Paired difference: +${d.mean.toFixed(1)} percentage points [${d.low.toFixed(1)}, ${d.high.toFixed(1)}]`,16,ink);
    figs['figure-4-7.svg']=chartShell('Final assessment scores by strategy',
      'Fixed Intermediate compared with adaptive difficulty · 95% confidence intervals',g,565);
  }
  { // sensitivity differences, ordered default first
    const items=[sensitivity.base,...sensitivity.cases],x0=345,x1=918,min=-8,max=12;
    const x=v=>x0+(v-min)*(x1-x0)/(max-min);
    let g='';for(let v=-8;v<=12;v+=4){g+=line(x(v),139,x(v),540,v===0?'#707A84':grid,v===0?2:1)+label(x(v),566,String(v),13,muted);}
    items.forEach((r,i)=>{const y=163+i*40;
      g+=label(322,y+6,r.name,14,ink,'end');
      const d=r.difference;
      g+=line(x(d.low),y,x(d.high),y,adaptiveColor,3)+line(x(d.low),y-5,x(d.low),y+5,adaptiveColor,2)+line(x(d.high),y-5,x(d.high),y+5,adaptiveColor,2);
      g+=circle(x(d.mean),y,5,adaptiveColor);});
    g+=label(630,600,'Adaptive minus fixed final score (percentage points)',15,ink);
    figs['figure-4-8.svg']=chartShell('Sensitivity to model assumptions',
      'One parameter changed at a time · dot: paired trial mean; whisker: 95% CI',g,650);
  }
  return figs;
}
