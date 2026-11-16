# Demo script and recording checklist

Target length 4:35. Record after installing both apps and verifying the real PR and issue. Use a disposable Bitbucket repository and Jira issue with no sensitive contents.

| Time | Show | Narration |
| --- | --- | --- |
| 0:00–0:25 | A Bitbucket PR overview | “A pull request can look safe and still change behavior. AegisPR puts the evidence next to the change so the reviewer can see exactly what was checked.” |
| 0:25–0:55 | Expand the AegisPR panel | “This is a Forge panel inside Bitbucket. A PR event queued the analysis. Here are the destination and proposed revision, the changed files, and recent runs.” |
| 0:55–1:35 | Run review and show status, then open static findings | “A reviewer can run the same workflow manually. Static findings describe what the diff rules observed. Each finding includes a file and line when the diff provides both.” |
| 1:35–2:40 | Open the three seeded results | “The base version satisfies the coupon contract. The proposed version fails the total assertion. The currency assertion still passes. The clean PR passes both checks. When a checked file is missing, AegisPR records unavailable evidence and calls the review inconclusive.” |
| 2:40–3:25 | Show Jira issue and share snapshot | “The review identifies the Jira issue referenced by the PR. I'm deliberately sharing this snapshot with the issue's readers. Here's the actual Jira description for the requirement.” |
| 3:25–4:10 | Ask the agent and show real results | “Aegis Review Assistant reads the shared report and issue as the requester. It can name the failing assertion, explain the outcome, and say which evidence is missing.” |
| 4:10–4:35 | Return to the evidence table | “AegisPR gives the team a way to see what changed, what evidence it has, and what it still needs to verify before merging.” |

Before upload, confirm that the PR event, manual run, check names, timestamps, exact revisions and actual agent output are legible. Crop credentials, account identifiers and private repos. Verify spoken audio and final runtime. Upload publicly to YouTube, open the public URL signed out, and add it to Devpost. A recording and upload are pending.
