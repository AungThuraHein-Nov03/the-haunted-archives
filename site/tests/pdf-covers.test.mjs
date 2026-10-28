import assert from 'node:assert/strict';
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { generateCoverFromPdf, generateMissingCovers } from '../scripts/pdf-covers.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'haunted-covers-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'documents'));
  await mkdir(join(root, 'covers'));
  await writeFile(join(root, 'documents', 'a-case.pdf'), 'placeholder');
  return root;
}

test('existing cover is preserved without invoking the renderer', async (t) => {
  const root = await fixture(t);
  const cover = join(root, 'covers', 'a-case.png');
  await writeFile(cover, 'original');
  const result = await generateCoverFromPdf(join(root, 'documents', 'a-case.pdf'), cover, { renderer: 'missing-renderer-xyz' });
  assert.equal(result.status, 'existing');
  assert.equal(await readFile(cover, 'utf8'), 'original');
});

test('invalid file extensions are rejected', async (t) => {
  const root = await fixture(t);
  await assert.rejects(
    generateCoverFromPdf(join(root, 'documents', 'a-case.pdf'), join(root, 'covers', 'a-case.jpg')),
    /PDF input and PNG output/,
  );
});

test('missing renderer produces an actionable error without leaving a cover', async (t) => {
  const root = await fixture(t);
  const cover = join(root, 'covers', 'a-case.png');
  await assert.rejects(
    generateCoverFromPdf(join(root, 'documents', 'a-case.pdf'), cover, { renderer: 'missing-renderer-xyz' }),
    /pdftoppm not found/,
  );
  await assert.rejects(readFile(cover), /ENOENT/);
});

test('renders the first page of a real archive PDF to a valid PNG, preserving an existing cover', async (t) => {
  const root = await fixture(t);
  const sourcePdf = new URL('../../archive/documents/aokigahara-the-forest-beneath-the-reputation.pdf', import.meta.url);
  await copyFile(sourcePdf, join(root, 'documents', 'a-case.pdf'));
  const oldCover = join(root, 'covers', 'b-case.png');
  await writeFile(oldCover, 'original');
  await copyFile(sourcePdf, join(root, 'documents', 'b-case.pdf'));

  const results = await generateMissingCovers(root);
  assert.deepEqual(results.map(({ status }) => status), ['generated', 'existing']);

  const png = await readFile(join(root, 'covers', 'a-case.png'));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.ok(png.readUInt32BE(16) > 100, 'rendered PNG has a valid width');
  assert.ok(png.readUInt32BE(20) > 100, 'rendered PNG has a valid height');
  assert.equal(await readFile(oldCover, 'utf8'), 'original');
});

test('matching names are required and existing covers are untouched', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, 'covers', 'a-case.png'), 'original');
  const results = await generateMissingCovers(root, { renderer: 'missing-renderer-xyz' });
  assert.deepEqual(results.map((result) => result.status), ['existing']);
  await writeFile(join(root, 'documents', 'Bad Name.pdf'), 'placeholder');
  await assert.rejects(generateMissingCovers(root), /Invalid PDF filename/);
  assert.equal(await readFile(join(root, 'covers', 'a-case.png'), 'utf8'), 'original');
});
