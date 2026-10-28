import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { createCoverPreview } from '../scripts/preview-cover.mjs';

const runExecutable = promisify(execFile);
const existingCover = new URL('../../archive/covers/aokigahara-the-forest-beneath-the-reputation.png', import.meta.url);
const signature = Buffer.from('89504e470d0a1a0a', 'hex');

test('preview helper renders page 1 into fresh temporary files without altering published covers', async (t) => {
  const outputRoot = await mkdtemp(join(tmpdir(), 'haunted-preview-test-'));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  const existing = await readFile(existingCover);

  const first = await createCoverPreview(undefined, { outputRoot });
  const second = await createCoverPreview(undefined, { outputRoot });

  assert.notEqual(first.coverPath, second.coverPath, 'each preview has a separate output path');
  const image = await readFile(first.coverPath);
  assert.deepEqual(image.subarray(0, 8), signature);
  assert.ok(first.width > 100);
  assert.ok(first.height > 100);
  assert.ok(second.bytes > 100);
  assert.deepEqual(await readFile(existingCover), existing);
});

test('preview CLI runs and prints a usable PNG path', async (t) => {
  const cli = fileURLToPath(new URL('../scripts/preview-cover.mjs', import.meta.url));
  const { stdout } = await runExecutable(process.execPath, [cli]);
  assert.match(stdout, /SUCCESS: PDF page 1 rendered into a PNG preview/);
  const match = stdout.match(/^PNG: (.+\.png)$/m);
  assert.ok(match, 'prints the preview PNG location');
  const file = match[1].trim();
  t.after(() => rm(dirname(file), { recursive: true, force: true }));
  const png = await readFile(file);
  assert.deepEqual(png.subarray(0, 8), signature);
});
