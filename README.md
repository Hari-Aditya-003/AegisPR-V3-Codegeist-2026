# AegisPR V3 — Codegeist 2026

**Don't just review a pull request. Verify the evidence.**

**[Open the live V3 website](https://aegispr-v3.snap-hub.workers.dev/)** · **[Run a live fixture](https://aegispr-v3.snap-hub.workers.dev/#run-fixture)** · **[Watch the 3:02 demo](https://www.youtube.com/watch?v=oG6BR9BGm2U)** · **[Install the Forge apps](docs/JUDGE_INSTALLATION.md)**

AegisPR brings evidence-based review into a Bitbucket Cloud pull request. It scans added lines, records the PR's base and head commits, runs the destination commit's JSON assertions against both revisions, and shows the results in the PR overview. An optional Jira Forge app lets an authorized reviewer publish a bounded evidence snapshot on a related issue and ask **Aegis Review Assistant** to explain it.

## Live and local workflows

Both Forge apps are deployed to production. Development installations verified automatic and manual Bitbucket reviews, Jira snapshot sharing, and a live Rovo explanation. See the [judge installation links](docs/JUDGE_INSTALLATION.md), [test report](docs/TEST_REPORT.md), and [public demo](https://www.youtube.com/watch?v=oG6BR9BGm2U).

| Component | Where it runs | What it does |
| --- | --- | --- |
| Review panel | Bitbucket PR overview | Starts and retries reviews. Shows exact revisions, static findings, check outcomes, and recent runs. |
| Review worker | Bitbucket Forge installation | Subscribes to PR create/update events, reads Bitbucket REST APIs, processes a durable queue and saves evidence in Forge storage. |
| Jira companion | Jira issue panel | Reads Jira issue context, accepts an explicitly shared snapshot, and creates a follow-up when requested. |
| Aegis Review Assistant | Rovo in Jira | Has three read-only actions for the saved report, assertion evidence and Jira issue context. |
| Evidence workspace | Self-hosted Next.js and FastAPI | Preserves the V2 interface, fixtures, proof, repair, benchmark, resource and model screens. Accepts an explicitly imported Bitbucket snapshot. |

The verifier supports same-repository JSON contract checks. It runs on Forge CPU with no external model, remote backend, Docker daemon or provider key. A confirmed regression is limited to a listed assertion that passed at base and failed at head. A PR without supported tests can still receive static findings.

## Start with the website

1. Open [AegisPR V3](https://aegispr-v3.snap-hub.workers.dev/) and select **Try a live fixture**.
2. Select **Run safe example** to execute six checks using the committed fixture. Open **Proof** and select **Verify receipt**.
3. Run **Verify fixture repair** on the coupon example or read the [getting-started guide](https://aegispr-v3.snap-hub.workers.dev/guide).
4. Open [Atlassian integrations](https://aegispr-v3.snap-hub.workers.dev/atlassian) for the Bitbucket and Jira install guide. Explore [benchmarks](https://aegispr-v3.snap-hub.workers.dev/benchmarks) and [models and limits](https://aegispr-v3.snap-hub.workers.dev/settings).

Public fixtures, proof and prewritten repairs are available without credentials. Owner access is required for pinned GitHub review, imports and benchmark runs. Use the [local workspace setup](docs/WORKSPACE.md) to run the entire workspace on your machine, or the [web deployment guide](docs/WEB_DEPLOYMENT.md) to operate it under your own HTTPS origin.

## Project history

| Version | Source and release |
| --- | --- |
| V1 | [Original repository](https://github.com/Hari-Aditya-003/AegisPR) · [Original website](https://hari-aditya-003.github.io/AegisPR/) |
| V2 | [Apart Research repository](https://github.com/Hari-Aditya-003/AegisPR-V2-Apart-Research) · [V2 walkthrough](https://github.com/Hari-Aditya-003/AegisPR-V2-Apart-Research/releases/tag/v2.0.0-walkthrough.1) |
| V3 | [Release history](https://github.com/Hari-Aditya-003/AegisPR-V3-Codegeist-2026/releases) · [Codegeist changes and attribution](docs/V2_TO_V3_CHANGES.md) |


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
