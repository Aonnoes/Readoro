import { performance } from 'node:perf_hooks';
import { runTrial } from './simulation/engine.js';

const testCases = [
  { learners: 100, activitiesPerLearner: 10 },
  { learners: 250, activitiesPerLearner: 20 },
  { learners: 500, activitiesPerLearner: 20 },
];

const seed = 12345;

function benchmark(settings) {
  const start = performance.now();

  runTrial({
    ...settings,
    seed,
  });

  return (performance.now() - start).toFixed(2);
}

// Warm up the engine first.
runTrial({
  learners: 20,
  activitiesPerLearner: 2,
  seed,
});

for (const settings of testCases) {
  const times = [];

  // Repeat each test three times.
  for (let i = 0; i < 3; i++) {
    times.push(Number(benchmark(settings)));
  }

  const average =
    times.reduce((sum, time) => sum + time, 0) / times.length;

  console.log(
    `${settings.learners} learners, ` +
    `${settings.activitiesPerLearner} activities: ` +
    `${average.toFixed(2)} ms average`
  );
}
