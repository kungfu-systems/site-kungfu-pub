---
status: draft
period: '2026-09'
theme: kungfu-pub
doc_type: guide
source_level: local-files
confidence: medium
sensitivity: public
evidence_grade: B
review_state: unreviewed
last_reviewed: '2026-09-07'
---

# site-kungfu-pub

A Simplified Chinese Agent learning and observation site, intended for `kungfu.pub`.

The first preview contains three learning paths, three original tutorial drafts, three curated resources, three editorial observation notes, and an employment-observation entry page. Product and content review continue before public deployment.

## Run locally

Requires Node.js 22.12 or newer and npm 12 or newer.

```sh
npm ci
npm run check
npm run build
npm run preview
```

Open `http://127.0.0.1:4327`. For editing, use `npm run dev`; full-text search requires the built preview because Pagefind indexes generated HTML.

## Architecture

- Astro statically generates public content pages.
- React handles roadmap exploration, local progress, filtering, bookmarks, navigation, and search.
- `src/content/tutorials/*.md` owns original tutorial text and provenance.
- `src/data/catalog.json` owns stable topic IDs, roadmap membership, curated source pointers, and editorial observation records.
- `src/lib/storage.ts` isolates browser-local persistence. There are no accounts or remote storage.
- Pagefind builds a Chinese-capable search index from HTML. It does not crawl linked external websites.
- Fonts use the operating system. Icons and scripts are served from the same origin. No runtime CDN or analytics integration is required.

## Preview boundary

All pages are marked `noindex,nofollow`. Domain, DNS, cloud resources and production deployment have not been configured. Editorial notes and tutorials are drafts. Career content supplies original recruitment entry points and an empty sampling template, not live job statistics or measured market trends.

Future deployment should use the existing Buildchain web-surface path and infrastructure repository; this preview deliberately contains no deployment credentials or automatic publication workflow. Optional APIs can be introduced behind `/api/` without moving public articles to runtime rendering.

See [docs/MAP.md](docs/MAP.md) for routes and [CONTRIBUTING.md](CONTRIBUTING.md) for local verification.
