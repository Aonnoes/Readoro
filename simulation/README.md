# Readoro Simulation Core

Shared primitives for the Readoro Monte Carlo simulation. Imported by the
simulation engine, the Simulation Lab UI, and the test suite. No React, no
database, no dependency on Readora's runtime -- just pure ESM JavaScript.

## Layout

| File | Purpose |
|---|---|
| `lib/rng.js` | Seeded mulberry32 RNG + uniform/normal helpers |
| `lib/scoring.js` | Pure functions mirroring Readora's scoring rules |
| `lib/ability.js` | Logistic response-probability model |
| `lib/config.js` | Skills, thresholds, difficulties, default config |
| `lib/csv.js` | RFC 4180 CSV serializer |
| `data/exercises.js` | Readora-shaped exercise data for the engine |

## Readora compatibility

The exercise objects in `data/exercises.js` mirror the shape used by
`server/sourced-content.js` in the Readora codebase:

    { id, title, level, category, description, minutes, source,
      published, baseline, sections: [{ id, title, questions: [...] }] }

The `text` field on sections and `prompt` / `options` / `explanation` on
questions are intentionally omitted -- the simulation only needs `skill`
and `correctIndex` to sample responses. When Readora is forked into
Readoro, this data file can be replaced with a build-time transform
without changing the engine.

Scoring in `lib/scoring.js` mirrors `calculateStats()` in
`server/api.js`, including the use of the unrounded ratio for
reading-level thresholds.

## Model assumptions

- Response model: P(correct) = 1 / (1 + exp(-slope * (ability - difficulty)))
- Difficulty values: Beginner 0.35, Intermediate 0.60, Advanced 0.85
- Initial ability: normal, mean 0.55, sd 0.15
- Learning rate: 0.02 per correct answer in the practiced skill

These are assumed parameters. Sensitivity analysis should vary `slope`,
the difficulty values, and the learning rate.

## Running tests

    npm test
