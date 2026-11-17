# AegisPR V3 — Codegeist 2026

**Don't just review a pull request. Verify the evidence.**

AegisPR brings evidence-based review into a Bitbucket Cloud pull request. It scans added lines, records the PR's base and head commits, runs the destination commit's JSON assertions against both revisions, and shows the results in the PR overview. An optional Jira Forge app lets an authorized reviewer publish a bounded evidence snapshot on a related issue and ask **Aegis Review Assistant** to explain it.

## Live and local workflows

Both Forge apps are deployed to production. Development installations verified automatic and manual Bitbucket reviews, Jira snapshot sharing, and a live Rovo explanation. See the [judge installation links](docs/JUDGE_INSTALLATION.md) and [test report](docs/TEST_REPORT.md).

| Component | Where it runs | What it does |
| --- | --- | --- |
| Review panel | Bitbucket PR overview | Starts and retries reviews. Shows exact revisions, static findings, check outcomes, and recent runs. |
| Review worker | Bitbucket Forge installation | Subscribes to PR create/update events, reads Bitbucket REST APIs, processes a durable queue and saves evidence in Forge storage. |
| Jira companion | Jira issue panel | Reads Jira issue context, accepts an explicitly shared snapshot, and creates a follow-up when requested. |
| Aegis Review Assistant | Rovo in Jira | Has three read-only actions for the saved report, assertion evidence and Jira issue context. |
| Evidence workspace | Self-hosted Next.js and FastAPI | Preserves the V2 interface, fixtures, proof, repair, benchmark, resource and model screens. Accepts an explicitly imported Bitbucket snapshot. |

The verifier supports same-repository JSON contract checks. It runs on Forge CPU with no external model, remote backend, Docker daemon or provider key. A confirmed regression is limited to a listed assertion that passed at base and failed at head. A PR without supported tests can still receive static findings.

## Run the workspace

Use the [workspace setup](docs/WORKSPACE.md) to run the UI, API, fixtures and benchmarks locally. The standalone workspace is optional for Bitbucket and Jira users.

## Run the Forge checks

Requires Node.js 22, npm, Git and Bash.

```sh
npm ci
npm ci --prefix apps/forge
npm ci --prefix apps/jira
npm --prefix apps/forge run test
npm --prefix apps/jira run test
npm --prefix apps/forge run typecheck
npm --prefix apps/jira run typecheck
npm --prefix apps/forge run build
npm --prefix apps/jira run build
npm run validate:manifests
```

[Setup and fixture walkthrough](docs/SETUP.md) · [Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY.md) · [Judge guide](docs/JUDGE_INSTALLATION.md) · [Devpost materials](docs/DEVPOST_SUBMISSION.md)

V3 builds on the evidence-first workflow and coupon example from [AegisPR V2](https://github.com/Hari-Aditya-003/AegisPR-V2-Apart-Research). See the [prior-work disclosure](docs/V2_TO_V3_CHANGES.md). The MIT license and copyright are in [LICENSE](LICENSE).
