import { runExperiment, runSensitivity } from '/simulation/experiment.js';

self.onmessage = event => {
  try {
    const { config } = event.data;

    const exp = runExperiment(config, {
      includeLearners: true,
    });

    const sens = runSensitivity(config);

    self.postMessage({
      exp,
      sens,
    });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error
        ? error.message
        : String(error),
    });
  }
};
