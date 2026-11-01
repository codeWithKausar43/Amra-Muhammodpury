# Production Multi-Stage Dockerfile for Fastify Backend

FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace dependencies
COPY package.json pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

# Install dependencies
RUN pnpm install --filter backend... --frozen-lockfile

# Copy backend source & prisma schema
COPY backend ./backend

WORKDIR /app/backend

# Generate Prisma Client & compile TypeScript
RUN pnpm prisma:generate
RUN pnpm build

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Non-root user for security
USER node

COPY --chown=node:node --from=builder /app/backend/dist ./dist
COPY --chown=node:node --from=builder /app/backend/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/backend/package.json ./package.json

EXPOSE 5000

CMD ["node", "dist/server.js"]
