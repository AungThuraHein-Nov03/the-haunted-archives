import { syncArchiveAssets } from './archive-assets.mjs';

const sourceRoot = new URL('../../archive/', import.meta.url);
const destinationRoot = new URL('../public/archive/', import.meta.url);

await syncArchiveAssets(sourceRoot, destinationRoot);
console.log('Archive PDFs and covers synchronized.');
