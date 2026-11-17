# Security boundaries

- Forge supplies product authentication and installation-scoped storage. Bitbucket status and manual runs first read PR metadata through the current user's product permissions. The backend derives identifiers from Forge context and validates UUIDs and PR IDs.
- Workspace events run as the app using documented read scopes. No arbitrary public web trigger or remote execution endpoint is exposed. The app does not write to repositories, approve merges or run subprocesses.
- Only bounded, destination-defined JSON assertions are interpreted in a worker. Files are loaded from pinned hashes. The verifier rejects traversal, limits document sizes and assertion counts, and never follows a repo-provided command or URL. Diff findings omit original line text.
- Stored Bitbucket reports contain revision IDs, timestamps, short messages, file metadata, and result classifications. Raw diffs, secrets, PR descriptions, and inspected values are excluded. Forge KVS records expire after 30 days, and UI reads exclude older attempts.
- Jira transfer is intentional and permissioned. A published snapshot is visible to the issue's readers and can be changed by authorized Jira issue editors. Share it only on a Jira issue whose audience may see that information. The import is bounded and schema-checked, but it does not cryptographically authenticate the Bitbucket source. Jira retains its issue property until overwritten or removed through Jira administration.
- Jira actions check access through `asUser()`, including Rovo reads. Agent actions are read-only. Jira writes require an explicit user control and Jira's update or create permission.
- Separate Bitbucket and Jira module packages keep scopes scoped to their installation. The default deployment has no outbound third-party inference calls or egress permission.

## Companion workspace

The optional workspace operates under a single owner access code for private review operations. Public routes allow only catalog fixtures and their results. Operators configure GitHub repositories by allowlist, keep the signing key and database outside version control, and explicitly enable external providers and check publishing. The fixture worker accepts catalog IDs and uses separately configured, digest-pinned images. A reviewer-supplied Bitbucket snapshot carries the source's verdict and readouts. A workspace signature vouches for the imported copy under its local key. Verify report origin through the live Bitbucket panel. [Operator configuration](WORKSPACE.md)
