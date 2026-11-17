# V2 provenance and new Codegeist work

AegisPR began before Codegeist. V3 development began November 16, 2026 and uses a new repository and independent release history. The [original V2 repository at 6b41fb5](https://github.com/Hari-Aditya-003/AegisPR-V2-Apart-Research/tree/6b41fb584f5b198ec9245b3d29b24ce462755296) remains available under its original MIT license.

| V2 capability | Treatment in V3 |
| --- | --- |
| Next.js workspace, landing page, colors, shield, review layout, resource rail and guide | Reused the V2 interface and assets in `apps/workspace`. Updated branding and documentation for V3 and added the Atlassian page. |
| FastAPI pinned GitHub reviews, static analysis, file coverage, SARIF, feedback and GitHub App publishing | Reused and adapted the workspace implementation in `backend/app/v2`. GitHub reads are restricted to the configured public repositories, and optional publishing is operator-controlled. |
| Repeated execution, repair verification and signed evidence | Retained the committed Python and JavaScript fixtures, prewritten repairs, CPU executor and local Ed25519 signing. The new Bitbucket import validates the snapshot and signs the local copy. |
| Benchmark dashboard and results | Retained the 12-case dataset and imported the published November 13 V2 summary. Fresh V3 suite results are computed by executing the committed fixtures. |
| Models and cost settings | Retained provider configuration, specialist routing, usage accounting and consent controls. V3 advisory calls receive bounded review metadata and return predefined guidance with validated citations. |
| Docker fixture worker and optional CPU/CUDA ranking service | Ported the worker for committed fixtures and the optional ranking service. Docker and CUDA require separately provisioned infrastructure. |
| Differential comparison and coupon scenario | Reused the base/head comparison method and adapted the pricing example into a new declarative JSON contract demo in Forge. |

New Codegeist work includes two Forge apps, the Bitbucket PR overview panel and PR events, the Bitbucket REST adapter, revision-aware queue and retention, declarative verification of real Bitbucket commits, the Jira issue panel and snapshot publishing, the Rovo agent and three actions, and the importer that connects the native report to the workspace. The preview supports committed fixture execution, static GitHub review and declarative Bitbucket checks. The legacy general-purpose executor and generated executable reproducers are outside this preview.

The import used an explicit source-file list. V2 credentials, private logs, local settings and deployment state were excluded. See the [V3 commit history](https://github.com/Hari-Aditya-003/AegisPR-V3-Codegeist-2026/commits/main/), [test report](TEST_REPORT.md), and [Codegeist rules](https://codegeist2026.devpost.com/rules).
