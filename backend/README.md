# Amra Muhammadpuri - Backend API Service

Production-ready REST API microservice built with **Fastify**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**.

---

## 1. Architecture & Layering

The backend is structured around a modular, domain-driven architecture:

```text
backend/
├── src/
│   ├── server.ts                 # Application entrypoint & graceful shutdown
│   ├── app.ts                    # Fastify app factory & plugin/route registration
│   ├── config/                   # Zod environment parsing, DB client, Pino logger
│   ├── modules/                  # Business domain modules (routes, controller, service, schema, types)
│   │   ├── auth/                 # Authentication & user onboarding
│   │   └── health/               # System liveness, readiness & metrics
│   ├── plugins/                  # Fastify plugins (CORS, Helmet, Swagger, Prisma)
│   ├── middleware/               # Centralized error handling & request hooks
│   ├── errors/                   # Custom HTTP error hierarchy (AppError)
│   ├── utils/                    # Standardized API response formatters
│   ├── constants/                # HTTP status codes & system constants
│   ├── types/                    # Shared TypeScript interfaces
│   ├── services/                 # Cross-module shared services
│   ├── repositories/             # Database access repositories (when needed)
│   └── jobs/                     # Background tasks and cron workers
├── prisma/
│   ├── schema.prisma             # Database models and relations
│   └── seed.ts                   # Initial database seeding script
├── tests/
│   ├── unit/                     # Isolated unit tests (Vitest)
│   └── integration/              # Fastify inject API integration tests
├── Dockerfile                    # Multi-stage production container image
├── docker-compose.yml            # Local PostgreSQL container definition
├── tsconfig.json                 # TypeScript strict compiler configuration
└── package.json                  # Scripts and dependencies
```

### Module Separation of Concerns

Each business module inside `src/modules/` adheres to strict single responsibilities:

- `*.routes.ts`: Declares Fastify routes and OpenAPI schemas.
- `*.controller.ts`: Parses HTTP requests, calls services, sends HTTP responses.
- `*.service.ts`: Implements pure business logic and transactional database logic.
- `*.schema.ts`: Zod validation schemas for requests and payloads.
- `*.types.ts`: Domain-specific TypeScript contracts.

---

## 2. API Documentation

Interactive Swagger / OpenAPI UI is automatically generated and accessible at:

- `http://localhost:5000/docs`

---

## 3. Getting Started

### Environment Setup

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### Running Local PostgreSQL

```bash
docker compose up -d
```

### Prisma Commands

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run Migrations
pnpm prisma:migrate

# Seed Database
pnpm prisma:seed

# Launch Prisma Studio Database GUI
pnpm prisma:studio
```

### Running Development Server

```bash
pnpm dev
```

### Running Tests & Quality Checks

```bash
pnpm test          # Run Vitest test suites
pnpm typecheck     # Validate TypeScript types
pnpm lint          # Check ESLint rules
```
