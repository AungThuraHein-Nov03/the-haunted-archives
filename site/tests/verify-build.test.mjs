import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { verifyBuild } from '../scripts/verify-build.mjs';

test('verifyBuild reports a missing required route', async () => {
  const root = await mkdtemp(join(tmpdir(), 'haunted-build-'));
  await assert.rejects(verifyBuild(pathToFileURL(`${root}/`)), /Missing output: index.html/);
});

test('verifyBuild rejects links that bypass the Pages base path', async () => {
  const root = await mkdtemp(join(tmpdir(), 'haunted-build-'));
  const required = [
    'methodology/index.html',
    'about/index.html',
    'documents/the-architecture-of-silence/index.html',
    'documents/the-house-that-named-its-ghosts/index.html',
  ];

  await mkdir(join(root, 'archive', 'covers'), { recursive: true });
  await mkdir(join(root, 'archive', 'documents'), { recursive: true });

  for (const file of required) {
    await mkdir(join(root, file, '..'), { recursive: true });
    await writeFile(join(root, file), '<link rel="canonical" href="https://example.test/page">');
  }

  await writeFile(
    join(root, 'index.html'),
    '<a href="/about/">Broken</a><link rel="canonical" href="https://example.test/">',
  );
  await writeFile(join(root, '404.html'), '<link rel="canonical" href="https://example.test/404">');
  await writeFile(join(root, 'archive', 'covers', 'the-architecture-of-silence.png'), 'cover');
  await writeFile(join(root, 'archive', 'covers', 'the-house-that-named-its-ghosts.png'), 'cover');
  await writeFile(join(root, 'archive', 'documents', 'the-architecture-of-silence.pdf'), 'pdf');
  await writeFile(join(root, 'archive', 'documents', 'the-house-that-named-its-ghosts.pdf'), 'pdf');
  await writeFile(join(root, 'sitemap-index.xml'), '<sitemapindex />');

  await assert.rejects(verifyBuild(pathToFileURL(`${root}/`)), /Unsafe root-relative link/);
});

test('verifyBuild requires the Sweet Springs route and archive assets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'haunted-build-'));
  const htmlFiles = [
    'methodology/index.html',
    'about/index.html',
    'documents/the-architecture-of-silence/index.html',
    'documents/the-house-that-named-its-ghosts/index.html',
  ];

  await mkdir(join(root, 'archive', 'covers'), { recursive: true });
  await mkdir(join(root, 'archive', 'documents'), { recursive: true });

  for (const file of htmlFiles) {
    await mkdir(join(root, file, '..'), { recursive: true });
    await writeFile(join(root, file), `<link rel='canonical' href='https://example.test/page'>`);
  }

  await writeFile(join(root, 'index.html'), `<link rel='canonical' href='https://example.test/'>`);
  await writeFile(join(root, '404.html'), `<link rel='canonical' href='https://example.test/404'>`);
  await writeFile(join(root, 'archive', 'covers', 'the-architecture-of-silence.png'), 'cover');
  await writeFile(join(root, 'archive', 'covers', 'the-house-that-named-its-ghosts.png'), 'cover');
  await writeFile(join(root, 'archive', 'documents', 'the-architecture-of-silence.pdf'), 'pdf');
  await writeFile(join(root, 'archive', 'documents', 'the-house-that-named-its-ghosts.pdf'), 'pdf');
  await writeFile(join(root, 'sitemap-index.xml'), '<sitemapindex />');

  await assert.rejects(verifyBuild(pathToFileURL(`${root}/`)), (error) => {
    assert.match(
      error.message,
      /Missing output: documents\/sweet-springs-the-name-that-remained\/index\.html/,
    );
    assert.match(
      error.message,
      /Missing output: archive\/covers\/sweet-springs-the-name-that-remained\.png/,
    );
    assert.match(
      error.message,
      /Missing output: archive\/documents\/sweet-springs-the-name-that-remained\.pdf/,
    );
    return true;
  });
});
