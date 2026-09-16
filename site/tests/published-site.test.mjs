import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';

import { build } from 'astro';

const advisory =
  'This entry contains sensitive historical material, including discussion of suicide and death. Reader discretion is advised.';

let temporaryRoot;
let outputPath;

before(async () => {
  const temporaryParent = fileURLToPath(new URL('../node_modules/', import.meta.url));
  temporaryRoot = await mkdtemp(join(temporaryParent, '.haunted-published-site-'));
  outputPath = join(temporaryRoot, 'dist');

  await build({
    root: new URL('../', import.meta.url),
    outDir: outputPath,
    cacheDir: join(temporaryRoot, 'cache'),
    logLevel: 'silent',
  });
});

after(async () => {
  await rm(temporaryRoot, { recursive: true, force: true });
});

async function readBuiltFile(...segments) {
  let html;
  await assert.doesNotReject(async () => {
    html = await readFile(join(outputPath, ...segments), 'utf8');
  }, `expected built output: ${segments.join('/')}`);
  return html;
}

test('publishes Aokigahara with its advisory and base-path archive links', async () => {
  const html = await readBuiltFile(
    'documents',
    'aokigahara-the-forest-beneath-the-reputation',
    'index.html',
  );

  assert.match(html, /class=["']content-advisory["']/);
  assert.ok(html.includes(advisory));
  assert.match(
    html,
    /src=["']\/the-haunted-archives\/archive\/covers\/aokigahara-the-forest-beneath-the-reputation\.png["']/,
  );
  assert.match(
    html,
    /href=["']\/the-haunted-archives\/archive\/documents\/aokigahara-the-forest-beneath-the-reputation\.pdf["']/,
  );
});

test('keeps entries without advisories free of advisory markup and spacing', async () => {
  const legacyDocumentIds = [
    'the-architecture-of-silence',
    'the-house-that-named-its-ghosts',
    'sweet-springs-the-name-that-remained',
  ];

  for (const documentId of legacyDocumentIds) {
    const html = await readBuiltFile('documents', documentId, 'index.html');

    assert.doesNotMatch(html, /class=["']content-advisory["']/);
    assert.doesNotMatch(html, /Content Advisory/);
    assert.match(html, /class=["']document-detail__body prose["']/);
  }
});

test('renders collection copy and navigation with the GitHub Pages base path', async () => {
  const html = await readBuiltFile('index.html');

  assert.match(html, /Four investigations presented as records for close reading\./);
  assert.ok(html.includes('Aokigahara: The Forest Beneath the Reputation'));
  assert.match(
    html,
    /href=["']\/the-haunted-archives\/documents\/aokigahara-the-forest-beneath-the-reputation\/["']/,
  );
  assert.match(html, /href=["']\/the-haunted-archives\/about\/["']/);
  assert.match(
    html,
    /href=["']https:\/\/github\.com\/AungThuraHein-Nov03\/the-haunted-archives["']/,
  );
  assert.doesNotMatch(html, /href=["']\/about\/["']/);
});
