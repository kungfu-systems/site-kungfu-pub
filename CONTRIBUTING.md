---
status: draft
period: '2026-09'
theme: kungfu-pub
doc_type: guide
source_level: local-files
confidence: medium
sensitivity: internal
evidence_grade: B
review_state: unreviewed
last_reviewed: '2026-09-07'
ai_provenance:
  model_family: GPT-6
  product: Codex
  generated_at: '2026-09-07'
  visible_context: User brief and current repository implementation
  invisible_context_boundary: No production deployment or user validation
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

## Content

Tutorial Markdown uses schema-checked frontmatter. Preserve source links, editorial status, review date and provenance. Resource entries contain source-owned URLs; tutorial bodies are original editorial work. Mark editorial drafts visibly. Career observations need dated samples and explicit scope before statistics can be published.

## Change review

Use English Conventional Commit messages and DCO sign-off when committing. Keep the first preview available for human visual review; deployment requires an explicit release stage.
