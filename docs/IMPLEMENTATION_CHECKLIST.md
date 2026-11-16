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
- [ ] Register both Forge apps in a Developer Space.
- [ ] Run authenticated Forge lint and install both apps. Verify create/update events, UI, Jira and Rovo in a real environment.
- [ ] Deploy production and test both generated judge links.
- [ ] Record a working demo, publish it to YouTube and complete the Devpost entry.

The preview covers same-repository JSON assertions. A general Docker execution service, external model adapters and automatic cross-product Jira context are outside the delivered preview.
