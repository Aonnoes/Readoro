// GitHub Pages serves the site from /<repo-name>/, so one stray leading slash means a blank page in production.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const read = path => readFile(resolve(path), 'utf8');

test('web files only use relative paths', async () => {
  const html = await read('web/index.html');
  const app = await read('web/app.js');
  const css = await read('web/styles.css');
  assert.equal(/(?:href|src)="\/(?!\/)/.test(html), false, 'root-absolute href/src in index.html');
  assert.equal(/from\s+'\/(?!\/)/.test(app), false, 'root-absolute import in app.js');
  assert.equal(/url\(\s*['"]?\/(?!\/)/.test(css), false, 'root-absolute url() in styles.css');
});

test('every file the page loads actually exists', async () => {
  const html = await read('web/index.html');
  const app = await read('web/app.js');
  const refs = [
    ...[...html.matchAll(/(?:href|src)="((?!https?:|#|\/\/)[^"]+)"/g)].map(m => resolve('web', m[1])),
    ...[...app.matchAll(/from\s+'(\.[^']+)'/g)].map(m => resolve('web', m[1])),
  ];
  assert.ok(refs.length >= 4);
  for (const file of refs) assert.ok(existsSync(file), `missing ${file}`);
});

test('the repo root hands visitors to the Simulation Lab and Pages skips Jekyll', async () => {
  assert.ok((await read('index.html')).includes('url=web/index.html'));
  assert.ok(existsSync(resolve('.nojekyll')));
});
