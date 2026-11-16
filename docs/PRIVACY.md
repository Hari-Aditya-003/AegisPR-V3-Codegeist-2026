# AegisPR V3 privacy notice

AegisPR reviews changes in Bitbucket and helps reviewers share evidence in Jira. The Forge apps use Atlassian-hosted storage and Atlassian product APIs. Installation stays under the receiving workspace or site's administrator.

## Bitbucket

AegisPR reads pull request titles, descriptions, branch names, revisions, file changes, and the JSON files used by the configured checks. It retains limited review records in Forge storage scoped to the installation. Records can contain repository and PR identifiers, titles, branch names, paths, referenced Jira issue keys, timestamps, and review outcomes. Free-text metadata can contain names or other personal information. Reviews expire after 30 days and history is limited to six attempts per PR. Raw diffs, PR descriptions and checked values are processed in memory. AegisPR does not copy them into the stored report.

## Jira and Rovo

AegisPR reads the issue summary, status and description under the viewer's Jira permissions. An issue editor can copy a report into the issue's AegisPR property. That snapshot becomes visible to users permitted to browse the issue and remains there until someone with the appropriate permissions replaces or removes it. Aegis Review Assistant passes the authorized issue context and snapshot to Atlassian Rovo when invoked. A follow-up is written only through the issue panel's create action.

## Optional self-hosted workspace

The workspace operator controls its database, signing key and retention. The workspace can record explicitly imported Bitbucket snapshots and source-reviews of operator-allowlisted public GitHub PRs. Reviewers can opt in to send coverage metadata to configured model providers. The Forge apps run independently and send no review data to a self-hosted workspace unless a reviewer copies it there.

Contact the installing administrator for access and removal requests about the team's data. Use the project's [support page](https://github.com/Hari-Aditya-003/AegisPR-V3-Codegeist-2026/issues) for product questions. Keep private data out of public issues. [Atlassian’s hosted storage lifecycle](https://developer.atlassian.com/platform/forge/storage-reference/)
