# Readoro - Reading Comprehension Simulation

**Course:** Modeling and Simulation (IMODSIM)

**Research Title:** Reading Comprehension Performance Under Fixed and Adaptive Difficulty: A Simulation Study

## Project Overview

Readoro is a research-focused extension of Readora, a gamified reading comprehension system. It aims to model and simulate learner performance and progression across four comprehension skills using Monte Carlo simulation.

The project reuses Readora's existing reading exercises, quizzes, scoring system, and progress tracking while introducing a simulation model for evaluating learner performance under different difficulty approaches.

## Simulation Focus

The study compares two approaches:

- **Fixed Difficulty:** Learners complete reading exercises at a predetermined difficulty level.
- **Adaptive Difficulty:** Reading difficulty adjusts according to simulated learner performance.

The model simulates learner abilities, quiz responses, comprehension scores, skill development, and reading level progression.

**Comprehension Skills:** Literal Understanding, Vocabulary in Context, Main Idea, and Inference.

**Reading Levels:** Beginner (0–49%), Intermediate (50–74%), and Advanced (75–100%).

Both scenarios use equivalent initial learner profiles and evaluation conditions to support a controlled comparison.

## Working Model Requirements

- Virtual learner generation and Monte Carlo simulation
- Fixed and adaptive difficulty scenarios
- Four comprehension skill tracking
- Baseline assessment, learner improvement, and level progression
- Interactive simulation controls
- Dynamic results tables and comparison graphs
- Repeated trials, verification, and sensitivity analysis
- CSV export of simulation results

## Development Checklist

### 1. Project Setup - All Developers

- [ ] Set up Readoro using the existing Readora codebase and verify reusable features.
- [ ] Organize project files, development branches, and responsibilities.

### 2. Simulation Engine - Member 8

- [ ] Implement virtual learners, baseline assessments, and four-skill ability profiles.
- [ ] Implement Monte Carlo responses, scoring, and documented learning-update rules.
- [ ] Implement fixed/adaptive difficulty, reading level progression, and reproducible simulation runs.

### 3. Application and Interface - Member 9

- [ ] Integrate the simulation engine into Readoro and create the Simulation Lab.
- [ ] Implement interactive parameters, simulation controls, and learner progression displays.
- [ ] Build functional results tables and comparison graphs using calculated data.

### 4. Testing and Results - Member 10

- [x] Develop verification tests for response probabilities, scoring, difficulty adjustments, and progression.
- [x] Run repeated simulation trials, baseline/final comparisons, and sensitivity analysis.
- [x] Generate comparison metrics, learner records, and downloadable CSV results.

### 5. Finalization - All Developers

- [ ] Verify that calculations, assumptions, and results match the research methodology.
- [ ] Test the complete application, fix issues, and deploy the working model.
- [ ] Document the simulation process and provide actual results for the research paper.

## Expected Outputs

| Output | Description |
|---|---|
| Learner Records | Simulated learner abilities, comprehension skills, and reading levels |
| Simulation Attempts | Quiz responses, scores, assigned difficulty, and progression |
| Scenario Comparison | Fixed vs. adaptive performance, improvement, and progression |
| Graphs | Visual comparisons of learner performance |
| CSV Export | Downloadable simulation results for research analysis |

## Project Status

**Current Stage:** Initial setup and development planning.

The simulation engine, application integration, testing, and deployment are pending.

## Research Limitations

Readoro uses simulated learners and assumed learning parameters. Its results represent simulated comprehension performance and progression, not verified improvements among real students.