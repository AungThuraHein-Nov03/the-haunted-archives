import { cp, mkdir, readdir, rm } from 'node:fs/promises';

async function filesWithExtension(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(extension));
}

export async function validateArchiveAssets(sourceRoot) {
  const covers = await filesWithExtension(new URL('covers/', sourceRoot), '.png');
  const documents = await filesWithExtension(new URL('documents/', sourceRoot), '.pdf');
  if (covers.length === 0) throw new Error('Archive must contain at least one PNG cover');
  if (documents.length === 0) throw new Error('Archive must contain at least one PDF');
}

export async function syncArchiveAssets(sourceRoot, destinationRoot) {
  await validateArchiveAssets(sourceRoot);
  await rm(destinationRoot, { recursive: true, force: true });
  await mkdir(destinationRoot, { recursive: true });
  await cp(sourceRoot, destinationRoot, { recursive: true });
}

