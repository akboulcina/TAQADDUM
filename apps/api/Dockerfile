FROM node:22-alpine
WORKDIR /workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
RUN corepack enable && pnpm install --frozen-lockfile
COPY apps/api/src ./apps/api/src
RUN pnpm --filter @taqaddum/api build
CMD ["node","apps/api/dist/main.js"]
