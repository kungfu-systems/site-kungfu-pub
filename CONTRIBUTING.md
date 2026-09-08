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

# Contributing

Use an isolated feature worktree. Keep content changes separate from runtime and infrastructure changes.

## Validation

```sh
npm ci
npm run check
npm run build
npm run preview
```

`check` runs Astro/TypeScript diagnostics, validates content references and checks prerequisite cycles. The build generates static pages and Pagefind's Chinese search index. Verify desktop/mobile rendering, keyboard navigation, search, resource filters, and persistence across reloads in the built preview.

Keep `package-lock.json` current. Do not commit generated `dist`, dependencies or browser artifacts. Review screenshots belong under ignored `output/playwright/`.

The optional local employment pipeline and its offline tests are documented in
[tools/job_market/README.md](tools/job_market/README.md). CI runs these tests with
synthetic fixtures; it does not collect jobs or publish captured data.

## Content

Tutorial Markdown uses schema-checked frontmatter. Preserve source links, editorial status, review date and provenance. Resource entries contain source-owned URLs; tutorial bodies are original editorial work. Mark editorial drafts visibly. Career observations need dated samples and explicit scope before statistics can be published.

## Continuous integration

Pull requests and main-branch pushes run the hosted `Site checks` job: lockfile install, type/content checks, static build and DCO verification for pull-request commits. It publishes no site and uses no deployment secrets.

## Change review

Use English Conventional Commit messages and DCO sign-off when committing. Keep the first preview available for human visual review; deployment requires an explicit release stage.
