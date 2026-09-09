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
last_reviewed: '2026-09-09'
ai_provenance:
  model_family: GPT-6
  product: Codex
  generated_at: '2026-09-09'
  visible_context: Existing contribution guide, source links and official documentation locale checks.
  invisible_context_boundary: Did not verify every translated lesson or regional network availability.
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

For every learner-facing documentation link (resource cards, guides, tutorials, homepage help and hardware advice), prefer the official Simplified Chinese version. Link directly to the translated page, not an English landing page with a language selector. Verify the final URL and article body: a Chinese URL, translated navigation or HTTP 200 alone does not prove that the article is translated. If only Traditional Chinese is available, use it and identify the script in the guide. If the official locale falls back to English, keep the preferred locale URL when usable but label the actual reading language and explain the fallback in `reviewNote`. When no official Chinese page is verified, keep the source language; do not substitute an unofficial mirror. Update `url`, reading-source `sourceUrl`, language, prerequisites, guide text and `checkedAt` together; preserve separate repository provenance URLs. Historical evidence URLs are not reading-link replacements.

## Continuous integration

Pull requests and main-branch pushes run the hosted `Site checks` job: lockfile install, type/content checks, static build and DCO verification for pull-request commits. It publishes no site and uses no deployment secrets.

## Change review

Use English Conventional Commit messages and DCO sign-off when committing. Keep the first preview available for human visual review; deployment requires an explicit release stage.
