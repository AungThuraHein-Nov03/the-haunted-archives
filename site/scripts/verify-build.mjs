import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const htmlFiles = [
  'index.html',
  'methodology/index.html',
  'about/index.html',
  '404.html',
  'documents/the-architecture-of-silence/index.html',
  'documents/the-house-that-named-its-ghosts/index.html',
];

const requiredFiles = [
  ...htmlFiles,
  'archive/covers/the-architecture-of-silence.png',
  'archive/covers/the-house-that-named-its-ghosts.png',
  'archive/documents/the-architecture-of-silence.pdf',
  'archive/documents/the-house-that-named-its-ghosts.pdf',
  'sitemap-index.xml',
];

export async function verifyBuild(outputRoot) {
  const errors = [];

  for (const relativePath of requiredFiles) {
    try {
      await access(new URL(relativePath, outputRoot));
    } catch {
      errors.push(`Missing output: ${relativePath}`);
    }
  }

  for (const relativePath of htmlFiles) {
    let html;
    try {
      html = await readFile(new URL(relativePath, outputRoot), 'utf8');
    } catch {
      continue;
    }

    if (!/<link[^>]+rel=[\x22']canonical[\x22'][^>]*>/i.test(html)) {
      errors.push(`Missing canonical link: ${relativePath}`);
    }

    const unsafe = html.match(/(?:href|src)=[\x22']\/(?!the-haunted-archives\/)[^\x22']*/i);
    if (unsafe) {
      errors.push(`Unsafe root-relative link in ${relativePath}: ${unsafe[0]}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) {
  await verifyBuild(new URL('../dist/', import.meta.url));
  console.log('Production build verified.');
}
