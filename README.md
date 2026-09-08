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
last_reviewed: '2026-09-08'
ai_provenance:
  model_family: GPT-6
  product: Codex
  generated_at: '2026-09-08'
  visible_context: Existing static site, three original practice courses, shared audience configuration and local browser verification.
  invisible_context_boundary: No independent learner trials or hiring outcomes.
---

# site-kungfu-pub

A Simplified Chinese Agent learning and observation site, intended for `kungfu.pub`.

The public preview at `https://pub.kungfu-trader.com/` contains three complete practice entries, learning paths, original tutorial drafts, curated resources, editorial observations and a career entry. Content remains marked as a preview.

The business beginner practice at `/practice/competitor-watch/` connects dated public recruitment examples to a fictional competitor-observation exercise. It includes six source cards, a worked brief, five guided steps, a browser-local workbook, and learner-authored portfolio export. Exercise brands and figures are fictional; learner usability and hiring outcomes have not been independently validated.

The other two practices at `/practice/agent-coding/` and `/practice/agent-evaluation/` provide downloadable fixtures, guided workbooks, worked examples and learner-authored exports. The coding reference is checked against nine real Python CLI tests. The evaluation exercise keeps reference behaviors separate from actual learner runs.

`src/data/learner-profiles.ts` is the global audience configuration. The header identity selector updates homepage recommendations, practice discovery, resource filters, career guidance and observations through a shared browser store. The selection persists locally and synchronizes across tabs; it is a learning preference, not an account or access restriction. Existing workbook and bookmark keys are preserved.

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

All pages are marked `noindex,nofollow`. The existing AWS China S3/CloudFront preview serves `pub.kungfu-trader.com`; deployment is an explicitly authorized stage owned by the private infrastructure repository. Editorial notes and tutorials are drafts. Career content supplies original recruitment entry points and an empty sampling template, not live job statistics or measured market trends.

Future deployment should use the existing Buildchain web-surface path and infrastructure repository; this repository contains no deployment credentials or automatic publication workflow. Optional APIs can be introduced behind `/api/` without moving public articles to runtime rendering.

See [docs/MAP.md](docs/MAP.md) for routes and [CONTRIBUTING.md](CONTRIBUTING.md) for local verification.
