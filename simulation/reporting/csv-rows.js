// Flat rows for CSV export. One function per file, named after the file it feeds.
import { toCSV } from '../lib/csv.js';

export const toCsv = rows => (rows.length ? toCSV(rows, Object.keys(rows[0])) : '');

export const trialCsvRows = ({ trialResults }) => trialResults.map(({ trial, seed, fixed, adaptive }) => ({
  trial, seed,
  baselinePercent: fixed.baseline,
  fixedFinalPercent: fixed.final,
  adaptiveFinalPercent: adaptive.final,
  finalDifferencePoints: adaptive.final - fixed.final,
  fixedGainPoints: fixed.gain,
  adaptiveGainPoints: adaptive.gain,
  fixedPracticePercent: fixed.practice,
  adaptivePracticePercent: adaptive.practice,
  fixedAbilityChange: fixed.ability,
  adaptiveAbilityChange: adaptive.ability,
  fixedLevelAdvancedPercent: fixed.advancement,
  adaptiveLevelAdvancedPercent: adaptive.advancement,
}));

export const summaryCsvRows = ({ summary }) => Object.entries(summary.comparison).map(([metric, row]) => ({
  metric,
  fixedMean: row.fixed?.mean ?? null,
  fixedCI95Low: row.fixed?.low ?? null,
  fixedCI95High: row.fixed?.high ?? null,
  adaptiveMean: row.adaptive?.mean ?? null,
  adaptiveCI95Low: row.adaptive?.low ?? null,
  adaptiveCI95High: row.adaptive?.high ?? null,
  differenceMean: row.difference?.mean ?? null,
  differenceCI95Low: row.difference?.low ?? null,
  differenceCI95High: row.difference?.high ?? null,
}));

export const sensitivityCsvRows = sensitivity => [sensitivity.base, ...sensitivity.cases].map(row => ({
  case: row.name,
  parameterOverrides: JSON.stringify(row.overrides),
  fixedFinalPercent: row.fixed.mean,
  adaptiveFinalPercent: row.adaptive.mean,
  differencePoints: row.difference.mean,
  differenceCI95Low: row.difference.low,
  differenceCI95High: row.difference.high,
  adaptiveWins: row.adaptiveWins,
  trials: row.trials,
}));
