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

# Site map

| Route                                             | Purpose                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `/`                                               | Editorial home and exploration                                                       |
| `/roadmaps/`                                      | Learning path selection                                                              |
| `/roadmaps/{id}/`                                 | Node exploration and local progress                                                  |
| `/tutorials/{id}/`                                | Original Markdown tutorials                                                          |
| `/resources/`                                     | Resource filtering and local bookmarks                                               |
| `/resources/{id}/`                                | Source-aware resource introduction                                                   |
| `/trends/`                                        | Editorial observations                                                               |
| `/trends/{id}/`                                   | Observation detail with original sources                                             |
| `/careers/`                                       | Recruitment sources and observation methodology                                      |
| `/practice/competitor-watch/`                     | Beginner business pathway, source pack, guided workbook and learner portfolio export |
| `/practice/competitor-watch/example/`             | Clearly fictional worked brief with source-by-source explanations                    |
| `/practice/competitor-watch/download/{asset}.txt` | Static material, prompt, example and blank-template downloads                        |
| `/search/`                                        | Static full-text search                                                              |
| `/about/`                                         | Purpose and editorial standards                                                      |

## Extension points

Add tutorials to the content collection. Reference them by stable slug in nodes. Add sources and observations to `catalog.json`; never encode measured market facts as decorative numbers.

Future observations should capture source URL, event date, observed date, sample scope, methodology, review state and limitations separately. A future search service should consume the same canonical content IDs. User progress is separate state and must not become the authority for learning content.

The competitor-watch course is authored in `src/data/competitor-watch.ts` and rendered by Astro. Its fictional exercise sources are separate from dated recruitment examples. React saves learner text, quiz answers and self-checks in the current browser only. Portfolio export never inserts the worked answer or implies employment qualification. `npm run check` includes focused workbook and download-contract tests. Beginner usability with independent learners and actual hiring outcomes remain unverified.

## Identity-aware practice

- `/practice/agent-coding/`: programmer practice with an offline Python task, starter, nine CLI checks, reference implementation and workbook export.
- `/practice/agent-evaluation/`: eight-case fictional assistant evaluation, reference behaviors, baseline/retest workbook and delivery decision.
- Both routes have `/example/` and `/download/<asset>` endpoints.
- Global identity configuration lives in `src/data/learner-profiles.ts`; the header persists a browser-local preference and discovery pages subscribe to it. Direct content links always remain accessible.
- Browser data stays on the current origin/device; changing identity does not erase practice drafts or bookmarks.
