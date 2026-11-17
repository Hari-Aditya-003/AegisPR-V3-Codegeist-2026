# Implementation checklist

- [x] Read the November 2026 Codegeist rules and current Forge references.
- [x] Inspect V2 source, branches, tests, license, tags and releases. Record reuse.
- [x] Create an independent GitHub repository and versioned preview.
- [x] Phase 1 · Build a Bitbucket PR overview panel, resolver and manifest.
- [x] Phase 2 · Implement PR event ingestion, REST adapter, queue, deduplication, retries and stored review status.
- [x] Phase 3 · Implement static rules and a bounded base/head JSON verification path. Execute all three Git-backed fixtures locally.
- [x] Phase 4 · Implement Jira issue reads, explicit snapshot sharing and authorized follow-up creation in a Jira companion.
- [x] Phase 5 · Implement and locally test Aegis Review Assistant's three read-only actions.
- [x] Phase 6 · Implement review, evidence, status, recent runs and Jira Rovo entry point.
- [x] Prepare developer, judge, Devpost and recording materials.
- [x] Confirm Forge login, provision an active Jira/Rovo site, and open the three Bitbucket test PRs against a shared Jira requirement.
- [x] Register both Forge apps in a Developer Space.
- [x] Run authenticated Forge lint and install both apps. Verify create/update events, UI, Jira and Rovo in a real environment.
- [x] Deploy both Forge apps to production and verify the generated judge links reach the installation pages.
- [x] Port the V2 workspace, curated execution, signed proof, repair, model controls and benchmarks.
- [x] Deploy the [public V3 website](https://aegispr-v3.snap-hub.workers.dev/) and verify fixture execution, signed proof, and repair end to end.
- [ ] Confirm the installation links with an independent administrator.
- [x] Publish the [demonstration video](https://www.youtube.com/watch?v=oG6BR9BGm2U) and save the Devpost draft.
- [ ] Accept the competition rules and submit the entry.

The native Forge verifier covers same-repository JSON assertions. The workspace adds trusted Python and JavaScript fixtures and optional provider-backed review guidance. Bitbucket evidence can be shared with Jira or imported into the workspace by the reviewer.
