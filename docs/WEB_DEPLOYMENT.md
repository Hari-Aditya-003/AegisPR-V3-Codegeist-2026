# Public website and workspace deployment

[AegisPR V3](https://aegispr-v3.snap-hub.workers.dev/) serves the V2-style Next.js workspace and FastAPI evidence service from the same HTTPS origin. Start with [a live fixture](https://aegispr-v3.snap-hub.workers.dev/#run-fixture) or follow the [online guide](https://aegispr-v3.snap-hub.workers.dev/guide). The public fixture catalog, proof and receipt verification, prewritten fixture repair, and published benchmark reference are available without an account.

Owner operations include GitHub PR reviews, imports, benchmark runs, and model configuration. The hosted demo uses curated CPU fixtures and keeps external model providers disabled. Bitbucket, Jira, and Rovo run on their respective Forge installations. [Judge installation](JUDGE_INSTALLATION.md)

## Run the stack on your own host

Use Docker Engine with Compose v2. Dependencies are built from the lockfiles and requirements in the source checkout. From the repository root, create an ignored environment file and start the isolated V3 project.

```sh
umask 077
test -f .env.web || printf 'API_ACCESS_TOKEN=%s\n' "$(openssl rand -hex 32)" > .env.web
docker compose --env-file .env.web -p aegispr-v3 -f deploy/web/compose.yml up -d --build
curl -fsS http://127.0.0.1:18203/health
bash deploy/web/smoke.sh http://127.0.0.1:18203
```

Open the loopback gateway at http://127.0.0.1:18203. The owner can supply the value of `API_ACCESS_TOKEN` through **Private deployment access**. Keep the file private. If enabling allowlisted GitHub PR reads on your own instance, set `V2_ALLOWED_REPOSITORIES` as described in the [workspace guide](WORKSPACE.md).

The gateway publishes only a loopback listener. The API and frontend share a private container network. The API mounts a persistent named volume for review data and the Ed25519 signing key. Keep that volume when upgrading, and protect backups of it. Re-run Compose with `up -d --build` from a verified release to update. Rebuild a previously verified tag to roll back. Stop with `docker compose --env-file .env.web -p aegispr-v3 -f deploy/web/compose.yml --profile cloudflare stop` to retain the stored evidence.

## Publish behind Cloudflare

The public demo uses a named Cloudflare Tunnel attached to a VPC Service for the gateway. The gateway and connector share a separate Docker network. The VPC binding targets only `workspace-gateway.internal:8080`. The public address remains stable when the connector restarts. Availability depends on the origin host and the connector. Cloudflare currently documents Workers VPC as beta. [Cloudflare Workers VPC setup](https://developers.cloudflare.com/workers-vpc/get-started/)

1. Create a named tunnel. Store its connector token in an owner-readable secret file, outside version control. Set `AEGISPR_TUNNEL_TOKEN_FILE` in `.env.web` to that file's absolute path and set `AEGISPR_HOST_UID` and `AEGISPR_HOST_GID` to the file owner's IDs if they differ from 1000.
2. Start the connector with `docker compose --env-file .env.web -p aegispr-v3 -f deploy/web/compose.yml --profile cloudflare up -d`. Confirm the tunnel registers healthy QUIC connections.
3. Create an HTTP VPC Service through that tunnel, using `workspace-gateway.internal` on port `8080`. Keep all other services off that binding.
4. Copy `deploy/web/wrangler.example.toml` to the ignored `deploy/web/.env.wrangler.toml`. Choose your Worker name and replace the binding ID with your own VPC Service ID.
5. Set `AEGISPR_PUBLIC_URL` in `.env.web` to the canonical HTTPS origin and re-run Compose if the hostname differs from the default. Authenticate Wrangler and deploy with `npx wrangler@4.147.0 deploy --config deploy/web/.env.wrangler.toml`.
6. Run `bash deploy/web/smoke.sh https://your-worker.your-subdomain.workers.dev`. It checks navigation, authentication requirements, six executed fixture checks, receipt verification, and three repair repetitions.

The public gateway accepts workspace routes. GitHub webhook ingress and the optional Docker fixture worker have separate operator setup. The public application runs fixed committed fixtures inside its resource-limited API container. It does not mount a Docker socket.

[Repository source](https://github.com/Hari-Aditya-003/AegisPR-V3-Codegeist-2026) · [Test evidence](TEST_REPORT.md)
