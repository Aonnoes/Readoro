// The paper handoff. Every number comes from the experiment; the prose only reacts to it.
import { SKILLS, DIFFICULTIES, DIFFICULTY_LEVELS } from '../lib/config.js';
import { fixed as fmt, interval } from './format.js';

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
const numberWord = n => NUMBER_WORDS[n] ?? String(n);

const row = cells => `| ${cells.join(' | ')} |`;
const table = (header, rows) => [row(header), row(header.map(() => '---')), ...rows.map(row)].join('\n');

const HEADLINE_ROWS = [
  ['Baseline assessment (%)', 'baseline', 1],
  ['Final assessment (%)', 'final', 1],
  ['Gain from baseline (percentage points)', 'gain', 1],
  ['Practice quiz accuracy (%)', 'practice', 1],
  ['Average simulated ability change (0–1)', 'ability', 3],
  ['Learners advancing ≥1 level (%)', 'advancement', 1],
];

function tables(exp, sensitivity) {
  const { comparison, bySkill, byLevel, activity } = exp.summary;
  return {
    outcomes: table(['Metric', 'Fixed', 'Adaptive', 'Adaptive − Fixed'],
      HEADLINE_ROWS.map(([name, key, digits]) => [name,
        interval(comparison[key].fixed, digits),
        interval(comparison[key].adaptive, digits),
        interval(comparison[key].difference, digits)])),
    skills: table(['Comprehension skill', 'Baseline (%)', 'Final fixed (%)', 'Final adaptive (%)', 'Ability Δ fixed', 'Ability Δ adaptive'],
      SKILLS.map(skill => [skill,
        fmt(bySkill[skill].baseline.fixed.mean),
        fmt(bySkill[skill].final.fixed.mean),
        fmt(bySkill[skill].final.adaptive.mean),
        fmt(bySkill[skill].abilityChange.fixed.mean, 3),
        fmt(bySkill[skill].abilityChange.adaptive.mean, 3)])),
    levels: table(['Reading level', 'Baseline (%)', 'Fixed final (%)', 'Adaptive final (%)'],
      DIFFICULTIES.map(level => [level,
        fmt(byLevel[level].baseline.mean),
        fmt(byLevel[level].fixedFinal.mean),
        fmt(byLevel[level].adaptiveFinal.mean)])),
    activities: table(['Activity', 'Fixed (%) [95% CI]', 'Adaptive (%) [95% CI]'],
      activity.map(a => [String(a.activity), interval(a.fixed), interval(a.adaptive)])),
    sensitivity: table(['Parameter changed', 'Fixed final (%)', 'Adaptive final (%)', 'Difference [95% CI]', 'Adaptive wins'],
      [sensitivity.base, ...sensitivity.cases].map(r => [r.name,
        fmt(r.fixed.mean), fmt(r.adaptive.mean), interval(r.difference), `${r.adaptiveWins}/${r.trials}`])),
  };
}

const difficultyMix = mix => DIFFICULTIES.map(level => `${level} ${fmt(mix[level]?.mean ?? 0)}%`).join(', ');

function configSection(c) {
  const levelValues = DIFFICULTIES.map(level => `${level} **${DIFFICULTY_LEVELS[level].toFixed(2)}**`);
  return `## Exact simulation configuration

- Trial count: **${c.trials}**; virtual learners per trial: **${c.learners}** (independently generated for each trial).
- Seed sequence: **${c.seed}–${c.seed + c.trials - 1}**, consecutive integer seeds; each trial uses the same initial learner profiles and baseline results under both strategies.
- Practice activities per learner: **${c.activitiesPerLearner}** with four simulated responses per activity.
- Baseline and final assessment: **${c.baselineQuestions} questions each**, at **Intermediate** difficulty; final uses the same question metadata but new Bernoulli responses. Assessment does not update ability.
- Fixed scenario: **${c.fixedDifficulty}** difficulty for every practice activity.
- Adaptive scenario: chooses difficulty using cumulative simulated score and the configured reading-level cutoffs.
- Logistic probability model: P(correct) = 1 / (1 + exp(−${c.slope} × (ability − difficulty))). Numeric difficulty values are ${levelValues.join(', ')}.
- Initial per-skill ability: normal(mean **${c.initialAbilityMean}**, SD **${c.initialAbilitySd}**) clipped to [0,1]; ability rises by **${c.learningRate}** after each correct practice answer, clipped to [0,1]. All parameters are **assumed, not estimated from student data**.
- Reading levels use the **unrounded** overall ratio: Beginner <50%, Intermediate 50%–<75%, Advanced ≥75%.
- Outcomes are averaged **across trials**, with two-sided **95% Student-t confidence intervals for trial-level means** (df = ${c.trials - 1}); scenario differences use **paired per-trial differences**, not independent CIs.`;
}

function procedureSection(c, caseCount) {
  return `## Section 4.3 - Simulation procedure

The study executed ${c.trials} Monte Carlo trials with ${c.learners} synthetic virtual learners in each trial. Within each trial, both scenarios received identical initial skill profiles and baseline assessment results, then completed ${c.activitiesPerLearner} practice activities. Fixed difficulty remained ${c.fixedDifficulty}, whereas the adaptive strategy reassigned practice difficulty in response to each learner's cumulative simulated performance. Each scenario completed an ${c.baselineQuestions}-item Intermediate final assessment without further ability updates. Trial-level mean outcomes were aggregated with 95% confidence intervals. ${numberWord(caseCount)} one-at-a-time sensitivity cases were also run using the same seed sequence and changing only the listed parameter.`;
}

function resultsSection(exp, t) {
  const { summary: s, config: c } = exp;
  return `## Section 4.4 - Results

### Table 4.1 - Fixed versus adaptive outcomes (trial means, 95% CI)

${t.outcomes}

Adaptive finished above fixed in **${s.adaptiveWins}/${c.trials}** trials (fixed ahead: ${s.fixedWins}; ties: ${s.ties}). The trial-mean final difference was **${interval(s.comparison.final.difference)} percentage points**.

**Practice difficulty allocation:** Fixed: ${difficultyMix(s.difficulty.fixed)}. Adaptive: ${difficultyMix(s.difficulty.adaptive)}. Because the two strategies use different practice difficulties, their raw practice accuracies are **not like-for-like effectiveness measurements**.

### Table 4.2 - Comprehension skills

${t.skills}

Skills are scored as correct responses divided by assessed responses. Ability deltas are changes to **latent simulated ability**, not directly observed assessment gains.

### Reading level distribution

${t.levels}

Reading-level advancement can occur **without modeled learning** because baseline and final assessments draw separate stochastic responses. It must not be interpreted solely as a measure of learning caused by practice.

### Practice score across activities (source for Figure 4.5)

${t.activities}

### Table 4.3 - Sensitivity analysis (one change at a time)

${t.sensitivity}

The default case is the first row. Every sensitivity case uses the same ${c.trials} seeds and leaves all other parameters unchanged.`;
}

// Words follow the data, so a flipped result never ships with a victory-lap sentence.
function verdictOf(difference) {
  if (difference.low > 0) return { direction: 'higher', verb: 'outperformed' };
  if (difference.high < 0) return { direction: 'lower', verb: 'underperformed' };
  return { direction: difference.mean >= 0 ? 'slightly higher' : 'slightly lower', verb: 'was not distinguishable from' };
}

function analysisSection(exp, sensitivity) {
  const { summary: s, config: c } = exp;
  const { final, baseline } = s.comparison;
  const { direction, verb } = verdictOf(final.difference);
  const byId = id => [sensitivity.base, ...sensitivity.cases].find(r => r.id === id);
  const beginner = byId('fixed-beginner');
  const advanced = byId('fixed-advanced');
  const noLearning = byId('learning-0');
  const easierPractice = (s.difficulty.adaptive.Beginner?.mean ?? 0) > (s.difficulty.fixed.Beginner?.mean ?? 0);
  const mechanism = easierPractice
    ? "The adaptive strategy assigned more practice at Beginner difficulty, which increased the probability of correct practice responses under the model's logistic rule. Because the learning rule increases skill ability only after a correct practice answer, easier practice can create a mechanical advantage."
    : 'Because the learning rule increases skill ability only after a correct practice answer, the practice difficulty mix directly shapes how much simulated ability each strategy gains.';

  return `## Section 4.5 - Analysis of results

Under the specified simulated assumptions, adaptive difficulty reached a ${direction} final assessment average (**${fmt(final.adaptive.mean)}%**) than fixed ${c.fixedDifficulty} difficulty (**${fmt(final.fixed.mean)}%**), a paired trial-mean difference of **${fmt(final.difference.mean)} percentage points** (95% CI **${fmt(final.difference.low)} to ${fmt(final.difference.high)}**). Both strategies began at **${fmt(baseline.fixed.mean)}%** because they used the same baseline answers within each learner pair. ${mechanism}

Sensitivity experiments demonstrate that this advantage is conditional: Fixed Beginner yielded **${fmt(beginner.fixed.mean)}%** versus adaptive **${fmt(beginner.adaptive.mean)}%**, whereas Fixed Advanced yielded **${fmt(advanced.fixed.mean)}%** versus adaptive **${fmt(advanced.adaptive.mean)}%**. With learning rate zero, the observed final difference was **${fmt(noLearning.difference.mean)} points** (95% CI ${fmt(noLearning.difference.low)} to ${fmt(noLearning.difference.high)}), illustrating the stochastic retest variation when practice cannot increase latent ability. These results support the narrow statement that adaptive difficulty ${verb} **fixed ${c.fixedDifficulty}** under this particular model and parameterization, **not** that adaptive systems necessarily improve real student reading comprehension.`;
}

const FIGURES_SECTION = `## Figures included

- **Figure 4.5:** Practice accuracy by activity with 95% trial-level confidence bands.
- **Figure 4.6:** Reading level composition at baseline and at the two final assessments.
- **Figure 4.7:** Final assessment score with 95% confidence intervals (supporting figure).
- **Figure 4.8:** Sensitivity analysis of paired final-score differences with 95% CIs (supporting figure).`;

const limitationsSection = trials => `## Limitations and reproducibility notes

1. The learner population is synthetic; there is no surveyed or measured learner dataset and no fitted predictive model. In Sections 3.1 and 4.1, describe the generated records as a **synthetic dataset**; in 4.2, describe **parameter assumptions and sensitivity checks**, not model training.
2. The ability update is assumed and simplistic; it has no fatigue, forgetting, incorrect-answer learning, or differential skill learning. More correct answers mechanically generate more simulated learning.
3. Baseline and final reuse the same question metadata with independent response draws. Short 8-item assessments increase random classification variation; progression alone is not a causal learning estimate.
4. Initial abilities are clipped normal draws. The four skills share the same distribution and practice-selection rule. Exercise text is not scored; only exercise/question metadata determines skill and difficulty.
5. Both scenarios have the same baseline, but their later random response streams are independent. Paired trial aggregation and uncertainty quantify variation but do not remove this source of random variation.
6. Keep **engine version**, exact **trial seeds**, and **configuration** with these tables. Changing any one requires regeneration of the paper figures, tables, and conclusions.
7. Confidence intervals quantify variation **across this simulation's ${trials} trial replicates**, not the precision of a real-world educational effect.`;

const FILES_SECTION = `## Files and verification

- \`summary.csv\`: summary means and trial-level confidence intervals.
- \`trials.csv\`: each trial's calculated measurements and seed.
- \`sensitivity.csv\`: parameter changes, paired difference, 95% interval, win counts.
- \`learner-records.csv\`: one row per simulated learner *per scenario*, for audit; no actual student data.
- \`experiment.json\`: exact configuration, trial statistics, summary results.
- \`sensitivity.json\`: full sensitivity output.
- \`figure-4-5.svg\`, \`figure-4-6.svg\`, \`figure-4-7.svg\`, \`figure-4-8.svg\`: regenerable vector figures.
- Run \`npm test\` and \`npm run results\` to verify and regenerate, or \`npm run verify\` to check that these files still match the engine.`;

const BANNER = '> **Reproducible synthetic experiment.** Generated from the Readoro Monte Carlo engine. These are not observations of real students. This is a finalized **run of the stated configuration**, not an empirically validated model. If the engine or configuration changes, regenerate all results and revise the paper together.';

export function paperReport(exp, sensitivity) {
  const t = tables(exp, sensitivity);
  return [
    '# Readoro - Simulation Results and Analysis',
    BANNER,
    configSection(exp.config),
    procedureSection(exp.config, sensitivity.cases.length),
    resultsSection(exp, t),
    analysisSection(exp, sensitivity),
    FIGURES_SECTION,
    limitationsSection(exp.config.trials),
    FILES_SECTION,
  ].join('\n\n') + '\n';
}
