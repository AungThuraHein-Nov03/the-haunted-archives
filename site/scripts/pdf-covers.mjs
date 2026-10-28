import { spawn } from 'node:child_process';
import { access, mkdir, readdir, rename, rm, stat } from 'node:fs/promises';
import { dirname, extname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

function asPath(value) {
  return value instanceof URL ? fileURLToPath(value) : value;
}

export async function generateCoverFromPdf(pdf, cover, { renderer = 'pdftoppm', force = false } = {}) {
  const pdfPath = asPath(pdf);
  const coverPath = asPath(cover);
  if (extname(pdfPath).toLowerCase() !== '.pdf' || extname(coverPath).toLowerCase() !== '.png') {
    throw new Error('Cover generation requires a PDF input and PNG output');
  }
  await access(pdfPath);
  if (!force) {
    try { await access(coverPath); return { status: 'existing', path: coverPath }; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }

  await mkdir(dirname(coverPath), { recursive: true });
  const tempStem = join(dirname(coverPath), `.cover-${randomUUID()}`);
  const tempPng = `${tempStem}.png`;
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(renderer, [
        '-f', '1', '-l', '1', '-singlefile', '-png', '-r', '144',
        pdfPath, tempStem,
      ], { shell: false, windowsHide: true });
      let stderr = '';
      child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-2048); });
      child.on('error', (error) => reject(error.code === 'ENOENT'
        ? new Error('pdftoppm not found. Install Poppler and add its bin folder to PATH.')
        : error));
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`PDF cover rendering failed (exit ${code}): ${stderr.trim()}`));
      });
    });
    const info = await stat(tempPng);
    if (!info.size) throw new Error('PDF renderer produced an empty cover');
    // Never overwrite a cover unless the caller explicitly requested regeneration.
    if (!force) {
      try { await access(coverPath); return { status: 'existing', path: coverPath }; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    await rename(tempPng, coverPath);
    return { status: 'generated', path: coverPath };
  } finally {
    await rm(tempPng, { force: true });
  }
}

export async function generateMissingCovers(archiveRoot, options = {}) {
  const root = asPath(archiveRoot);
  const documentsDir = join(root, 'documents');
  const coversDir = join(root, 'covers');
  const documents = await readdir(documentsDir, { withFileTypes: true });
  const results = [];
  for (const entry of documents.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || !entry.name.endsWith('.pdf')) continue;
    const stem = parse(entry.name).name;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(stem)) {
      throw new Error(`Invalid PDF filename "${entry.name}": use lowercase letters, digits and hyphens`);
    }
    results.push(await generateCoverFromPdf(
      join(documentsDir, entry.name), join(coversDir, `${stem}.png`), options,
    ));
  }
  return results;
}
