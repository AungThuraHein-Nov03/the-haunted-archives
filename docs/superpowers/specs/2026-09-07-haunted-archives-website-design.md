# The Haunted Archives Website Design

Date: 2026-09-07
Status: Proposed for owner review

## Summary

The Haunted Archives website will be a static, responsive Astro site published through GitHub Pages. It will present the repository's paranormal narrative-nonfiction documents as a credible digital archive. The visual foundation is the "Nocturne Library": dark, cinematic, spacious, and restrained, with subtle archival metadata and evidence-record details borrowed from the "Evidence Room" direction.

The first release contains an archive homepage, one generated detail page per document, a methodology page, and an about page. Visitors can browse verified document information, read PDFs in the browser when supported, open the original PDF directly, or download it.

## Goals

- Give the two existing documentaries a polished public reading experience.
- Keep documented history, testimony, folklore, paranormal claims, and possible natural explanations clearly distinguished.
- Make the PDFs, not decorative effects, the focus of the experience.
- Provide reliable reading and download paths on desktop and mobile.
- Make future documents easy to add without copying page markup.
- Deploy at no hosting cost from the existing public GitHub repository.
- Preserve accessible navigation, readable contrast, and reduced-motion behavior.

## Non-goals for the First Release

- User accounts, comments, annotations, or saved reading lists
- Full-text PDF search
- A database or external content-management system
- Automated extraction or classification of document claims
- Fabricated case evidence, dates, accession history, or institutional provenance
- Audio, video, maps, or interactive paranormal effects
- Commercial features or payments

## Verified Initial Content

The first release contains two documents:

1. **The Architecture of Silence**
   - Subtitle: *Eastern State Penitentiary and the Stories That Remained*
   - Location: Eastern State Penitentiary, Philadelphia
   - Length: 19 pages
   - Description: Examines the penitentiary's history, architecture, reported encounters, investigative methods, and the development of its haunted reputation.

2. **The House That Named Its Ghosts**
   - Location: The Shanley Hotel, Napanoch, New York
   - Length: 16 pages
   - Description: Investigates the lives, legends, named spirits, witness accounts, and experimental methods associated with the hotel.

Both PDFs are unencrypted and contain PDF outlines. Unknown or unverified fields will be omitted rather than inferred.

## Technical Architecture

### Framework and hosting

- Astro generates static HTML, CSS, and minimal client-side JavaScript.
- GitHub Actions builds the site after approved changes reach the deployment branch.
- GitHub Pages serves the generated output.
- The initial site has no runtime server, API, database, or authentication.
- Production paths account for the repository subpath `/the-haunted-archives/`.

### Repository boundaries

```text
archive/
├── covers/
└── documents/

site/
├── astro.config.mjs
├── package.json
├── public/
└── src/
    ├── components/
    ├── content/
    │   └── documents/
    ├── layouts/
    ├── pages/
    │   ├── documents/
    │   ├── about.astro
    │   ├── index.astro
    │   └── methodology.astro
    └── styles/

.github/workflows/
└── deploy-pages.yml
```

The canonical PDFs and covers remain under `archive/`. The Astro build copies them into the published output without requiring duplicate tracked copies. Website source stays under `site/`, and generated output is not committed.

### Build-time asset flow

The build will expose archive files at stable public paths:

```text
/archive/covers/<slug>.png
/archive/documents/<slug>.pdf
```

The implementation plan must choose one deterministic copy mechanism and test it in both local builds and GitHub Actions. A small build script is preferred over symbolic links because Windows and GitHub checkout behavior can make repository symlinks unreliable.

## Information Architecture

### Global navigation

- Archive: `/`
- Methodology: `/methodology/`
- About: `/about/`
- GitHub: external repository link

The project title links to the homepage. The navigation remains visible and keyboard accessible at all supported viewport sizes.

### Homepage

The homepage is the archive catalog. It contains:

1. A compact masthead and navigation
2. A restrained hero statement using the established editorial language
3. An archive index showing all published documents
4. A concise methodology preview
5. An about preview and repository link
6. A footer with project navigation

There is no separate splash screen. Visitors can reach a document immediately.

### Document detail pages

Astro generates one page per published content record at `/documents/<slug>/`. Each page contains:

1. Document number, location, and page count
2. Cover, title, subtitle when present, and verified description
3. A short editorial evidence note
4. Primary `Read document` and secondary `Download PDF` controls
5. An embedded PDF reading region
6. A clear fallback link when embedding is unsupported
7. Previous and next document navigation based on collection order

The embedded reader is an enhancement rather than the only route to the content. On small screens, opening the PDF directly is emphasized because embedded PDF behavior varies by browser and operating system.

### Methodology page

This page explains the archive's evidence language using the repository's existing editorial distinctions:

- Documented history is presented as fact.
- Eyewitness accounts are treated as testimony.
- Folklore and urban legends are identified as such.
- Paranormal interpretations remain claims rather than conclusions.
- Natural explanations are considered as hypotheses with the same caution.

The page does not rate claims, introduce new findings, or imply scientific verification.

### About page

The About page describes the purpose and editorial identity of The Haunted Archives. It links to the public repository and explains that the documents and website are maintained together. It does not invent authorship, credentials, funding, institutional affiliation, or publication history.

## Content Model

Astro's content collections provide schema validation and generate pages from Markdown records. Each document uses a file at `site/src/content/documents/<slug>.md`.

Required frontmatter:

```yaml
title: string
documentNumber: integer
location: string
pageCount: integer
description: string
cover: string
pdf: string
featured: boolean
order: integer
```

Optional frontmatter:

```yaml
subtitle: string
locality: string
region: string
period: string
topics: string[]
```

Rules:

- `documentNumber` is an internal display sequence such as "Document 01", not a claim of historical accession or provenance.
- `order` controls catalog and previous/next ordering.
- `cover` and `pdf` must point to tracked files under `archive/`.
- Optional fields are hidden when absent; the interface never prints placeholder facts.
- Descriptive Markdown below the frontmatter is allowed for longer, owner-approved context.
- Evidence categories are not assigned per document unless the document or owner-provided metadata supports them.

## Components and Responsibilities

- `BaseLayout`: document shell, metadata, global navigation, footer, and shared accessibility features
- `ArchiveHeader`: hero statement and archive summary
- `DocumentCard`: cover, verified metadata, description, and document link
- `DocumentMetadata`: consistent document number, location, and page-count presentation
- `EvidenceNote`: concise statement of the archive's editorial boundaries
- `PdfReader`: embed, loading treatment, direct-open fallback, and download control
- `DocumentNavigation`: previous and next document links
- `MethodologySummary`: reusable short methodology explanation

Components receive validated content records and do not contain document-specific facts.

## Data Flow

1. Astro loads and validates all document Markdown records during the build.
2. The homepage sorts published records by `order` and renders a `DocumentCard` for each.
3. Static path generation creates one detail page per record.
4. The detail page resolves its cover and PDF public paths and calculates adjacent records.
5. The archive-copy step places canonical PDFs and covers in the generated site.
6. The GitHub Pages workflow publishes only the generated output.

A missing required field or missing asset must fail the build rather than produce a broken public page.

## Visual Direction

### Foundation: Nocturne Library

- Deep blue-charcoal surfaces instead of pure black
- Warm off-white primary text
- Muted oxidized green for navigation, rules, and quiet emphasis
- Restrained rust accents drawn from the existing covers
- Editorial serif display typography paired with a highly legible sans-serif for interface text
- Large margins, generous vertical rhythm, and deliberate pacing
- Soft tonal lighting and restrained depth rather than high-contrast horror effects

### Archival layer

- Document numbers and index positions
- Compact accession-style metadata typography
- Thin rules, folio marks, and evidence-language labels
- Clear separation between descriptive copy and factual metadata
- Archival devices remain functional and never imply fake provenance or classification

### Explicitly avoided

- Occult symbols and invented sigils
- Blood, distressed gore, jump scares, or theatrical horror imagery
- Flickering or glitching text
- Excessive fog, grain, or illegibility
- Fake government, police, academic, or institutional stamps
- Claims presented as proven supernatural events

## Interaction and Motion

- Navigation and controls have visible hover and keyboard-focus states.
- Cards may use subtle image scale, border tone, or light movement on hover.
- Page transitions, if used, remain short and do not block navigation.
- `prefers-reduced-motion` removes nonessential transitions and transforms.
- No ambient audio plays automatically.
- The document reader does not trap focus or replace native browser controls.

## Responsive Behavior

- Mobile uses a single-column reading flow with large tap targets.
- Document covers retain their aspect ratio and never dominate the full viewport height.
- Metadata reflows without relying on horizontal scrolling.
- The PDF embed may be shortened or visually deprioritized on narrow screens while direct-open and download controls remain prominent.
- Desktop uses spacious compositions but keeps paragraph measure comfortable for long-form reading.

## Accessibility

- Semantic landmarks and heading order define the page structure.
- Every cover has descriptive alternative text identifying it as the document cover.
- Text and interactive states meet WCAG 2.2 AA contrast targets.
- All functionality works with a keyboard.
- Focus indicators remain visible against dark surfaces.
- Links state whether they read, download, or leave the site.
- Motion preferences are respected.
- The visual hierarchy does not rely on color alone.

## PDF Reading and Downloads

- `Read document` moves to or opens the embedded reading area on capable desktop browsers.
- `Open PDF` provides a normal link to the canonical published PDF.
- `Download PDF` uses a download hint while preserving a usable direct link if the browser ignores it.
- The reader includes a short fallback message with both open and download links.
- PDF URLs are stable and use lowercase hyphenated filenames.

## Error Handling

- Content-schema failures stop the build with a field-specific error.
- A build-time validation step checks that every referenced cover and PDF exists.
- A custom 404 page returns visitors to the archive.
- Missing optional metadata does not leave empty labels or broken spacing.
- Unsupported PDF embedding falls back to direct browser reading.

## Metadata and Discoverability

- Every page has a unique title and description.
- Document pages use their cover as the social sharing image where appropriate.
- Canonical URLs include the GitHub Pages repository base path.
- Open Graph metadata describes documents as narrative-nonfiction archive entries without endorsing paranormal claims.
- A sitemap and robots file are generated for the public site.

## Deployment

- A GitHub Actions workflow installs locked dependencies, builds Astro, validates output, and deploys the static artifact to GitHub Pages.
- Deployment uses the official Pages Actions flow and the minimum required workflow permissions.
- The repository owner enables GitHub Pages with GitHub Actions as the source before the first production deployment.
- The workflow is not pushed or activated until the owner explicitly approves deployment.
- No custom domain is part of the first release.

## Testing and Verification

Before deployment, implementation verification will include:

- Astro type and content-schema checks
- Production build from a clean dependency install
- Asset validation for both PDFs and covers
- Route checks for the homepage, methodology, about, both document pages, and 404 page
- Link checks for navigation, direct PDF access, and downloads
- Responsive review at representative mobile, tablet, and desktop widths
- Keyboard navigation and visible-focus review
- Reduced-motion review
- Contrast review for text and interactive states
- Browser smoke tests for the embedded-reader fallback
- Verification that GitHub Pages subpath URLs work in the production build

## Adding a Future Document

1. Add a lowercase, hyphenated PDF to `archive/documents/`.
2. Add its cover to `archive/covers/`.
3. Add one validated Markdown record to `site/src/content/documents/`.
4. Use only verified or owner-supplied metadata.
5. Run the validation and production build commands.
6. Review the generated card, detail page, reader, and download link.
7. Commit the three source files after review.

No component or route should require modification for an ordinary new document.

## First-release Acceptance Criteria

- The site builds statically with Astro and works under the repository's GitHub Pages base path.
- The homepage lists both current documents with verified metadata and working covers.
- Each document has a generated detail page with functional read, open, and download paths.
- Methodology language preserves the distinction between history, testimony, folklore, paranormal claims, and possible natural explanations.
- The design reflects Nocturne Library with restrained archival details and no theatrical horror styling.
- Pages are usable on mobile and desktop and navigable by keyboard.
- Missing required content or assets fail the build.
- Adding a normal future document requires only its PDF, cover, and one content record.
- No deployment occurs until the repository owner explicitly approves it.

