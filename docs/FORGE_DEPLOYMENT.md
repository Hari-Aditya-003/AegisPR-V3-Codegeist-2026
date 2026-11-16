# Deploy to Atlassian Forge

## Prerequisites

- A supported Node.js release. Use Node.js 22.23.4 or newer within the 22.x line for Forge CLI 15.1.
- An Atlassian account and Forge API token. Keep the token in the CLI keychain or your organization's CI secret store.
- A **Bitbucket Cloud workspace administrator** and access to a test repository. The provisioned Codegeist Jira demo site does not provide this workspace.
- A Jira Cloud administrator and Rovo-enabled Jira for the companion. The Codegeist demo provisioning flow can supply a Jira and Rovo environment.

```sh
npm install -g @forge/cli
forge login
forge whoami
```

Use the Atlassian account email and a locally generated API token in the interactive prompt. For Jira/Rovo demo provisioning, run `forge site provision`. [Forge getting started](https://developer.atlassian.com/platform/forge/getting-started/) · [Codegeist demo provisioning](https://developer.atlassian.com/platform/forge/provision-a-demo-development-site/)

## Bitbucket app

On first deployment, register from `apps/forge`. The inline value allows Forge to parse the template during registration. The CLI replaces it with the real ID in the local manifest.

```sh
cd apps/forge
AEGISPR_BITBUCKET_APP_ID=ari:cloud:ecosystem::app/00000000-0000-4000-8000-000000000001 \
  forge register 'AegisPR V3 for Bitbucket'
```

Confirm the local manifest now contains the registered app ID. Reuse that ID on future deploys. If you restore the checked-in template, export the registered ID as `AEGISPR_BITBUCKET_APP_ID`.

Run these commands from `apps/forge`.

```sh
npm ci
npm run build
forge lint
forge deploy -e development
forge install --product bitbucket --site YOUR_WORKSPACE_SLUG -e development
```

To add Jira navigation links to the Bitbucket panel, set the optional hostname and redeploy that environment.

```sh
forge variables set -e development AEGISPR_JIRA_SITE your-site.atlassian.net
forge deploy -e development
```

Install as a workspace administrator, then create a fresh seeded PR. Expand AegisPR V3 and wait for the event-driven run. Make a commit on the PR branch, confirm the displayed head changes, and try manual review. Check `forge logs -e development` for invocation errors. [Bitbucket Forge setup](https://developer.atlassian.com/platform/forge/build-a-hello-world-app-in-bitbucket/) · [CLI install](https://developer.atlassian.com/platform/forge/cli-reference/install/)

## Jira and Rovo companion

From the repository root, open `apps/jira` and register a separate app once.

```sh
cd apps/jira
AEGISPR_JIRA_APP_ID=ari:cloud:ecosystem::app/00000000-0000-4000-8000-000000000002 \
  forge register 'AegisPR V3 for Jira'
```

Confirm the local manifest contains the real Jira app ID. If you restore the checked-in template, export that ID as `AEGISPR_JIRA_APP_ID`. Continue from `apps/jira`.

```sh
npm ci
npm run build
forge lint
forge deploy -e development
forge install --product jira --site YOUR_SITE.atlassian.net -e development
```

For an account with a provisioned Codegeist site, substitute `forge install --demo-site --product jira -e development`. Verify that the Jira issue panel shows a real issue, paste and publish a current Bitbucket snapshot that references its issue key, and invoke **Aegis Review Assistant**. Confirm that the report and evidence tool outputs contain the PR ID, exact revisions, and recorded outcomes. Open an issue with no snapshot and confirm the assistant reports that absence. Rovo availability and policy depend on the Atlassian site. [Rovo Forge guide](https://developer.atlassian.com/platform/forge/build-a-hello-world-rovo-agent/)

## Public judge sharing

After live development checks, deploy each registered app with `forge deploy -e production`. In [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/), select each app, open **Distribution**, choose **Sharing**, select its target product and save. Copy each generated installation URL and test it as an administrator outside the developer organization. Add the tested URLs to [Judge installation](JUDGE_INSTALLATION.md). [Forge distribution instructions](https://developer.atlassian.com/platform/forge/distribute-your-apps/#start-sharing-your-app)
