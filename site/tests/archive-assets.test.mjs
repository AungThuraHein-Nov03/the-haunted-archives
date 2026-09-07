import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import {
  syncArchiveAssets,
  validateArchiveAssets,
} from '../scripts/archive-assets.mjs';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'haunted-archive-'));
  const source = join(root, 'archive');
  const destination = join(root, 'public', 'archive');
  await mkdir(join(source, 'covers'), { recursive: true });
  await mkdir(join(source, 'documents'), { recursive: true });
  await writeFile(join(source, 'covers', 'case.png'), 'cover');
  await writeFile(join(source, 'documents', 'case.pdf'), 'document');
  return {
    source: pathToFileURL(`${source}/`),
    destination: pathToFileURL(`${destination}/`),
    destinationPath: destination,
  };
}

test('syncArchiveAssets copies covers and documents', async () => {
  const { source, destination, destinationPath } = await fixture();
  await syncArchiveAssets(source, destination);
  assert.equal(await readFile(join(destinationPath, 'covers', 'case.png'), 'utf8'), 'cover');
  assert.equal(await readFile(join(destinationPath, 'documents', 'case.pdf'), 'utf8'), 'document');
});

test('validateArchiveAssets rejects an archive without PDFs', async () => {
  const { source } = await fixture();
  const sourcePath = new URL('.', source);
  const emptySource = new URL('../empty-archive/', sourcePath);
  await mkdir(new URL('covers/', emptySource), { recursive: true });
  await mkdir(new URL('documents/', emptySource), { recursive: true });
  await writeFile(new URL('covers/case.png', emptySource), 'cover');
  await assert.rejects(validateArchiveAssets(emptySource), /at least one PDF/);
});
