# Readoro - Simulation Results and Analysis

> **Reproducible synthetic experiment.** Generated from the Readoro Monte Carlo engine. These are not observations of real students. This is a finalized **run of the stated configuration**, not an empirically validated model. If the engine or configuration changes, regenerate all results and revise the paper together.

## Exact simulation configuration

- Trial count: **20**; virtual learners per trial: **100** (independently generated for each trial).
- Seed sequence: **12345–12364**, consecutive integer seeds; each trial uses the same initial learner profiles and baseline results under both strategies.
- Practice activities per learner: **10** with four simulated responses per activity.
- Baseline and final assessment: **8 questions each**, at **Intermediate** difficulty; final uses the same question metadata but new Bernoulli responses. Assessment does not update ability.
- Fixed scenario: **Intermediate** difficulty for every practice activity.
- Adaptive scenario: chooses difficulty using cumulative simulated score and the configured reading-level cutoffs.
- Logistic probability model: P(correct) = 1 / (1 + exp(−6 × (ability − difficulty))). Numeric difficulty values are Beginner **0.35**, Intermediate **0.60**, Advanced **0.85**.
- Initial per-skill ability: normal(mean **0.55**, SD **0.15**) clipped to [0,1]; ability rises by **0.02** after each correct practice answer, clipped to [0,1]. All parameters are **assumed, not estimated from student data**.
- Reading levels use the **unrounded** overall ratio: Beginner <50%, Intermediate 50%–<75%, Advanced ≥75%.
- Outcomes are averaged **across trials**, with two-sided **95% Student-t confidence intervals for trial-level means** (df = 19); scenario differences use **paired per-trial differences**, not independent CIs.

## Section 4.3 - Simulation procedure

The study executed 20 Monte Carlo trials with 100 synthetic virtual learners in each trial. Within each trial, both scenarios received identical initial skill profiles and baseline assessment results, then completed 10 practice activities. Fixed difficulty remained Intermediate, whereas the adaptive strategy reassigned practice difficulty in response to each learner's cumulative simulated performance. Each scenario completed an 8-item Intermediate final assessment without further ability updates. Trial-level mean outcomes were aggregated with 95% confidence intervals. Nine one-at-a-time sensitivity cases were also run using the same seed sequence and changing only the listed parameter.

## Section 4.4 - Results

### Table 4.1 - Fixed versus adaptive outcomes (trial means, 95% CI)

| Metric | Fixed | Adaptive | Adaptive − Fixed |
| --- | --- | --- | --- |
| Baseline assessment (%) | 43.8 [43.1–44.5] | 43.8 [43.1–44.5] | 0.0 [0.0–0.0] |
| Final assessment (%) | 55.5 [54.6–56.3] | 57.6 [56.8–58.5] | 2.2 [1.1–3.3] |
| Gain from baseline (percentage points) | 11.7 [10.5–12.8] | 13.8 [12.8–14.9] | 2.2 [1.1–3.3] |
| Practice quiz accuracy (%) | 47.4 [46.8–48.0] | 57.0 [56.5–57.4] | 9.5 [9.1–10.0] |
| Average simulated ability change (0–1) | 0.093 [0.092–0.094] | 0.112 [0.111–0.113] | 0.019 [0.018–0.020] |
| Learners advancing ≥1 level (%) | 45.0 [42.7–47.2] | 50.4 [48.5–52.3] | 5.5 [3.5–7.4] |

Adaptive finished above fixed in **15/20** trials (fixed ahead: 5; ties: 0). The trial-mean final difference was **2.2 [1.1–3.3] percentage points**.

**Practice difficulty allocation:** Fixed: Beginner 0.0%, Intermediate 100.0%, Advanced 0.0%. Adaptive: Beginner 27.4%, Intermediate 71.2%, Advanced 1.4%. Because the two strategies use different practice difficulties, their raw practice accuracies are **not like-for-like effectiveness measurements**.

### Table 4.2 - Comprehension skills

| Comprehension skill | Baseline (%) | Final fixed (%) | Final adaptive (%) | Ability Δ fixed | Ability Δ adaptive |
| --- | --- | --- | --- | --- | --- |
| Literal Understanding | 43.9 | 56.3 | 57.5 | 0.095 | 0.115 |
| Vocabulary in Context | 44.6 | 56.2 | 57.4 | 0.095 | 0.112 |
| Main Idea | 43.5 | 56.2 | 58.8 | 0.091 | 0.111 |
| Inference | 43.1 | 53.1 | 56.9 | 0.091 | 0.111 |

Skills are scored as correct responses divided by assessed responses. Ability deltas are changes to **latent simulated ability**, not directly observed assessment gains.

### Reading level distribution

| Reading level | Baseline (%) | Fixed final (%) | Adaptive final (%) |
| --- | --- | --- | --- |
| Beginner | 50.3 | 28.2 | 22.5 |
| Intermediate | 41.3 | 45.3 | 49.9 |
| Advanced | 8.5 | 26.6 | 27.6 |

Reading-level advancement can occur **without modeled learning** because baseline and final assessments draw separate stochastic responses. It must not be interpreted solely as a measure of learning caused by practice.

### Practice score across activities (source for Figure 4.5)

| Activity | Fixed (%) [95% CI] | Adaptive (%) [95% CI] |
| --- | --- | --- |
| 1 | 43.2 [42.0–44.4] | 56.8 [55.7–58.0] |
| 2 | 43.5 [42.3–44.8] | 56.4 [55.1–57.7] |
| 3 | 44.9 [44.0–45.9] | 55.7 [54.3–57.1] |
| 4 | 45.0 [43.6–46.4] | 56.9 [55.5–58.3] |
| 5 | 47.9 [46.9–48.9] | 55.4 [53.7–57.2] |
| 6 | 47.9 [46.6–49.2] | 57.7 [56.7–58.7] |
| 7 | 47.8 [46.3–49.2] | 56.3 [55.0–57.5] |
| 8 | 49.6 [48.3–50.9] | 56.9 [55.5–58.2] |
| 9 | 52.0 [50.9–53.1] | 58.4 [57.2–59.5] |
| 10 | 52.2 [51.2–53.2] | 59.1 [57.8–60.3] |

### Table 4.3 - Sensitivity analysis (one change at a time)

| Parameter changed | Fixed final (%) | Adaptive final (%) | Difference [95% CI] | Adaptive wins |
| --- | --- | --- | --- | --- |
| All defaults | 55.5 | 57.6 | 2.2 [1.1–3.3] | 15/20 |
| Fixed Beginner | 63.3 | 57.6 | -5.6 [-6.8–-4.4] | 0/20 |
| Fixed Advanced | 48.4 | 57.6 | 9.3 [8.1–10.4] | 20/20 |
| Learning rate 0 | 43.9 | 43.8 | -0.1 [-1.3–1.1] | 8/20 |
| Learning rate 0.01 | 49.5 | 50.8 | 1.2 [0.0–2.4] | 15/20 |
| Learning rate 0.04 | 66.7 | 70.0 | 3.3 [2.2–4.4] | 19/20 |
| Response slope 3 | 53.5 | 54.1 | 0.5 [-0.5–1.5] | 11/20 |
| Response slope 10 | 56.3 | 60.4 | 4.1 [3.2–5.1] | 19/20 |
| Initial ability mean 0.40 | 33.3 | 38.7 | 5.5 [4.2–6.7] | 20/20 |
| Initial ability mean 0.70 | 75.8 | 75.2 | -0.7 [-1.5–0.2] | 7/20 |

The default case is the first row. Every sensitivity case uses the same 20 seeds and leaves all other parameters unchanged.

## Section 4.5 - Analysis of results

Under the specified simulated assumptions, adaptive difficulty reached a higher final assessment average (**57.6%**) than fixed Intermediate difficulty (**55.5%**), a paired trial-mean difference of **2.2 percentage points** (95% CI **1.1 to 3.3**). Both strategies began at **43.8%** because they used the same baseline answers within each learner pair. The adaptive strategy assigned more practice at Beginner difficulty, which increased the probability of correct practice responses under the model's logistic rule. Because the learning rule increases skill ability only after a correct practice answer, easier practice can create a mechanical advantage.

Sensitivity experiments demonstrate that this advantage is conditional: Fixed Beginner yielded **63.3%** versus adaptive **57.6%**, whereas Fixed Advanced yielded **48.4%** versus adaptive **57.6%**. With learning rate zero, the observed final difference was **-0.1 points** (95% CI -1.3 to 1.1), illustrating the stochastic retest variation when practice cannot increase latent ability. These results support the narrow statement that adaptive difficulty outperformed **fixed Intermediate** under this particular model and parameterization, **not** that adaptive systems necessarily improve real student reading comprehension.

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

- `summary.csv`: summary means and trial-level confidence intervals.
- `trials.csv`: each trial's calculated measurements and seed.
- `sensitivity.csv`: parameter changes, paired difference, 95% interval, win counts.
- `learner-records.csv`: one row per simulated learner *per scenario*, for audit; no actual student data.
- `experiment.json`: exact configuration, trial statistics, summary results.
- `sensitivity.json`: full sensitivity output.
- `figure-4-5.svg`, `figure-4-6.svg`, `figure-4-7.svg`, `figure-4-8.svg`: regenerable vector figures.
- Run `npm test` and `npm run results` to verify and regenerate, or `npm run verify` to check that these files still match the engine.
