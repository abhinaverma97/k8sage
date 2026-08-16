# syntax=docker/dockerfile:1
# Build context must be the repository root:
#   docker build -f apps/frontend/Dockerfile .

FROM node:22-alpine AS builder
RUN npm install -g pnpm@11.9.0
WORKDIR /repo

# Same-origin in production (Caddy routes /api to the gateway NodePort), so the
# default is empty. For local runs, pass e.g. --build-arg NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
ARG NEXT_PUBLIC_GATEWAY_URL=
ENV NEXT_PUBLIC_GATEWAY_URL=$NEXT_PUBLIC_GATEWAY_URL

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/evidence/package.json apps/evidence/package.json
COPY apps/sage/package.json apps/sage/package.json
COPY apps/gateway/package.json apps/gateway/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN pnpm install --frozen-lockfile

COPY apps/frontend apps/frontend
COPY apps/evidence apps/evidence
COPY apps/sage apps/sage
COPY apps/gateway apps/gateway
RUN pnpm --filter @k8sage/frontend build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
# Next standalone binds to $HOSTNAME by default (Docker sets it to the
# container ID); force 0.0.0.0 so k8s probes / service routes work.
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=builder /repo/apps/frontend/.next/standalone ./
COPY --from=builder /repo/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /repo/apps/frontend/public ./apps/frontend/public
EXPOSE 3000
CMD ["node", "apps/frontend/server.js"]
