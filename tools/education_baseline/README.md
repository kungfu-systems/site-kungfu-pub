---
status: draft
period: '2024-2026'
theme: agent-education-baseline
doc_type: guide
source_level: local-files
confidence: medium
sensitivity: internal
evidence_grade: B
review_state: unreviewed
last_reviewed: '2026-09-08'
---

# Local education and employment baseline

This local research pipeline archives explicitly selected public sources, extracts national
school/major registries, preserves a reviewed curriculum sample and compares it with the
existing employment candidate snapshot. It neither publishes the data nor estimates a
national Agent talent supply or competence deficit.

## Invariants

- Admissions plans, actual admissions, enrolled students and graduates are separate measures.
- National school identifiers are strings. Beijing admissions codes are province-specific.
- A course plan, an implemented class, a student example and an assessed population are different evidence types.
- Unobserved values remain null. OCR candidates never enter aggregates automatically.
- Traditional multi-agent systems are not automatically classified as LLM Agent engineering.
- Preserve cohort, publication date, retrieval date, source bytes and SHA-256 separately.
- Do not infer national recruiting shares from a convenience sample dominated by one employer.

## Reproduce

Create an isolated worktree, then a local environment:

```sh
python3 -m venv .private/education-baseline/venv
.private/education-baseline/venv/bin/python -m pip install -r tools/education_baseline/requirements.txt
```

Capture the three bounded source lists independently. `collect.py` only requests explicitly
listed HTTPS URLs, serializes requests per host, retains HTTP failures, and reuses captured
records. PDF extraction uses `pdftotext`. Files above 250 MB are rejected.

```sh
python3 tools/education_baseline/collect.py --sources tools/education_baseline/sources.json --out .private/education-baseline/2026-09-08
python3 tools/education_baseline/collect.py --sources tools/education_baseline/curriculum_sources.json --out .private/education-baseline/2026-09-08/curricula
python3 tools/education_baseline/collect.py --sources tools/education_baseline/additional_sources.json --out .private/education-baseline/2026-09-08/additional
```

For image-only PDFs on macOS, compile `ocr.swift`, then pass the exact captured PDF and a
new output JSONL path. This uses Apple Vision locally and records page coordinates and
recognition confidence. Do not overwrite a previously reviewed OCR run.

```sh
swiftc tools/education_baseline/ocr.swift -o .private/education-baseline/ocr
.private/education-baseline/ocr INPUT.pdf OUTPUT.jsonl
```

The 2025 and 2026 Beijing OCR outputs are named `BJ2025-ocr.jsonl` and `BJ2026-ocr.jsonl`
inside the capture directory. The raw registry resolves their input PDFs by source ID.

```sh
.private/education-baseline/venv/bin/python tools/education_baseline/admissions.py --capture .private/education-baseline/2026-09-08 --out .private/education-baseline/2026-09-08/baseline
.private/education-baseline/venv/bin/python tools/education_baseline/normalize.py --capture .private/education-baseline/2026-09-08 --jobs /ABSOLUTE/PATH/TO/normalized/jobs.jsonl --out .private/education-baseline/2026-09-08/baseline
.private/education-baseline/venv/bin/python tools/education_baseline/validate.py --capture .private/education-baseline/2026-09-08
```

`admissions.py` also requires `pdfplumber`. The reviewed admission panel and course rows
are researcher-curated inputs, not an automatic promotion of OCR results. Preserve their
source references when reviewing new rows. The reviewed 2024-2026 admissions panel is
three deliberately selected schools, not a random national sample. Beijing 2024 page 1
is introductory/military material and excluded from automatic extraction.

`normalize.py` emits CSV, JSON and DuckDB. It checks all three school-list counts and
both approval-list serial sequences. Cooperation suffix H is preserved. Approval entries
include second degrees and changes: never label every row a newly opened program.
The 2026 approval result list is not captured in this baseline.

## Baseline boundaries

The source registry has 63 entries, 62 locally captured; one indexed BIT curriculum PDF
returns HTTP 404. There are 32 school profiles across 13 provincial regions, with unequal
depth and an eastern/northern concentration. Micro-programs, master's programs,
vocational degrees and old curricula are explicitly labeled. The 1,949 automatically
extracted admissions candidates contain known OCR/association errors and are excluded
from summary counts. Nine reviewed plan rows form the initial comparison panel.

The employment snapshot contains 286 mainland Agent job candidates. The 65 intern/graduate
candidates include 64 from Baidu and one from Richinfo. Keyword mentions are preliminary
source-description signals; they are not independently assessed skills or historical
market estimates. The input hash is stored in `summary.json`.

No overall student attainment, national major enrollment total, or skill-gap percentage
is estimated. Full snapshots remain under ignored `.private/`; neither research data
nor generated reports are wired into the public site.

## Local deliverables

Package the normalized JSON, CSV and DuckDB files with an integrity manifest:

```sh
python3 tools/education_baseline/package.py --baseline .private/education-baseline/2026-09-08/baseline --out output/education-baseline/agent-education-baseline-data-20260908.zip
```

`report.py` renders the private canonical `report-source.md` using ReportLab. `workbook.mjs`
authors the companion XLSX with `@oai/artifact-tool`, including filters and text-formatted
identifiers. These optional presentation tools require ReportLab and `@oai/artifact-tool`;
they are not dependencies of capture, normalization or packaging. Keep the report source,
query notes and original snapshots local. The workbook stores all tabular values, while
JSON/DuckDB retain additional provenance fields useful for machine queries.
