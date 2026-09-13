import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { build } from 'astro';

async function buildFixture() {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'haunted-advisory-'));
  const outputPath = join(temporaryRoot, 'dist');
  const cachePath = join(temporaryRoot, 'cache');

  await build({
    root: new URL('./fixtures/content-advisory/', import.meta.url),
    outDir: outputPath,
    cacheDir: cachePath,
    logLevel: 'silent',
  });

  return { temporaryRoot, outputPath };
}

test('ContentAdvisory renders configured advisory text', async () => {
  const { temporaryRoot, outputPath } = await buildFixture();

  try {
    const html = await readFile(join(outputPath, 'index.html'), 'utf8');

    assert.match(html, /class=["']content-advisory["']/);
    assert.match(html, /Content Advisory/);
    assert.match(html, /Sensitive historical material\./);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test('ContentAdvisory emits no markup when no advisory is configured', async () => {
  const { temporaryRoot, outputPath } = await buildFixture();

  try {
    const html = await readFile(join(outputPath, 'absent', 'index.html'), 'utf8');

    assert.doesNotMatch(html, /content-advisory/);
    assert.doesNotMatch(html, /Content Advisory/);
    assert.match(html, /Normal document content\./);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test('document page places advisory between the header and document body without changing normal-page spacing', async () => {
  const pageSource = await readFile(
    new URL('../src/pages/documents/[slug].astro', import.meta.url),
    'utf8',
  );
  const stylesheet = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');

  const headerIndex = pageSource.indexOf('<header class="document-detail__header">');
  const advisoryIndex = pageSource.indexOf('<ContentAdvisory text={document.data.contentAdvisory} />');
  const bodyIndex = pageSource.indexOf('<div class="document-detail__body prose">');

  assert.ok(headerIndex >= 0, 'document header should exist');
  assert.ok(advisoryIndex > headerIndex, 'advisory should render after the document header');
  assert.ok(bodyIndex > advisoryIndex, 'advisory should render before the document body');
  assert.match(pageSource, /document\.data\.contentAdvisory\s*&&/);
  assert.match(stylesheet, /\.content-advisory\s*\+\s*\.document-detail__body\s*\{/);
});
