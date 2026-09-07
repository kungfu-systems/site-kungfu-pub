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

# Site map

| Route              | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| `/`                | Editorial home and exploration                  |
| `/roadmaps/`       | Learning path selection                         |
| `/roadmaps/{id}/`  | Node exploration and local progress             |
| `/tutorials/{id}/` | Original Markdown tutorials                     |
| `/resources/`      | Resource filtering and local bookmarks          |
| `/resources/{id}/` | Source-aware resource introduction              |
| `/trends/`         | Editorial observations                          |
| `/trends/{id}/`    | Observation detail with original sources        |
| `/careers/`        | Recruitment sources and observation methodology |
| `/search/`         | Static full-text search                         |
| `/about/`          | Purpose and editorial standards                 |

## Extension points

Add tutorials to the content collection. Reference them by stable slug in nodes. Add sources and observations to `catalog.json`; never encode measured market facts as decorative numbers.

Future observations should capture source URL, event date, observed date, sample scope, methodology, review state and limitations separately. A future search service should consume the same canonical content IDs. User progress is separate state and must not become the authority for learning content.
