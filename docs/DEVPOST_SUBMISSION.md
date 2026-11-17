# Devpost submission draft

## AegisPR V3 — Codegeist 2026

**Don't just review a pull request. Verify the evidence.**

A pull request can contain an obvious static issue, a plausible concern, a reproducible failure, or a clean result across a limited set of checks. Reviewers need to know which kind of evidence they have before they merge. AegisPR V3 puts that evidence on the pull request itself.

When a Bitbucket pull request is created or updated, a Forge event schedules a review. The panel shows changed files, static findings, exact base and head commits, and the outcome of any supported test. The CPU verifier reads the same destination-defined JSON assertions at both revisions. The coupon demo shows three distinct outcomes against real Git commits: one assertion passes on base and fails on head, all configured checks pass, and verification is inconclusive because the checked file is unavailable on head.

A separate Forge companion reads the Jira work item's actual context. A reviewer can share a bounded copy of the Bitbucket report on a related issue and create a follow-up explicitly. Aegis Review Assistant uses three read-only actions to explain that snapshot, show exact check outcomes, and retrieve the issue context under Jira's permissions.

**Category** · Apps for Software Teams

**Intended bonus** · Best Agents — Rovo/Assignable Agents. Aegis Review Assistant is deployed as a Forge `rovo:agent` with three read-only `action` modules. A live Rovo response cited the base and head revisions, the passing currency check, the failed coupon check, and the requirement from the Jira issue.

**New Codegeist work** · Rebuilt the workflow for Forge and Bitbucket, developed a new CPU assertion engine, added the Jira and Rovo companion, and wrote new event and integration tests. The evidence-first principle and coupon scenario were adapted from AegisPR V2. [Prior-work disclosure](V2_TO_V3_CHANGES.md)

**Verification** · Live Bitbucket runs covered confirmed regression, passing assertions and unavailable head evidence. A fresh PR and a title update each triggered a review. The optional workspace provides repeatable Python/JavaScript fixtures, signed reports, SARIF, manual fixture repair and a benchmark. Its provider routing is optional and advisory. [Test report](TEST_REPORT.md)

## Open and try AegisPR

[Live evidence workspace](https://aegispr-v3.snap-hub.workers.dev/) · [Getting started](https://aegispr-v3.snap-hub.workers.dev/guide) · [Install Bitbucket and Jira](JUDGE_INSTALLATION.md) · [YouTube demo](https://www.youtube.com/watch?v=oG6BR9BGm2U)

## Submission checklist

- [x] Independent V3 source, dated commit history, license and prior-work disclosure
- [x] Forge modules and local tests
- [x] Setup, security, test report, judge guide, and [demonstration script](DEMO_SCRIPT.md)
- [x] Demo workspace, three test PRs, and shared Jira requirement prepared
- [x] Live Bitbucket panel, create and update events, and Jira/Rovo invocation verified
- [x] Both production installation links shared and opened to permissions pages
- [ ] Confirm installation with an independent administrator
- [x] [Public demonstration video](https://www.youtube.com/watch?v=oG6BR9BGm2U) · 3:02, linked in the Devpost draft
- [ ] Entrant reviews the completed draft, accepts the Official Rules and Devpost Terms, and submits

The deadline in the official rules is December 22, 2026 at noon Pacific, which is **December 23, 2026 at 1:30 a.m. IST**. Use the [official Codegeist rules](https://codegeist2026.devpost.com/rules) for entrants, distribution requirements, video and submission details.
