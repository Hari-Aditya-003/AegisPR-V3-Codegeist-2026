FROM node:22-bookworm-slim AS node-runtime

FROM node-runtime AS frontend-build
WORKDIR /workspace
COPY apps/workspace/package*.json ./
RUN npm ci
COPY apps/workspace/ ./
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL="" AEGISPR_STANDALONE=1
RUN npm run build

FROM node-runtime AS frontend
WORKDIR /workspace
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=frontend-build --chown=node:node /workspace/.next/standalone ./
COPY --from=frontend-build --chown=node:node /workspace/.next/static ./.next/static
COPY --from=frontend-build --chown=node:node /workspace/public ./public
USER node
CMD ["node", "server.js"]

FROM python:3.12-slim-bookworm AS api
WORKDIR /srv/aegispr
ENV PYTHONPATH=/srv/aegispr/backend PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
RUN apt-get update && apt-get install --no-install-recommends -y git && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 aegispr && useradd --uid 10001 --gid 10001 --create-home aegispr \
    && install -d -o aegispr -g aegispr -m 0700 data
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app backend/app
COPY evals evals
USER aegispr
CMD ["uvicorn", "app.v2.api:app_factory", "--factory", "--host", "0.0.0.0", "--port", "8300", "--no-access-log", "--no-proxy-headers"]
