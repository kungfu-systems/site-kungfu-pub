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

# First preview review

Reviewed locally on 2026-09-07. Product/content review remains pending.

## Delivered surface

- Simplified Chinese editorial home, roadmap explorer, resource library, tutorial pages, trend notes, career radar, search, and about page.
- Three roadmaps, six shared learning nodes, three original tutorial drafts, three external resource introductions, three editorial notes, two official recruitment entry points, and an empty observation CSV template.
- Browser-local progress/bookmarks. No login, remote tracking, recruitment collection daemon, or production deployment.

## Verification evidence

| Check                    | Observed result                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `npm run check`          | Exit 0; 0 errors, 0 warnings, 0 hints; valid references and acyclic prerequisites                                  |
| `npm run build`          | Exit 0; 20 static pages, 18 searchable pages; extended Pagefind Chinese index                                      |
| Internal HTML references | 375 local references; zero missing targets; zero external runtime asset URLs                                       |
| Responsive browser sweep | 11 representative routes at widths 320, 390, 1440; 33 combinations; zero horizontal overflows and zero page errors |
| Progress                 | Complete a node, reload, and observe 1/4 completed                                                                 |
| Bookmarks and filtering  | Bookmark persists across reload; saved/language filters, empty state and reset behave correctly                    |
| Chinese full-text search | Tool-call query returns results; recruitment query returns five results including career radar                     |
| Mobile interaction       | Menu opens/closes; home map station selection changes state                                                        |
| Storage unavailable      | Progress and bookmark toggles continue in memory with a visible persistence limitation                             |
| JavaScript disabled      | Original tutorial headings and body remain readable                                                                |

Browser artifacts are in ignored `output/playwright/`, including desktop/mobile home images, roadmap and search screenshots, responsive and storage-fallback outputs. Screenshots are visual inspection evidence, not a full accessibility or cross-browser audit.

## Review boundary

- This records local validation of the first preview; GitHub PR history owns its commit and merge status.
- The feature worktree remains available for review after mainline integration.
- Local preview serves `http://127.0.0.1:4327` and remains running.
- No DNS, CDN, backend, or `kungfu.pub` production release was configured.
- Browser checks used Chromium. Safari, Firefox and real mobile devices were not separately qualified.
- Official recruitment entry points are linked; continuous samples and measured hiring trends are not yet implemented.
- Original educational/editorial content is marked draft and still needs human review.
