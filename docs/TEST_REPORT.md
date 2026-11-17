# Test report

**Local run on November 16, 2026** · Node.js 22.23.5 · macOS arm64.

| Command | Observed result |
| --- | --- |
| `npm ci` in the root, `apps/forge`, and `apps/jira` | All three lockfiles installed successfully |
| `npm --prefix apps/forge run typecheck` and `npm --prefix apps/jira run typecheck` | Both passed |
| `npm --prefix apps/forge run test` | 13 passed |
| `npm --prefix apps/jira run test` | 5 passed |
| `npm --prefix apps/forge run build` and `npm --prefix apps/jira run build` | Both built production Custom UI assets |
| `npm run validate:manifests` | Both passed Atlassian SDK validation with local synthetic IDs |
| `forge lint` after registration | Both apps passed authenticated Forge lint |

The Forge test suite creates real Git commits and uses `git show` and `git diff` as the local source. Local responses exercise the Bitbucket API adapter, queue-consumer logic, event identity, retry exhaustion, authorization gating, report history, static rules, size limits, and missing or unsupported inputs. The Jira suite uses simulated responses to verify the three Rovo actions, denied access, snapshot validation and write operations. These checks do not exercise a deployed Atlassian tenant.

## Executed commit comparisons

Base in the recorded run was `846e129f7597cacd25e1a9e86033ba3af75f52f1`. This table is derived from the evidence records printed by the test command.

| Case | Head | Coupon total at base / head | Currency at base / head | Verdict |
| --- | --- | --- | --- | --- |
| Regression | `27921f82afeb8fe326c57d7aa7e4e7b9cab5d99b` | pass / fail | pass / pass | confirmed-regression |
| Clean | `6b954cdf5b3945474492705218f285f3451cbc2d` | pass / pass | pass / pass | no-regression-in-executed-checks |
| Inconclusive | `4238cdd4d5d949248eb9152b6dea88eceae80ce1` | pass / unavailable | pass / unavailable | inconclusive |

## Live Atlassian validation

Both Forge apps were registered, passed authenticated lint, deployed to development, and installed in a Bitbucket Cloud demo workspace and a Jira/Rovo demo site. Both also deployed to production successfully. Their generated judge URLs opened to the correct product permissions pages.

| Live action | Observed result |
| --- | --- |
| Run the coupon regression PR from the Bitbucket panel | Base `94d1ad561dc5`, head `934e56fc5ae3`. The coupon total assertion passed on base and failed on head. Currency passed on both. |
| Update the clean PR title after installation | The update event ran a review. Both assertions passed. |
| Open a fresh same-repository PR after installation | The create event ran a review and both assertions passed, with no manual action. |
| Run the PR that moved the checked file | Base passed and the head assertions were unavailable. The UI reported inconclusive. |
| Share the regression snapshot on Jira | The Jira issue panel showed the issue and the saved reviewer-shared evidence. |
| Ask Aegis Review Assistant about the result | Rovo cited Jira requirement `PLAT-33510`, the exact abbreviated revisions, the failed coupon check and the passing currency check. |
| Open both production installation links | Both Forge permissions pages loaded. A separate administrator has yet to complete installation. |

Jira follow-up authorization and request handling are covered locally. The live verification shared a report on the demo issue and used Rovo. [Install guide](JUDGE_INSTALLATION.md)

## Restored V2 workspace

| Command or action | Observed result |
| --- | --- |
| `npm --prefix apps/workspace run typecheck` | Passed |
| `npm --prefix apps/workspace test` | 17 passed |
| `npm --prefix apps/workspace run build` | Production build passed |
| `npm --prefix apps/workspace audit --omit=dev` | Zero runtime dependency vulnerabilities reported |
| `PYTHONPATH=backend .venv/bin/python -m pytest -q backend/tests` | 6 passed |
| `PYTHONPATH=. ../.venv/bin/python -m pytest -q` from `gpu-worker/` | 7 CPU-side tests passed |
| Run a fixture from Chrome, open Proof, then verify a repair | Six base/head execution records and a valid Ed25519 receipt. All three repair executions passed. |
| Start one benchmark pass in Chrome | 12 observations completed from 72 base/head executions. Eight regressions reproduced and three cases abstained. These counts apply to the curated suite. |
| Import the real Bitbucket regression export in Chrome | Both assertions and the Jira key matched Bitbucket. The workspace verified the local receipt. |
| Submit [V2 PR 6](https://github.com/Hari-Aditya-003/AegisPR-V2-Apart-Research/pull/6) to the allowlisted local API with pinned revisions | 12 changed files accounted for, six static findings, `ANALYSIS_ONLY`, and a valid signed receipt. |

Python tests emitted a Starlette TestClient deprecation warning. Provider calls, GitHub check publishing, and optional Docker/CUDA infrastructure were outside this execution run. The workspace was verified on loopback. [Workspace setup](WORKSPACE.md)

## Demo artifact

The published walkthrough uses captures from the live development installations and the locally verified workspace. The source MP4 decoded without errors and contains 1920 × 1080 H.264 video and AAC narration. Its measured duration is 181.23 seconds. YouTube Studio reported Public visibility and completed HD processing. The public YouTube metadata endpoint returned the correct title without authentication. [Public walkthrough](https://www.youtube.com/watch?v=oG6BR9BGm2U)

## Public website validation · November 17, 2026

The V3 website and API were published to the same HTTPS origin via the V3 Cloudflare Worker, named tunnel, and a dedicated Compose stack. `bash deploy/web/smoke.sh` verified the homepage, guide, benchmark, settings, and Atlassian routes, and confirmed that anonymous requests to owner endpoints receive HTTP 401. It executed a coupon fixture, observed six base/head check records, verified its Ed25519 receipt, and observed three passing repair repetitions. A separate Chrome run reached the same result through the interface. [Public website](https://aegispr-v3.snap-hub.workers.dev/) · [Web deployment](WEB_DEPLOYMENT.md)
