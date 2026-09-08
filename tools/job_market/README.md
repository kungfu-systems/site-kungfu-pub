---
status: draft
period: '2026-03-08/2026-09-08'
theme: agent-employment-observation
doc_type: runbook
source_level: local-files-and-public-recruitment-pages
confidence: medium
sensitivity: internal
evidence_grade: B
review_state: self-reviewed
last_reviewed: 2026-09-08
ai_provenance:
  model_family: GPT-6
  product: Codex
  generated_at: 2026-09-08
  visible_context: Pipeline code, local HTTP snapshots, and public recruitment pages.
  invisible_information_boundary: No employer internal records or complete historical market snapshots.
---

# Local Agent employment observations

An independent Python pipeline inside the site repository. It captures anonymous
public recruitment pages, preserves local evidence, normalizes records into
DuckDB, and exports static JSON plus a standalone Chinese preview. It does not
write to the Astro `public/` directory, publish a website, create a schedule, or
contact AWS. Gitea and infrastructure work are independent.

## Run locally

Run these commands from the repository or this isolated worktree. Python 3.11+
is required; this run was verified with Python 3.14 on macOS.

```bash
python3 -m venv .private/job-market/venv
.private/job-market/venv/bin/python -m pip install -r tools/job_market/requirements.txt

# A new run ID creates a new observation. Choose an unused ID for fresh data.
.private/job-market/venv/bin/python -m tools.job_market run \
  --run-id 20260908-initial --start 2026-03-08 --end 2026-09-08

# Completely offline: rebuild DuckDB, normalized records, and export candidates.
.private/job-market/venv/bin/python -m tools.job_market export \
  --start 2026-03-08 --end 2026-09-08

.private/job-market/venv/bin/python -m unittest discover -s tools/job_market/tests -v
```

`collect`, `normalize`, `export`, and `run` are separate CLI commands. `export`
includes normalization. Use `--root PATH` for a different local data directory;
`--sources FILE` and `--taxonomy FILE` select versioned configuration. The date
defaults are the original requested interval, not a moving current-date window:
pass new dates explicitly for subsequent reports.

Collect a subset with repeated `--source` arguments:

```bash
.private/job-market/venv/bin/python -m tools.job_market collect \
  --run-id 20260909-company-observation --source baidu --source tencent
```

Use one writer at a time for a data root. Reusing a run ID skips sources already
recorded in that run, including partial and blocked results; use a **new run ID**
to retry a source or observe a new day. Successful HTTP responses are cached
within the run. Configuration changes require a new run ID. HTTP errors are
recorded rather than silently counted as zero demand. There are no automatic
challenge, rate-limit, or authentication retries.

Open the candidate selected by `.private/job-market/data/candidate-manifest.json`.
Its `index.html` works directly from the filesystem without a server or CDN. It
supports search, skill/date filters, pagination, weekly counts, and 13-week rolling
sample windows. `report.md` explains coverage. If using an HTTP preview, serve
**only the selected candidate directory**, never the raw data root.

## What the first dataset means

The interval is `[2026-03-08, 2026-09-08)` in Asia/Shanghai calendar dates. It has
26 complete Monday–Sunday weeks and two partial edge weeks. A 13-week window is
91 days, approximately three months; it is not three calendar months. The first
interval permits 14 complete rolling windows advanced by one week.

The initial capture contains real source records. It is a purposive sample,
not a representative or complete Chinese labor-market dataset. The source list
has **25 entries**, including 13 selected dated pages and 10 feasibility probes;
these are not 25 employers or 25 complete job-board feeds.

| Source surface | Coverage and date interpretation |
| --- | --- |
| Baidu career search | First public SSR page for each configured keyword and hiring type. Per-query reported/retrieved counts are retained. `publishDate` is a publisher-reported date, not an independently archived posting event. |
| Tencent career search | Anonymous GET pagination over four keywords. Per-query completeness is checked. Only `LastUpdateTime` is supplied, so publication date stays null. Responsibilities may omit qualifications. |
| University employer postings and research institutions | Selected currently accessible dated pages. Date and title anchors are checked. Multi-role campaigns and recruitment directions remain separate from single jobs. |
| BOSS, Liepin, Zhaopin, 51job and other employer pages | Feasibility checks only where allowed. Blocked access, JavaScript shells, security verification and missing adapters remain explicit gaps. |

No historical weekly inventory snapshots exist in this capture. Reading a March
page in September does not establish that its current wording was present in
March or that all March jobs survived. **Historical new jobs, active jobs and
growth rates therefore remain `null`**, even for weeks with dated samples. Zero
sample counts mean no selected sample, not zero market demand. First-seen time is
kept separate from publication and update time; an initial stock is not an inflow.

`trends.json` contains page-date sample cohorts, skills mentioned, denominators
and source composition for weekly and rolling windows. `skills.json` uses all
collected eligible jobs, including older and undated jobs; it is not a six-month
market share table. Month partitions likewise retain older jobs and an explicit
`undated` partition for baseline queries. The UI date filter selects only the
requested interval. Every candidate has `publishable=false` until coverage and
editorial review are separately resolved.

## Evidence, normalization, and classification

```text
data/
  raw/<sha256>.bin                 immutable local response bodies
  runs/<run-id>/run.json           exact source configuration and requested period
  runs/<run-id>/requests.jsonl     URLs, timestamps, HTTP status, body hashes
  runs/<run-id>/observations.jsonl parsed source observations
  runs/<run-id>/sources.json       source outcomes and per-query coverage
  normalized/jobs.jsonl           normalized jobs and classification evidence
  normalized/duplicate-candidates.json
  market.duckdb                   observations, jobs, source_checks
  candidates/<version>/          JSON, CSV, HTML, Markdown, checksummed manifest
  candidate-manifest.json         local pointer; never a production pointer
```

All data and the virtual environment are ignored by Git under `.private/`. Raw
pages can contain public recruiter contact information; they remain local.
Exported jobs use an explicit field allowlist and omit full job descriptions,
contact fields and classification excerpts. Summaries link to original sources.
The CSV escapes leading formula characters for spreadsheet viewers.

Normalization verifies every raw body hash before accepting an observation.
Repeated observations deduplicate by source/post/evidence. Job identity is
source plus post ID; Baidu aliases use requisition ID **with exact location and
hiring type**, preserving distinct city/type postings. Conflicting publication
dates are retained as candidates and excluded from date cohorts. Invalid/future
dates never become first-seen dates. Exact cross-source matches are only review
candidates; fuzzy matching does not silently collapse jobs.

Classification requires `Agent`/`智能体` together with nearby LLM context, or an
explicit AI/LLM title. Generic insurance and monitoring agents are excluded;
RAG-only roles are not silently counted as Agent roles. Mainland eligibility is
based on listed location/country; a multi-location posting is counted once if it
offers a mainland location. `role` and `agent_relationship` separate job families
and indications of building/using agents. Skill rules retain local evidence and
distinguish preferred requirements from other mentions. These are transparent
heuristics, **not individually human-reviewed labels**.

Candidate versions include input-record hashes, captured configurations,
taxonomy and Python producer hashes. The manifest hashes every exported file.
Offline reruns with identical inputs and producer code reproduce the same version
and file bytes. DuckDB is rebuildable, not the canonical raw source. Keep raw
snapshots and run metadata when retaining a dataset.

## Boundaries and future operation

HTTP is anonymous HTTPS with a descriptive user agent, at least one second
between requests to a host, 25-second timeouts and an 8 MB response limit. Robots
rules are checked; inaccessible policies and challenges fail closed. This does
not grant redistribution rights or claim comprehensive source access. The
pipeline does not harvest accounts, cookies, tokens, resumes or login data.

The pipeline is intentionally a single-process batch application. A future
scheduler can invoke the same CLI in a container with a persistent data volume
and an exclusive writer lease. Keep collection and editorial promotion separate.
CloudFormation, cloud storage, scheduling, monitoring and production publication
are outside this local version.

To obtain a defensible historical demand trend, add authorized historical exports
or contemporaneous archived feeds with measured coverage. For future trends,
retain repeated fixed-source observations and distinguish first baseline stock,
subsequent appearances, disappearances and source outages. Do not interpret an
expanded keyword list or newly added source as market growth.
