import { syncArchiveAssets } from './archive-assets.mjs';
import { generateMissingCovers } from './pdf-covers.mjs';

const sourceRoot = new URL('../../archive/', import.meta.url);
const destinationRoot = new URL('../public/archive/', import.meta.url);

const covers = await generateMissingCovers(sourceRoot);
await syncArchiveAssets(sourceRoot, destinationRoot);
console.log(`Archive PDFs and covers synchronized (${covers.filter((cover) => cover.status === 'generated').length} covers generated).`);
