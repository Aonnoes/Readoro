# 🌿 Readoro

**Reading Comprehension Performance Under Fixed and Adaptive Difficulty: A Simulation Study**

Readoro is a research-focused extension of [Readora](https://github.com/zii4h/Readora), a gamified reading comprehension platform. It uses Monte Carlo simulation to compare how virtual learners perform when reading difficulty is **fixed** versus when it **adapts** to their performance, across four comprehension skills.

Built for the **Modeling and Simulation (IMODSIM)** course. Everything runs in the browser and in Node.js with **zero runtime dependencies**.

**Live demo:** https://aonnoes.github.io/Readoro/ (rebuilt automatically on every push to `main`)

## Preview - TODO

## Features

| Area | Features |
| --- | --- |
| **SIMULATION LAB** | Interactive parameters, one-click paired experiments, live results tables and comparison graphs |
| **ENGINE** | Seeded virtual learners, baseline assessments, Monte Carlo responses, documented learning rule, fixed and adaptive difficulty |
| **EXPERIMENTS** | Repeated paired trials, 95% confidence intervals, one-at-a-time sensitivity analysis |
| **EXPORTS** | CSV, JSON, SVG and a Markdown paper handoff, all generated from the same calculations |
| **VERIFICATION** | Automated tests, an independent replay of every learner, and a check that published results still match the engine |

### Four Comprehension Skills

Readoro tracks the same four skills as Readora:

- Literal Understanding
- Vocabulary in Context
- Main Idea
- Inference

### Reading Levels

Levels come from the **unrounded** overall ratio, matching Readora's behaviour.

| Performance | Reading Level |
| --- | --- |
| Below 50% | Beginner |
| 50% to below 75% | Intermediate |
| 75% and above | Advanced |

## HOW THE SIMULATION WORKS

Each trial generates virtual learners, gives them the same baseline assessment, then runs **two copies of every learner** through practice: one under **Fixed** difficulty and one under **Adaptive** difficulty. Both finish with the same final assessment, so any gap comes from the strategy and the random draws, not the starting point.

1. **Generate learners.** Four skill abilities per learner, drawn from a normal distribution and clipped to [0, 1].
2. **Baseline assessment.** Eight Intermediate questions, two per skill.
3. **Practice.** Each activity is four questions from an exercise at the assigned difficulty, with a preference for the learner's weakest skill. Fixed always uses one chosen difficulty. Adaptive uses the learner's current reading level, recomputed from everything answered so far.
4. **Learning.** A correct practice answer raises the practiced skill's ability by the learning rate, up to a ceiling of 1.
5. **Final assessment.** The same eight questions at Intermediate difficulty, with fresh random responses and no learning.
6. **Compare.** Per-trial means are aggregated across trials with Student-t confidence intervals. Scenario differences use paired per-trial differences.

### Response model

```
P(correct) = 1 / (1 + exp(-slope × (ability - difficulty)))
```

| Difficulty | Numeric value |
| --- | --- |
| Beginner | 0.35 |
| Intermediate | 0.60 |
| Advanced | 0.85 |

### Parameters

| Parameter | Default | Allowed range | Notes |
| --- | --- | --- | --- |
| Trials | 20 | 2 – 1000 | Consecutive seeds, one per trial |
| Learners per trial | 100 | 1 – 10,000 | Generated independently for each trial |
| Practice activities | 10 | 0 – 500 | The Lab form requires at least 1 |
| Starting seed | 12345 | 0 – 4,294,967,295 | Trial *n* uses seed + *n* − 1 |
| Fixed difficulty | Intermediate | Beginner / Intermediate / Advanced | Used by the Fixed scenario |
| Learning rate | 0.02 | 0 – 1 | Ability gain per correct practice answer |
| Response slope | 6 | 0.001 – 100 | Steepness of the logistic curve |
| Initial ability mean | 0.55 | 0 – 1 | Mean of the starting ability distribution |
| Initial ability SD | 0.15 | 0 – 1 | Spread of the starting ability distribution |

> [!IMPORTANT]
> Every parameter is **assumed**, not estimated from student data. Results show what the model does under these assumptions, not what happens to real students.

## HEADLINE RESULTS

Official run: 20 trials × 100 learners × 10 practice activities, seeds 12345–12364. Values are trial means with 95% confidence intervals.

| Metric | Fixed (Intermediate) | Adaptive | Adaptive − Fixed |
| --- | --- | --- | --- |
| Baseline assessment (%) | 43.8 | 43.8 | 0.0 |
| Final assessment (%) | 55.5 [54.6–56.3] | 57.6 [56.8–58.5] | **2.2 [1.1–3.3]** |
| Gain from baseline (points) | 11.7 [10.5–12.8] | 13.8 [12.8–14.9] | 2.2 [1.1–3.3] |
| Learners advancing a level (%) | 45.0 [42.7–47.2] | 50.4 [48.5–52.3] | 5.5 [3.5–7.4] |

Adaptive finished ahead in **15 of 20** trials. The sensitivity analysis shows the advantage depends on the assumptions: it flips against Fixed *Beginner*, vanishes with a learning rate of 0, and grows with a steeper response slope.

> [!NOTE]
> Adaptive assigns easier practice, easier practice produces more correct answers, and the learning rule only rewards correct answers. Part of the adaptive advantage is therefore mechanical. The full discussion is in [`results/official/paper-results.md`](results/official/paper-results.md).

## TECH STACK

- **Frontend:** Vanilla JavaScript (ES modules), HTML, CSS, hand-built SVG charts
- **Simulation:** Pure JavaScript, shared between the browser, the CLI and the tests
- **Server:** Zero-dependency Node.js static server for local development
- **Testing:** Node's built-in test runner
- **Deployment:** GitHub Pages through GitHub Actions

## RUNNING LOCALLY

### Prerequisites

- Node.js 22.13 or later
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Aonnoes/Readoro.git
cd Readoro
```

Readoro has no dependencies, so `npm install` is optional.

### 2. Start the server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. It redirects to the Simulation Lab.

If the port is busy, run the following in PowerShell:

```powershell
$env:PORT=3001
npm run dev
```

Then open **http://localhost:3001**. On macOS or Linux, use `PORT=3001 npm run dev`. Stop the server with `Ctrl + C`.

## USING THE SIMULATION LAB

1. Set the parameters in the **Parameters** panel, or keep the defaults.
2. Click **Run simulation**. The paired trials and all sensitivity experiments run in your browser.
3. Read the results tables and graphs in **Results**.
4. Download files from **Exports**.

Repeating a run with the same settings and seed gives identical numbers.

| Export | Contents |
| --- | --- |
| `paper-results.md` | Configuration, results tables, analysis and limitations for the paper |
| `trials.csv` | One row per trial with every headline metric and its seed |
| `summary.csv` | Means and 95% confidence intervals for each metric |
| `sensitivity.csv` | Each sensitivity case with its paired difference and win count |
| `learner-records.csv` | One row per learner per scenario, for auditing |
| `experiment.json`, `sensitivity.json` | Full structured results |
| `figure-4-5.svg` to `figure-4-8.svg` | The four report figures |

## COMMAND LINE

Regenerate every file in `results/official/` from the engine:

```bash
npm run results
```

Override any setting with options:

```bash
npm run results -- --trials=30 --learners=200 --seed=7 --fixed=Beginner
```

| Option | Setting |
| --- | --- |
| `--trials` | Number of trials |
| `--learners` | Learners per trial |
| `--activities` | Practice activities per learner |
| `--seed` | Starting seed |
| `--fixed` | Fixed difficulty |
| `--learning-rate` | Learning rate |
| `--slope` | Response slope |
| `--ability-mean` | Initial ability mean |
| `--ability-sd` | Initial ability SD |

> [!IMPORTANT]
> `results/official/` backs the research paper. Only commit regenerated results made with the default settings.

## TESTING & VERIFICATION

```bash
npm test
npm run verify
```

`npm test` runs the whole suite. It covers:

- The logistic response model, including empirical frequencies of sampled responses
- Scoring and reading-level thresholds, including the unrounded-ratio edge cases
- A replay of every learner from its records, which checks each recorded probability, each learning update, each adaptive difficulty choice and each level change
- Confidence intervals, checked against hand-computed values and published t tables
- Experiment aggregation, paired differences, sensitivity cases and input validation
- CSV, Markdown and SVG output
- That the web page only uses relative paths, which GitHub Pages requires

`npm run verify` re-runs the default experiment in memory and fails if any file in `results/official/` no longer matches the engine. It guards against changing the model without regenerating the paper's numbers.

## DEPLOYMENT

Pushing to `main` triggers `.github/workflows/pages.yml`, which:

1. Runs `npm test` and `npm run verify`
2. Publishes `index.html`, `web/` and `simulation/` to GitHub Pages, only if both pass

To enable it on a fork, open **Settings → Pages** and set **Source** to **GitHub Actions**.

## PROJECT STRUCTURE

```
Readoro/
├── index.html                  # Redirects to the Simulation Lab
├── server.js                   # Local development server
├── web/                        # Simulation Lab UI
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── simulation/
│   ├── engine.js               # Virtual learners and paired trials
│   ├── experiment.js           # Multi-trial runner and sensitivity analysis
│   ├── stats.js                # Averages and confidence intervals
│   ├── reporting.js            # Single entry point for reporting
│   ├── reporting/              # CSV rows, Markdown report, SVG figures, file bundle
│   ├── lib/                    # RNG, response model, scoring, config, CSV
│   └── data/exercises.js       # Readora-shaped exercise metadata
├── scripts/
│   ├── run-experiments.mjs     # Regenerates results/official
│   └── verify-results.mjs      # Checks results/official is current
├── tests/                      # simulation and web tests
├── results/official/           # Official outputs for the paper
└── docs/project-concept.md     # Project concept and development checklist
```

## SCOPE & LIMITATIONS

Readoro uses **simulated learners and assumed learning parameters**. Its results describe simulated comprehension performance and progression, not verified improvements among real students.

- The practice materials are eight short fables across three levels. Only each question's skill and difficulty matter to the model, not the reading text.
- The learning rule is deliberately simple. There is no fatigue, forgetting, or learning from incorrect answers, and all four skills learn at the same rate.
- The response model has no guessing floor, so the chance of a correct answer can approach zero even for multiple-choice questions.
- Baseline and final assessments use the same eight questions with independent random responses. Short assessments add classification noise, so level advancement is not a measure of learning on its own.
- Fixed and Adaptive receive different practice difficulties, so their raw practice accuracies are not like-for-like measures.
- Confidence intervals describe variation across simulation trials, not the precision of any real-world effect.

## ACKNOWLEDGEMENTS

Readoro reuses the exercise structure and scoring rules of [Readora](https://github.com/zii4h/Readora). It does not include Readora's application code. The simulation was developed in three parts: the engine, the application and interface, and testing and results.

## LICENSE

See [MIT License](LICENSE) © 2026
