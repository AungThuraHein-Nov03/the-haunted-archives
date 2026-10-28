import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { generateCoverFromPdf } from './pdf-covers.mjs';

const defaultPdf = fileURLToPath(
  new URL('../../archive/documents/aokigahara-the-forest-beneath-the-reputation.pdf', import.meta.url),
);
const defaultPreviewRoot = fileURLToPath(new URL('../../tmp/cover-previews/', import.meta.url));
const pngSignature = Buffer.from('89504e470d0a1a0a', 'hex');

/**
 * Renders a cover into a fresh, disposable directory, never into archive/covers.
 * Returns information useful for checking the output visually in VS Code.
 */
export async function createCoverPreview(pdfPath = defaultPdf, { outputRoot = defaultPreviewRoot } = {}) {
  await mkdir(outputRoot, { recursive: true });
  const previewDirectory = await mkdtemp(join(outputRoot, 'preview-'));
  const coverPath = join(previewDirectory, 'cover.png');

  try {
    await generateCoverFromPdf(pdfPath, coverPath);
    const png = await readFile(coverPath);
    if (
      png.length < 24 ||
      !png.subarray(0, 8).equals(pngSignature) ||
      png.readUInt32BE(16) === 0 ||
      png.readUInt32BE(20) === 0
    ) {
      throw new Error('The renderer did not create a valid PNG preview');
    }

    return {
      pdfPath,
      coverPath,
      width: png.readUInt32BE(16),
      height: png.readUInt32BE(20),
      bytes: png.length,
    };
  } catch (error) {
    await rm(previewDirectory, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.length > 3) {
    console.error('Usage: npm run preview:cover --prefix site -- [path-to-PDF]');
    process.exitCode = 1;
  } else {
    const pdfPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : defaultPdf;
    try {
      const preview = await createCoverPreview(pdfPath);
      console.log('SUCCESS: PDF page 1 rendered into a PNG preview.');
      console.log(`PDF: ${preview.pdfPath}`);
      console.log(`PNG: ${preview.coverPath}`);
      console.log(`Dimensions: ${preview.width} x ${preview.height} pixels`);
      console.log('Open the PNG in VS Code or File Explorer to inspect it.');
      console.log('No published covers or site files were changed.');
    } catch (error) {
      console.error(`Cover preview failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
