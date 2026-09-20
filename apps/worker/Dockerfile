FROM node:22-alpine
WORKDIR /workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/tsconfig.json ./apps/worker/
RUN corepack enable && pnpm install --frozen-lockfile
COPY apps/worker/src ./apps/worker/src
RUN pnpm --filter @taqaddum/worker build
CMD ["node", "apps/worker/dist/main.js"]
