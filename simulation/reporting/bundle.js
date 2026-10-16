// Every file a finished experiment produces, keyed by filename.
// The CLI writes them, the tests compare them, nobody maintains the list twice.
import { toCsv, trialCsvRows, summaryCsvRows, sensitivityCsvRows } from './csv-rows.js';
import { paperReport } from './markdown.js';
import { buildFigures } from './figures.js';

const toJson = value => JSON.stringify(value, null, 2) + '\n';

export function resultFiles(exp, sensitivity) {
  if (!exp.learners) throw new Error('resultFiles needs an experiment run with { includeLearners: true }');
  const { config, trialResults, summary } = exp;
  return {
    'experiment.json': toJson({ config, trialResults, summary }),
    'sensitivity.json': toJson(sensitivity),
    'summary.csv': toCsv(summaryCsvRows(exp)),
    'trials.csv': toCsv(trialCsvRows(exp)),
    'sensitivity.csv': toCsv(sensitivityCsvRows(sensitivity)),
    'learner-records.csv': toCsv(exp.learners),
    'paper-results.md': paperReport(exp, sensitivity),
    ...buildFigures(exp, sensitivity),
  };
}
