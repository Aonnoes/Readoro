import test from 'node:test';
import assert from 'node:assert/strict';
import { toCSV } from '../../simulation/lib/csv.js';
import { toCsv } from '../../simulation/reporting.js';

test('plain rows become a header plus lines, newline-terminated', () => {
  assert.equal(toCsv([{ a: 1, b: 'x' }, { a: 2, b: 'y' }]), 'a,b\n1,x\n2,y\n');
});

test('commas, quotes and newlines get wrapped and escaped', () => {
  assert.equal(toCsv([{ name: 'A,"B"', note: 'one\ntwo' }]), 'name,note\n"A,""B""","one\ntwo"\n');
});

test('null and undefined become empty cells, zero and false survive', () => {
  assert.equal(toCsv([{ a: null, b: undefined, c: 0, d: false }]), 'a,b,c,d\n,,0,false\n');
});

test('column order follows the first row', () => {
  assert.equal(toCsv([{ z: 1, a: 2 }]).split('\n')[0], 'z,a');
});

test('no rows means an empty file, not a stray header', () => {
  assert.equal(toCsv([]), '');
});

test('the shared serializer accepts custom column headers', () => {
  assert.equal(toCSV([{ id: 7 }], [{ key: 'id', header: 'Learner' }]), 'Learner\n7\n');
});
