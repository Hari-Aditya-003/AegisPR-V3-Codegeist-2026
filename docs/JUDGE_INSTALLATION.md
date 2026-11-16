# Judge installation

**Status** · Production deployment and installation links are pending Atlassian authentication. Use the [deployment guide](FORGE_DEPLOYMENT.md) to register and install from source on an administrator-controlled workspace today.

Once shared links are generated, the Bitbucket installation is the core workflow. Use the separate Jira installation for the issue context and Rovo segment. Both apps are Forge-hosted and require no external API keys.

1. Use a workspace admin account to authorize the Bitbucket app. It reads pull requests and source and uses installation-scoped Forge storage.
2. Seed a test repository and make a PR using [the demo procedure](SETUP.md). Open its **Overview**, expand **AegisPR V3**, then wait for the event-driven review. Use **Run review** if the initial event was sent before installation.
3. Check the base and head hashes and open **Base versus head evidence**. The regression PR should show one pass-to-fail assertion and one pass-to-pass assertion.
4. In a Rovo-enabled Jira test site, install the companion as a site admin. It reads Jira context as the viewer and writes issue properties or creates follow-ups only from explicit UI actions.
5. Add the real Jira issue key to the PR, run a review, open **Share evidence to Jira**, and copy the JSON. Paste it into the AegisPR issue panel on the referenced issue. Confirm the intended audience before sharing.
6. Ask **Aegis Review Assistant** which assertion failed and what evidence is still unavailable. Match the answer to the snapshot and verify the Jira requirement text directly in the issue.
7. Optionally select a project issue type and create a follow-up. A project with additional required fields may prevent creation. Use an issue type whose required fields can be satisfied by project defaults and the supplied summary and description.

If the overview panel is missing, verify the workspace and installed product. If no worker result appears after creating or updating a PR, check Forge logs and try a manual review. If verification is unavailable, confirm the base commit contains a readable `.aegispr.json` and that the PR is same-repository. If the Rovo button is absent, check whether Rovo is enabled and whether the Jira app was installed on the current site.
