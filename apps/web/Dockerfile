FROM node:22-alpine AS build
WORKDIR /workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/vite.config.ts apps/web/index.html ./apps/web/
COPY apps/web/src ./apps/web/src
COPY packages/design-tokens ./packages/design-tokens
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter @taqaddum/web build
FROM nginx:1.27-alpine
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html
