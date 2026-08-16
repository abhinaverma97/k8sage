# syntax=docker/dockerfile:1
# Build context must be the repository root:
#   docker build -f apps/evidence/Dockerfile .
ARG PACKAGE=@k8sage/evidence

FROM node:22-alpine AS builder
ARG PACKAGE
RUN npm install -g pnpm@11.9.0
WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/evidence/package.json apps/evidence/package.json
COPY apps/sage/package.json apps/sage/package.json
COPY apps/gateway/package.json apps/gateway/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN pnpm install --frozen-lockfile

COPY apps/evidence apps/evidence
COPY apps/sage apps/sage
COPY apps/gateway apps/gateway
COPY apps/frontend apps/frontend
RUN pnpm --filter ${PACKAGE} build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /repo/apps/evidence/dist/index.cjs ./index.cjs
EXPOSE 8082
CMD ["node", "index.cjs"]
