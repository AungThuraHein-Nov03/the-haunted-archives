# The Haunted Archives Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, accessible Astro website that presents The Haunted Archives documents with a Nocturne Library visual direction and reliable PDF reading and download paths.

**Architecture:** Astro 7 generates the archive homepage, informational pages, and one detail route per validated Markdown content record. A deterministic Node script copies canonical PDFs and covers from the repository-level `archive/` directory into Astro's ignored `site/public/archive/` build input; GitHub Pages deployment remains manual until the owner explicitly approves it.

**Tech Stack:** Node.js 22, npm 10, Astro 7.3.1, TypeScript 7.0.2, `@astrojs/check` 0.9.10, `@astrojs/sitemap` 3.7.4, Node's built-in test runner, HTML/CSS, GitHub Pages Actions

**Spec:** `docs/superpowers/specs/2026-09-07-haunted-archives-website-design.md`

## Global Constraints

- Present a plan and receive owner approval before each implementation phase.
- Do not push, deploy, enable GitHub Pages, or change repository settings without explicit owner approval.
- Keep canonical PDFs in `archive/documents/` and covers in `archive/covers/`.
- Keep all Astro source and package files under `site/`.
- Generate a fully static site with no runtime server, API, database, authentication, tracking, or external CMS.
- Use only verified repository or owner-supplied facts; omit unknown metadata.
- Treat paranormal interpretations as claims rather than established conclusions.
- Use lowercase, hyphenated public asset names and stable `/archive/covers/` and `/archive/documents/` URLs.
- Use the Nocturne Library visual direction with restrained archival details and no theatrical horror styling.
- Meet WCAG 2.2 AA contrast targets, support keyboard navigation, and respect `prefers-reduced-motion`.
- Preserve direct PDF access when embedded viewing is unsupported.
- Commit `site/package-lock.json`; never commit `site/node_modules/`, `site/dist/`, `site/.astro/`, `site/public/archive/`, or `.superpowers/`.
- Use Node.js 22 locally and Node.js 22 in GitHub Actions.

## Planned File Map

```text
.gitignore                                  Generated/local artifacts only
.github/workflows/deploy-pages.yml          Manual GitHub Pages build/deploy workflow
README.md                                   Updated local-development and website notes
archive/covers/*.png                        Existing canonical covers; unchanged
archive/documents/*.pdf                     Existing canonical PDFs; unchanged
site/astro.config.mjs                       Static output, Pages base path, sitemap
site/package.json                           Exact scripts and dependencies
site/package-lock.json                      Locked npm dependency graph
site/tsconfig.json                          Astro strict TypeScript configuration
site/scripts/archive-assets.mjs             Archive copy and validation functions
site/scripts/sync-archive-assets.mjs        CLI entry point for archive synchronization
site/scripts/verify-build.mjs               Production output and link verification
site/tests/archive-assets.test.mjs          Archive-copy unit tests
site/tests/verify-build.test.mjs             Build-verifier unit tests
site/src/content.config.ts                  Document collection loader and Zod schema
site/src/content/documents/*.md             Verified metadata and approved descriptions
site/src/lib/documents.ts                   Sorted document collection queries
site/src/lib/urls.ts                        GitHub Pages base-path URL helper
site/src/layouts/BaseLayout.astro           Shared document shell and page metadata
site/src/components/SiteHeader.astro        Global navigation
site/src/components/SiteFooter.astro        Footer and repository link
site/src/components/ArchiveHeader.astro     Homepage introduction and archive count
site/src/components/DocumentCard.astro      Catalog entry presentation
site/src/components/DocumentMetadata.astro  Reusable factual metadata row
site/src/components/EvidenceNote.astro      Editorial evidence-language summary
site/src/components/PdfReader.astro         Embed, open, and download controls
site/src/components/DocumentNavigation.astro Previous/next links
site/src/components/MethodologySummary.astro Reusable methodology preview
site/src/pages/index.astro                   Archive homepage
site/src/pages/documents/[slug].astro        Generated document details
site/src/pages/methodology.astro             Full editorial methodology
site/src/pages/about.astro                   Project purpose and repository context
site/src/pages/404.astro                     Not-found recovery page
site/src/styles/global.css                   Tokens, typography, layout, interaction states
site/public/robots.txt                       Crawler policy and sitemap reference
```

---

### Task 1: Establish the Astro Toolchain and Deterministic Archive Sync

**Files:**
- Create: `.gitignore`
- Create: `site/package.json`
- Create: `site/package-lock.json` through npm
- Create: `site/tsconfig.json`
- Create: `site/astro.config.mjs`
- Create: `site/scripts/archive-assets.mjs`
- Create: `site/scripts/sync-archive-assets.mjs`
- Create: `site/tests/archive-assets.test.mjs`

**Interfaces:**
- Consumes: Canonical repository directories `archive/covers/` and `archive/documents/`
- Produces: `syncArchiveAssets(sourceRoot: URL, destinationRoot: URL): Promise<void>` and `validateArchiveAssets(sourceRoot: URL): Promise<void>`

- [ ] **Step 1: Create the package manifest without installing dependencies**

Create `site/package.json`:

```json
{
  "name": "the-haunted-archives-site",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "sync:archive": "node scripts/sync-archive-assets.mjs",
    "dev": "npm run sync:archive && astro dev",
    "check": "npm run sync:archive && astro check",
    "build": "npm run sync:archive && astro build",
    "test": "node --test tests/*.test.mjs",
    "verify": "npm test && npm run check && npm run build && node scripts/verify-build.mjs"
  },
  "dependencies": {
    "@astrojs/sitemap": "3.7.4",
    "astro": "7.3.1"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.10",
    "typescript": "7.0.2"
  },
  "engines": {
    "node": ">=22 <23"
  }
}
```

- [ ] **Step 2: Install the approved dependency set and create the lockfile**

Run: `npm install --prefix site`

Expected: npm creates `site/package-lock.json`; `npm ls --prefix site --depth=0` reports only Astro, sitemap, Astro check, and TypeScript as direct dependencies.

- [ ] **Step 3: Write the failing archive-copy tests**

Create `site/tests/archive-assets.test.mjs`:

```js
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';
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
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test --prefix site`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `site/scripts/archive-assets.mjs`.

- [ ] **Step 5: Implement archive validation and synchronization**

Create `site/scripts/archive-assets.mjs`:

```js
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
```

Create `site/scripts/sync-archive-assets.mjs`:

```js
import { syncArchiveAssets } from './archive-assets.mjs';

const sourceRoot = new URL('../../archive/', import.meta.url);
const destinationRoot = new URL('../public/archive/', import.meta.url);

await syncArchiveAssets(sourceRoot, destinationRoot);
console.log('Archive PDFs and covers synchronized.');
```

- [ ] **Step 6: Add strict Astro configuration and ignore generated content**

Create `site/tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

Create `site/astro.config.mjs`:

```js
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aungthurahein-nov03.github.io',
  base: '/the-haunted-archives',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
```

Create `.gitignore`:

```gitignore
.superpowers/
site/.astro/
site/dist/
site/node_modules/
site/public/archive/
```

- [ ] **Step 7: Run the focused tests and synchronization**

Run: `npm test --prefix site`

Expected: 2 tests pass.

Run: `npm run sync:archive --prefix site`

Expected: `site/public/archive/` contains two PNG covers and two PDFs, and Git ignores that generated directory.

- [ ] **Step 8: Commit the foundation**

```bash
git add .gitignore site/package.json site/package-lock.json site/tsconfig.json site/astro.config.mjs site/scripts/archive-assets.mjs site/scripts/sync-archive-assets.mjs site/tests/archive-assets.test.mjs
git commit -m "build: establish Astro site foundation"
```

### Task 2: Define and Validate the Document Collection

**Files:**
- Create: `site/src/content.config.ts`
- Create: `site/src/content/documents/the-architecture-of-silence.md`
- Create: `site/src/content/documents/the-house-that-named-its-ghosts.md`
- Create: `site/src/lib/documents.ts`
- Create: `site/src/lib/urls.ts`
- Create: `site/src/pages/index.astro`

**Interfaces:**
- Consumes: Astro `documents` content collection and `import.meta.env.BASE_URL`
- Produces: `getPublishedDocuments(): Promise<CollectionEntry<'documents'>[]>`, `archiveUrl(path: string): string`, and validated document records

- [ ] **Step 1: Create a page that references the missing collection helper**

Create `site/src/pages/index.astro`:

```astro
---
import { getPublishedDocuments } from '../lib/documents';

const documents = await getPublishedDocuments();
---
<h1>The Haunted Archives</h1>
<p>{documents.length} investigations</p>
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `npm run check --prefix site`

Expected: FAIL because `../lib/documents` does not exist.

- [ ] **Step 3: Define the content schema**

Create `site/src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const documents = defineCollection({
  loader: glob({ base: './src/content/documents', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1).optional(),
    documentNumber: z.number().int().positive(),
    location: z.string().min(1),
    locality: z.string().min(1).optional(),
    region: z.string().min(1).optional(),
    period: z.string().min(1).optional(),
    pageCount: z.number().int().positive(),
    description: z.string().min(1),
    cover: z.string().regex(/^covers\/[a-z0-9-]+\.png$/),
    pdf: z.string().regex(/^documents\/[a-z0-9-]+\.pdf$/),
    featured: z.boolean(),
    order: z.number().int().positive(),
    topics: z.array(z.string().min(1)).optional(),
  }),
});

export const collections = { documents };
```

- [ ] **Step 4: Add the two verified document records**

Create `site/src/content/documents/the-architecture-of-silence.md`:

```markdown
---
title: The Architecture of Silence
subtitle: Eastern State Penitentiary and the Stories That Remained
documentNumber: 1
location: Eastern State Penitentiary, Philadelphia
locality: Philadelphia
region: Pennsylvania
pageCount: 19
description: Examines the penitentiary's history, architecture, reported encounters, investigative methods, and the development of its haunted reputation.
cover: covers/the-architecture-of-silence.png
pdf: documents/the-architecture-of-silence.pdf
featured: true
order: 1
---

This documentary examines the relationship between Eastern State Penitentiary's documented history and the stories that have gathered around it.
```

Create `site/src/content/documents/the-house-that-named-its-ghosts.md`:

```markdown
---
title: The House That Named Its Ghosts
documentNumber: 2
location: The Shanley Hotel, Napanoch, New York
locality: Napanoch
region: New York
pageCount: 16
description: Investigates the lives, legends, named spirits, witness accounts, and experimental methods associated with the hotel.
cover: covers/the-house-that-named-its-ghosts.png
pdf: documents/the-house-that-named-its-ghosts.pdf
featured: true
order: 2
---

This documentary examines the people, testimony, folklore, and investigative practices associated with the Shanley Hotel.
```

- [ ] **Step 5: Implement collection and URL helpers**

Create `site/src/lib/documents.ts`:

```ts
import { getCollection, type CollectionEntry } from 'astro:content';

export async function getPublishedDocuments(): Promise<CollectionEntry<'documents'>[]> {
  const documents = await getCollection('documents');
  return documents.sort((left, right) => left.data.order - right.data.order);
}
```

Create `site/src/lib/urls.ts`:

```ts
export function siteUrl(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalized = path.replace(/^\//, '');
  return normalized ? `${base}/${normalized}` : `${base}/`;
}

export function archiveUrl(path: string): string {
  return siteUrl(`archive/${path}`);
}
```

- [ ] **Step 6: Run schema and type checks**

Run: `npm run check --prefix site`

Expected: PASS with 0 errors.

- [ ] **Step 7: Build and inspect generated collection routes baseline**

Run: `npm run build --prefix site`

Expected: PASS; `site/dist/index.html` exists and archive assets are present under `site/dist/archive/`.

- [ ] **Step 8: Commit the content layer**

```bash
git add site/src/content.config.ts site/src/content/documents site/src/lib site/src/pages/index.astro
git commit -m "feat: add validated archive content collection"
```

### Task 3: Build the Shared Layout and Nocturne Design System

**Files:**
- Create: `site/src/styles/global.css`
- Create: `site/src/layouts/BaseLayout.astro`
- Create: `site/src/components/SiteHeader.astro`
- Create: `site/src/components/SiteFooter.astro`

**Interfaces:**
- Consumes: `siteUrl(path)` from `site/src/lib/urls.ts`
- Produces: `BaseLayout` props `{ title: string; description: string; image?: string }` and named `default` page slot

- [ ] **Step 1: Replace the baseline homepage with a missing shared layout**

Update `site/src/pages/index.astro` to import `BaseLayout` and wrap its existing content with:

```astro
<BaseLayout
  title="The Haunted Archives"
  description="Evidence-led paranormal narrative nonfiction documenting history, reported encounters, folklore, and possible natural explanations."
>
  <h1>The Haunted Archives</h1>
  <p>{documents.length} investigations</p>
</BaseLayout>
```

- [ ] **Step 2: Run the check to verify it fails**

Run: `npm run check --prefix site`

Expected: FAIL because `../layouts/BaseLayout.astro` does not exist.

- [ ] **Step 3: Implement the shared shell**

Create `BaseLayout.astro` with:

- `title`, `description`, and optional `image` props
- `<html lang="en">`, viewport, description, canonical, Open Graph, and theme-color metadata
- a skip link targeting `#main-content`
- `SiteHeader`, `<main id="main-content"><slot /></main>`, and `SiteFooter`
- an import of `../styles/global.css`
- canonical and image URLs built with `new URL(Astro.url.pathname, Astro.site)` and `new URL(image, Astro.site)`

Create `SiteHeader.astro` with the project title and links produced by `siteUrl()` for Archive, Methodology, and About, plus an external GitHub link labeled `GitHub ↗`.

Create `SiteFooter.astro` with the line `Documented history. Reported encounters. The space between them.` and a repository link.

- [ ] **Step 4: Implement the design tokens and global behavior**

Create `global.css` with these required tokens:

```css
:root {
  color-scheme: dark;
  --ink-950: #070b0c;
  --ink-900: #0b1112;
  --ink-850: #101718;
  --paper-100: #ece9df;
  --paper-300: #c7c3b8;
  --verdigris-300: #93b2a5;
  --verdigris-500: #56776d;
  --rust-400: #a65b43;
  --rule: rgba(199, 195, 184, 0.22);
  --shadow: 0 28px 70px rgba(0, 0, 0, 0.42);
  --font-display: Georgia, 'Times New Roman', serif;
  --font-interface: Inter, ui-sans-serif, system-ui, sans-serif;
  --content: 76rem;
  --reading: 42rem;
}
```

The file must also define:

- body colors and a subtle radial background without external images
- `.shell` maximum width and responsive gutters
- skip-link, header, navigation, footer, link, button, and focus-visible rules
- readable typography with `line-height` at least `1.5` for body copy
- reusable `.eyebrow`, `.rule`, `.button`, `.button--secondary`, and `.sr-only` utilities
- breakpoints at `48rem` and `72rem`
- `@media (prefers-reduced-motion: reduce)` that removes nonessential animation and scroll behavior

- [ ] **Step 5: Check and build the shell**

Run: `npm run check --prefix site`

Expected: PASS with 0 errors.

Run: `npm run build --prefix site`

Expected: PASS; generated homepage contains the skip link, three internal navigation links, and repository link.

- [ ] **Step 6: Commit the shared design system**

```bash
git add site/src/layouts site/src/components/SiteHeader.astro site/src/components/SiteFooter.astro site/src/styles/global.css site/src/pages/index.astro
git commit -m "feat: add Nocturne Library design system"
```

### Task 4: Implement the Archive Homepage

**Files:**
- Create: `site/src/components/ArchiveHeader.astro`
- Create: `site/src/components/DocumentCard.astro`
- Create: `site/src/components/DocumentMetadata.astro`
- Create: `site/src/components/EvidenceNote.astro`
- Create: `site/src/components/MethodologySummary.astro`
- Modify: `site/src/pages/index.astro`
- Modify: `site/src/styles/global.css`

**Interfaces:**
- Consumes: `CollectionEntry<'documents'>`, `siteUrl()`, and `archiveUrl()`
- Produces: Accessible archive catalog cards and reusable methodology/evidence components

- [ ] **Step 1: Update the homepage to reference the missing archive components**

Update `index.astro` to render `ArchiveHeader`, a labeled archive-index section containing one `DocumentCard` per document, `MethodologySummary`, and `EvidenceNote`.

- [ ] **Step 2: Run the check to verify it fails**

Run: `npm run check --prefix site`

Expected: FAIL because the five archive components do not exist.

- [ ] **Step 3: Implement factual metadata and catalog cards**

Implement `DocumentMetadata.astro` with props `{ documentNumber: number; location: string; pageCount: number }`. Render a semantic list containing `Document 01`, the location, and `19 pages`, using zero-padded display numbers without altering source data.

Implement `DocumentCard.astro` with prop `{ document: CollectionEntry<'documents'> }`. It must:

- link the cover and title to `siteUrl('documents/<entry.id>/')`
- load the cover from `archiveUrl(document.data.cover)`
- use alt text `Cover of <title>`
- render `DocumentMetadata` and the verified description
- avoid a `target="_blank"` on internal navigation

- [ ] **Step 4: Implement the archive introduction and editorial components**

`ArchiveHeader.astro` receives `{ documentCount: number; pageCount: number; locationCount: number }` and renders:

- eyebrow: `An evidence-led paranormal archive`
- heading: `Documented history. Reported encounters.`
- supporting line: `The space between them.`
- count summary: `2 investigations · 35 pages · 2 historic locations`

`MethodologySummary.astro` renders the five evidence distinctions from the approved specification and links to `siteUrl('methodology/')`.

`EvidenceNote.astro` renders: `The suffering is documented. The haunting is reported.` followed by a sentence explaining that the archive preserves the boundary between historical record and supernatural interpretation.

- [ ] **Step 5: Complete the homepage composition and responsive styling**

Calculate `pageCount` with `documents.reduce((total, document) => total + document.data.pageCount, 0)` and derive `locationCount` from a `Set` of `document.data.location` values. Add CSS for the hero, archive grid, document cards, cover treatment, metadata list, methodology grid, and evidence note.

At widths below `48rem`, cards must use one column. At and above `48rem`, each card uses a cover column and text column. At and above `72rem`, the archive list may use two cards per row only if cover and description remain comfortably readable.

- [ ] **Step 6: Verify the homepage**

Run: `npm run check --prefix site`

Expected: PASS with 0 errors.

Run: `npm run build --prefix site`

Expected: PASS; `site/dist/index.html` contains both titles, both locations, `35 pages`, and links to both generated route paths.

- [ ] **Step 7: Commit the archive homepage**

```bash
git add site/src/components site/src/pages/index.astro site/src/styles/global.css
git commit -m "feat: build archive landing page"
```

### Task 5: Generate Document Pages and PDF Reading Controls

**Files:**
- Create: `site/src/components/PdfReader.astro`
- Create: `site/src/components/DocumentNavigation.astro`
- Create: `site/src/pages/documents/[slug].astro`
- Modify: `site/src/styles/global.css`

**Interfaces:**
- Consumes: Sorted records from `getPublishedDocuments()`, `archiveUrl()`, and `siteUrl()`
- Produces: Static `/documents/<slug>/` pages and `PdfReader` props `{ title: string; pdfPath: string }`

- [ ] **Step 1: Add the dynamic route with missing reader components**

Create `[slug].astro` with `getStaticPaths()` that returns every document ID and passes the current record plus adjacent records as props. Import `PdfReader` and `DocumentNavigation` before creating those components.

- [ ] **Step 2: Run the check to verify it fails**

Run: `npm run check --prefix site`

Expected: FAIL because `PdfReader.astro` and `DocumentNavigation.astro` do not exist.

- [ ] **Step 3: Implement the PDF reader**

Create `PdfReader.astro` with props `{ title: string; pdfPath: string }`. Resolve `const pdfUrl = archiveUrl(pdfPath)` and render:

- primary link `Read document` targeting `#document-reader`
- secondary normal link `Open PDF` to `pdfUrl`
- secondary link `Download PDF` with the `download` attribute
- `<section id="document-reader" aria-labelledby="reader-title">`
- `<iframe src={pdfUrl} title={`PDF reader for ${title}`} loading="lazy">`
- fallback copy inside the iframe linking to the PDF
- visible fallback copy below the iframe stating that embedded PDF support varies and providing Open PDF and Download PDF again

Do not add PDF.js or client-side reader JavaScript.

- [ ] **Step 4: Implement adjacent document navigation**

Create `DocumentNavigation.astro` with optional props `{ previous?: CollectionEntry<'documents'>; next?: CollectionEntry<'documents'> }`. Render only links that exist, label their directions, and build URLs with `siteUrl()`.

- [ ] **Step 5: Complete document detail composition**

The route page must render:

- `BaseLayout` with the document title, description, and cover social image
- `DocumentMetadata`
- cover image from `archiveUrl()`
- title, optional subtitle, verified description, and rendered Markdown body
- `EvidenceNote`
- `PdfReader`
- `DocumentNavigation`

Use `render(document)` from `astro:content` for the Markdown body. Calculate previous and next records from the sorted collection index.

- [ ] **Step 6: Add responsive reader and document styling**

Set the iframe aspect ratio to `8.5 / 11`, cap its height on desktop, and hide no fallback controls. On viewports below `48rem`, keep Open and Download controls before the iframe and allow the reader to occupy the available width.

- [ ] **Step 7: Verify generated routes and PDFs**

Run: `npm run check --prefix site`

Expected: PASS with 0 errors.

Run: `npm run build --prefix site`

Expected: PASS; both route directories contain `index.html`, and each HTML file includes the correct PDF URL, page count, cover URL, Open PDF link, and Download PDF link.

- [ ] **Step 8: Commit document reading pages**

```bash
git add site/src/components/PdfReader.astro site/src/components/DocumentNavigation.astro 'site/src/pages/documents/[slug].astro' site/src/styles/global.css
git commit -m "feat: add document pages and PDF reader"
```

### Task 6: Add Methodology, About, and Recovery Pages

**Files:**
- Create: `site/src/pages/methodology.astro`
- Create: `site/src/pages/about.astro`
- Create: `site/src/pages/404.astro`
- Modify: `site/src/styles/global.css`

**Interfaces:**
- Consumes: `BaseLayout`, `EvidenceNote`, and `siteUrl()`
- Produces: Complete informational routes and a useful 404 response

- [ ] **Step 1: Confirm the informational outputs do not exist yet**

Run:

```powershell
$paths = @('site/dist/methodology/index.html', 'site/dist/about/index.html', 'site/dist/404.html')
if ($paths | Where-Object { Test-Path -LiteralPath $_ }) { throw 'Unexpected informational route output' }
throw 'Missing informational routes'
```

Expected: exit code 1 with `Missing informational routes`.

- [ ] **Step 2: Create the methodology page**

Use the five approved evidence distinctions verbatim in a numbered or definition list. Add the statements that the archive does not rate supernatural claims as proven and that possible natural explanations are hypotheses subject to the same caution.

- [ ] **Step 3: Create the about page**

Use the repository-approved description: `The Haunted Archives is a collection of evidence-led paranormal narrative nonfiction.` Explain that the documents and website are maintained in the same public repository. Link to GitHub without introducing authorship, credentials, funding, affiliation, or publication claims.

- [ ] **Step 4: Create the 404 page**

Render `Record not found` as the heading, explain that the requested archive entry may have moved, and include a button linking to `siteUrl()` with the label `Return to the archive`.

- [ ] **Step 5: Check and build all informational routes**

Run: `npm run check --prefix site`

Expected: PASS with 0 errors.

Run: `npm run build --prefix site`

Expected: PASS; the methodology, about, and 404 output files exist and all return links include the GitHub Pages base path.

- [ ] **Step 6: Commit informational pages**

```bash
git add site/src/pages/methodology.astro site/src/pages/about.astro site/src/pages/404.astro site/src/styles/global.css
git commit -m "feat: add archive information pages"
```

### Task 7: Complete Discoverability Metadata

**Files:**
- Modify: `site/src/layouts/BaseLayout.astro`
- Create: `site/public/robots.txt`
- Modify: `site/src/pages/index.astro`
- Modify: `site/src/pages/documents/[slug].astro`

**Interfaces:**
- Consumes: Page title, description, optional cover image, `Astro.site`, and `Astro.url`
- Produces: Unique canonical, Open Graph, and crawler metadata plus sitemap output

- [ ] **Step 1: Add missing metadata expectations to `BaseLayout` usage**

Ensure every page passes a unique title and description. Document pages pass `archiveUrl(document.data.cover)` as their social image; informational pages omit the image.

- [ ] **Step 2: Implement canonical and Open Graph metadata**

`BaseLayout.astro` must output:

- `<title>` using `<page title> | The Haunted Archives`, except the homepage which uses the project name alone
- `<meta name="description">`
- canonical link from the current route and configured `site`
- `og:type`, `og:title`, `og:description`, `og:url`, and conditional `og:image`
- `twitter:card` set to `summary_large_image` when an image exists and `summary` otherwise
- `<meta name="theme-color" content="#0b1112">`

- [ ] **Step 3: Add crawler configuration**

Create `site/public/robots.txt`:

```text
User-agent: *
Allow: /
Sitemap: https://aungthurahein-nov03.github.io/the-haunted-archives/sitemap-index.xml
```

- [ ] **Step 4: Build and verify sitemap metadata**

Run: `npm run build --prefix site`

Expected: PASS; `site/dist/sitemap-index.xml` exists, every HTML page contains a canonical URL, and both document pages contain their cover URL as `og:image`.

- [ ] **Step 5: Commit discoverability metadata**

```bash
git add site/src/layouts/BaseLayout.astro site/src/pages/index.astro 'site/src/pages/documents/[slug].astro' site/public/robots.txt
git commit -m "feat: add archive metadata and sitemap"
```

### Task 8: Add Production Build Verification

**Files:**
- Create: `site/tests/verify-build.test.mjs`
- Create: `site/scripts/verify-build.mjs`

**Interfaces:**
- Consumes: A generated `site/dist/` directory
- Produces: `verifyBuild(outputRoot: URL): Promise<void>` that throws a descriptive error for missing routes, assets, metadata, or unsafe root-relative links

- [ ] **Step 1: Write failing build-verifier tests**

Create `site/tests/verify-build.test.mjs` with temporary output fixtures covering:

```js
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
  const required = ['methodology/index.html', 'about/index.html', 'documents/the-architecture-of-silence/index.html', 'documents/the-house-that-named-its-ghosts/index.html'];
  await mkdir(join(root, 'archive', 'covers'), { recursive: true });
  await mkdir(join(root, 'archive', 'documents'), { recursive: true });
  for (const file of required) {
    await mkdir(join(root, file, '..'), { recursive: true });
    await writeFile(join(root, file), '<link rel="canonical" href="https://example.test/page">');
  }
  await writeFile(join(root, 'index.html'), '<a href="/about/">Broken</a><link rel="canonical" href="https://example.test/">');
  await writeFile(join(root, '404.html'), '<link rel="canonical" href="https://example.test/404">');
  await writeFile(join(root, 'archive', 'covers', 'the-architecture-of-silence.png'), 'cover');
  await writeFile(join(root, 'archive', 'covers', 'the-house-that-named-its-ghosts.png'), 'cover');
  await writeFile(join(root, 'archive', 'documents', 'the-architecture-of-silence.pdf'), 'pdf');
  await writeFile(join(root, 'archive', 'documents', 'the-house-that-named-its-ghosts.pdf'), 'pdf');
  await writeFile(join(root, 'sitemap-index.xml'), '<sitemapindex />');
  await assert.rejects(verifyBuild(pathToFileURL(`${root}/`)), /Unsafe root-relative link/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test --prefix site`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `site/scripts/verify-build.mjs`.

- [ ] **Step 3: Implement the verifier**

Create `site/scripts/verify-build.mjs`:

```js
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
    if (unsafe) errors.push(`Unsafe root-relative link in ${relativePath}: ${unsafe[0]}`);
  }

  if (errors.length > 0) throw new Error(errors.join('\n'));
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (invokedPath === import.meta.url) {
  await verifyBuild(new URL('../dist/', import.meta.url));
  console.log('Production build verified.');
}
```
- reject `href="/<path>"` and `src="/<path>"` values unless they begin with `/the-haunted-archives/`
- report every missing file in one error rather than stopping after the first
- run `verifyBuild(new URL('../dist/', import.meta.url))` only when the file is invoked directly
- print `Production build verified.` after a successful direct invocation

- [ ] **Step 4: Run focused and full verification**

Run: `npm test --prefix site`

Expected: 4 tests pass.

Run: `npm run verify --prefix site`

Expected: tests and Astro checks pass, the production build succeeds, and the final line is `Production build verified.`

- [ ] **Step 5: Commit production verification**

```bash
git add site/tests/verify-build.test.mjs site/scripts/verify-build.mjs site/package.json
git commit -m "test: verify static archive output"
```

### Task 9: Add Manual GitHub Pages Deployment and Maintainer Documentation

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: `site/package-lock.json`, `npm run verify`, and `site/dist/`
- Produces: An owner-triggered Pages deployment workflow and documented maintenance process

- [ ] **Step 1: Create a manual-only deployment workflow**

Create `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy website to GitHub Pages

on:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5
      - name: Set up Node
        uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: site/package-lock.json
      - name: Install dependencies
        run: npm ci --prefix site
      - name: Verify production build
        run: npm run verify --prefix site
      - name: Configure Pages
        uses: actions/configure-pages@v5
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: site/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

The workflow remains manual. Do not run it, push it, or enable Pages during implementation.

- [ ] **Step 2: Update the README**

Preserve the existing document table and editorial language. Add:

- a `Website development` section with `npm install --prefix site`, `npm run dev --prefix site`, and `npm run verify --prefix site`
- a `Repository structure` section explaining `archive/`, `site/`, and `.github/workflows/`
- an `Adding a document` section with the PDF, cover, Markdown record, verification, and review sequence
- a statement that deployment is manually triggered after owner approval

- [ ] **Step 3: Run final local verification**

Run: `npm ci --prefix site`

Expected: clean install succeeds using the lockfile.

Run: `npm run verify --prefix site`

Expected: all 4 Node tests pass, Astro reports 0 errors, the build succeeds, and the production verifier passes.

Run: `git status --short`

Expected: only the intended workflow and README changes are uncommitted; generated site files remain ignored.

- [ ] **Step 4: Commit deployment configuration and documentation locally**

```bash
git add .github/workflows/deploy-pages.yml README.md
git commit -m "docs: add website deployment workflow"
```

- [ ] **Step 5: Stop before external publication**

Report the final local commit, test results, and preview instructions. Do not push, enable Pages, change repository settings, or dispatch the workflow. Request a separate owner-approved publication plan if the owner later wants the site published.

## Execution Checkpoints

Execution must pause for owner review at these points:

1. Before Task 1 installs packages or creates production files
2. After Task 4, when the homepage is available for visual review
3. After Task 6, when all visitor-facing routes are available for review
4. After Task 9, before any push, Pages configuration, or deployment

At each checkpoint, present the completed evidence, the next actions, and the exact files or external state that would change. Continue only after explicit approval.
