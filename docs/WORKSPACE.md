# AegisPR evidence workspace

The V3 repository includes the V2 Next.js interface, branding, resource rail, and FastAPI evidence service. It adds an Atlassian page that can import a saved Bitbucket report. Forge installations function independently.

## Open the public website

[Open AegisPR V3](https://aegispr-v3.snap-hub.workers.dev/). Run live CPU fixtures, verify signed proof and test prewritten repairs without an account. The owner code unlocks private workspace operations. [Public deployment guide](WEB_DEPLOYMENT.md)

## Start locally

Use Node.js 22.23.4 or newer within the 22.x line, Python 3.12, npm, Git and Bash. Run commands from the repository root.

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
npm ci --prefix apps/workspace
npm --prefix apps/workspace run build
```

In one Terminal, start the API:

```sh
PYTHONPATH=backend .venv/bin/uvicorn app.v2.api:app_factory --factory --host 127.0.0.1 --port 8300
```

In another Terminal, start the UI:

```sh
npm --prefix apps/workspace run start -- --hostname 127.0.0.1 --port 3300
```

Open [the local workspace](http://127.0.0.1:3300/). Reviews, receipts, and the signing key are kept in the ignored `data/` directory. The workspace uses ports 3300 and 8300 so the V2 default ports are available.

## Review and benchmark workflows

1. Open **Try a live fixture**. Choose a fixture and select **Run safe example**. Each run executes six checks before sealing its receipt.
2. On the result, use **Findings**, **Proof**, **Repair**, **Coverage**, and **Models**. For a reproduced fixture regression, **Verify fixture repair** runs the prewritten fix three times. Download the receipt or export the finding list as SARIF.
3. On **Benchmarks**, run one to three suite passes. The suite contains 12 committed cases. The public reference table is labeled with its V2 measurement date. New runs have their own fixture digest and report.
4. On **Atlassian**, paste a snapshot from the Bitbucket panel. **Proof** shows the imported outcomes. The workspace receipt authenticates the stored copy under the local key. Verify the report's origin on the Bitbucket PR.
5. On **Models & limits**, inspect the two-provider routing and the shared budget ledger. Default provider use is disabled. Enable it on the operator's backend and give consent per review.

## Operator configuration

Use a private root `.env` or environment variables. For any deployment beyond loopback, use TLS, configure trusted `ALLOWED_ORIGINS` and `NEXT_PUBLIC_API_URL`, set `APP_ENV=production`, and specify an `API_ACCESS_TOKEN` of at least 16 characters. The operator can enter this code under **Private deployment access**. Never use the development environment setting on a public network.

For GitHub, set `V2_ALLOWED_REPOSITORIES` to the comma-separated authorized public repositories. Enter the PR URL and both exact SHAs. An optional server-side `GITHUB_TOKEN` can increase read quota. GitHub App webhook signing and neutral check publishing require an owner-managed registration, an installation ID, and the appropriate app credentials. Publishing defaults off. The GitHub source-review path is static. It reads diffs and reports source observations.

For advisory calls, configure `V2_ENABLE_MODELS`, provider keys and the `V2_BUDGET_USD`, `V2_RUN_BUDGET_USD`, and `V2_MAX_CALLS` limits. The default budget is $1 aggregate and $0.03 per review, with at most three calls. Pricing shown in the workspace is a dated catalog and the ledger is an application-side estimate. Confirm current provider pricing before enabling paid use. Providers receive file names, coverage categories, line references and evidence IDs. The application displays advice selected from predefined labels. Model calls have no authority to execute or publish changes.

The default executor runs the project's committed Python and JavaScript fixtures using the local interpreters. An optional authenticated fixture worker on a trusted host can use pre-pulled, digest-pinned Docker images. Start it independently with `uvicorn app.v2.worker:app`, `V2_FIXTURE_IMAGE`, `V2_NODE_FIXTURE_IMAGE`, and a dedicated `V2_WORKER_TOKEN`. Set the API's `V2_WORKER_URL`, `V2_WORKER_TOKEN`, and independently trusted `V2_WORKER_PUBLIC_KEY` to use it. Bind the worker to a trusted interface. The workspace API does not require a Docker socket. The optional CUDA ranking service lives in `gpu-worker/`. Set its URL and token in the API to opt in. CPU ranking is available without a GPU. Host utilization is only displayed to an owner or when the operator explicitly enables it.

## Checks

```sh
PYTHONPATH=backend .venv/bin/python -m pytest -q backend/tests
npm --prefix apps/workspace run typecheck
npm --prefix apps/workspace test
npm --prefix apps/workspace run build
```

The [test report](TEST_REPORT.md) records the feature and deployment checks.
