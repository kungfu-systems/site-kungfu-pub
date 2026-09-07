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

# site-kungfu-pub

This private repository builds a Simplified Chinese Agent learning and observation site.

- Product use and navigation: [docs/MAP.md](docs/MAP.md).
- Development and checks: [CONTRIBUTING.md](CONTRIBUTING.md).
- Content sources: `src/content/tutorials` and `src/data/catalog.json`.
- User-facing copy and tutorials use Simplified Chinese as explicitly requested. Engineering documentation and commit/PR text use English.
- Before work in the private managed workspace, load its canonical Atlas preflight rules and `web-surface-release-semantics.md`. Workspace governance stays outside the application bundle.
- Keep source-backed editorial guidance distinct from measured trends. Do not invent hiring counts, salary changes or adoption evidence.
- The current deliverable is a local preview. Public deployment is a separate stage.
