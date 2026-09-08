<div align="center">

# The Haunted Archives

*Documented history. Reported encounters. The space between them.*

**[Visit The Haunted Archives →](https://aungthurahein-nov03.github.io/the-haunted-archives/)**

**2 investigations · 35 pages · 2 historic locations**

</div>

The Haunted Archives is a collection of evidence-led paranormal narrative nonfiction. Each documentary examines a location's documented history, reported encounters, folklore, and possible natural explanations without presenting paranormal interpretation as established fact.

## Documents

<table>
  <tr>
    <td width="230" align="center">
      <a href="./archive/documents/the-architecture-of-silence.pdf">
        <img src="./archive/covers/the-architecture-of-silence.png" width="210" alt="Cover of The Architecture of Silence">
      </a>
    </td>
    <td>
      <h3>The Architecture of Silence</h3>
      <p><strong>Eastern State Penitentiary · Philadelphia · 19 pages</strong></p>
      <p>Examines the penitentiary's history, architecture, reported encounters, investigative methods, and the development of its haunted reputation.</p>
      <p><a href="./archive/documents/the-architecture-of-silence.pdf"><strong>Read the documentary →</strong></a></p>
    </td>
  </tr>
  <tr>
    <td width="230" align="center">
      <a href="./archive/documents/the-house-that-named-its-ghosts.pdf">
        <img src="./archive/covers/the-house-that-named-its-ghosts.png" width="210" alt="Cover of The House That Named Its Ghosts">
      </a>
    </td>
    <td>
      <h3>The House That Named Its Ghosts</h3>
      <p><strong>The Shanley Hotel · Napanoch, New York · 16 pages</strong></p>
      <p>Investigates the lives, legends, named spirits, witness accounts, and experimental methods associated with the hotel.</p>
      <p><a href="./archive/documents/the-house-that-named-its-ghosts.pdf"><strong>Read the documentary →</strong></a></p>
    </td>
  </tr>
</table>

## Editorial Approach

> **The suffering is documented. The haunting is reported.**

The documentaries distinguish among different kinds of evidence:

- Documented history is presented as fact.
- Eyewitness accounts are treated as testimony.
- Folklore and urban legends are identified as such.
- Paranormal interpretations remain claims rather than conclusions.
- Natural explanations are considered as hypotheses, with the same caution applied to them.

The aim is to preserve the mystery of each location while keeping the boundary between the historical record and supernatural interpretation visible.

## Reading the Archive

Select a documentary in the table above to view it on GitHub. From the document page, use the download control if you prefer to read the original PDF locally.

## Website development

The archive website is a static Astro project in `site/` and requires Node.js 22 with npm.

Install its dependencies from the repository root:

```sh
npm install --prefix site
```

Start the local development server:

```sh
npm run dev --prefix site
```

Run the tests, Astro checks, production build, and generated-output verification:

```sh
npm run verify --prefix site
```

## Repository structure

- `archive/` contains the source PDF documents and cover images.
- `site/` contains the Astro website, document records, tests, and build scripts.
- `.github/workflows/` contains the manual GitHub Pages deployment workflow.

The website build copies archive files into `site/public/archive/`. Those generated copies are not the source of record and should not be edited directly.

## Adding a document

1. Add the finished PDF to `archive/documents/`.
2. Add its PNG cover to `archive/covers/` using the same lowercase, hyphenated filename stem as the PDF.
3. Add a Markdown record to `site/src/content/documents/` following the existing records and content schema.
4. Run `npm run verify --prefix site` to validate the record, synchronize the archive files, and verify the production output.
5. Review the generated document page locally before committing the new archive entry.

Deployment is manually triggered through the GitHub Pages workflow only after owner approval.
