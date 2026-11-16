# Devpost submission draft

## AegisPR V3 — Codegeist 2026

**Don't just review a pull request. Verify the evidence.**

A pull request can contain an obvious static issue, a plausible concern, a reproducible failure, or a clean result across a limited set of checks. Reviewers need to know which kind of evidence they have before they merge. AegisPR V3 puts that evidence on the pull request itself.

When a Bitbucket pull request is created or updated, a Forge event schedules a review. The panel shows changed files, static findings, exact base and head commits, and the outcome of any supported test. The CPU verifier reads the same destination-defined JSON assertions at both revisions. The coupon demo shows three distinct outcomes against real Git commits: one assertion passes on base and fails on head, all configured checks pass, and verification is inconclusive because the checked file is unavailable on head.

A separate Forge companion reads the Jira work item's actual context. A reviewer can share a bounded copy of the Bitbucket report on a related issue and create a follow-up explicitly. Aegis Review Assistant uses three read-only actions to explain that snapshot, show exact check outcomes, and retrieve the issue context under Jira's permissions.

**Category** · Apps for Software Teams

**Intended bonus** · Best Agents — Rovo/Assignable Agents. A Forge `rovo:agent` and three `action` modules are implemented. Platform deployment and live action invocation still need to be demonstrated before the bonus is claimed.

**New Codegeist work** · Rebuilt the workflow for Forge and Bitbucket, developed a new CPU assertion engine, added the Jira and Rovo companion, and wrote new event and integration tests. The evidence-first principle and coupon scenario were adapted from AegisPR V2. [Prior-work disclosure](V2_TO_V3_CHANGES.md)

**Verification** · Both app builds, both manifest validations, and local review and Jira/Rovo action tests are documented in the [test report](TEST_REPORT.md). Tests use real Git fixture commits and simulated product responses. The public preview supports JSON assertions and same-repository verification. General sandboxing and external model providers are future work.

## Submission checklist

- [x] Independent V3 source, dated commit history, license and prior-work disclosure
- [x] Forge modules and local tests
- [x] Setup, security, test report, judge guide, and [demonstration script](DEMO_SCRIPT.md)
- [ ] Live Bitbucket panel, create and update events, and Jira/Rovo invocation verified
- [ ] Production installations shared and links tested by an external administrator
- [ ] Video recorded in a working installation, publicly uploaded to YouTube and linked here
- [ ] Entrant reviews Codegeist eligibility and submits through Devpost

The deadline in the official rules is December 22, 2026 at noon Pacific, which is **December 23, 2026 at 1:30 a.m. IST**. Use the [official Codegeist rules](https://codegeist2026.devpost.com/rules) for entrants, distribution requirements, video and submission details.
