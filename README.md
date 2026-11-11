# মোহাম্মদপুর কমিউনিটি (Amra Muhammadpuri)

> Modern, scalable, production-ready community platform monorepo.

---

## 1. Project Overview & Architecture

This repository is structured as a strictly decoupled monorepo managed with **PNPM Workspaces**. The architecture enforces clean separation of concerns with exactly two root application workspaces:

```text
amra-muhammadpuri/
│
├── frontend/             # Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
├── backend/              # Node.js, Fastify, TypeScript, Prisma ORM, PostgreSQL
│
├── package.json          # Root workspace scripts & orchestration
├── pnpm-workspace.yaml   # Monorepo workspace configuration
├── .gitignore            # Git exclusion rules
├── .editorconfig         # Code editor indentation and formatting standards
├── .prettierrc           # Global code formatting standards
├── .prettierignore       # Files excluded from Prettier
├── .env.example          # Environment variables reference
└── README.md             # Monorepo architecture & onboarding guide
```

### Key Architectural Tenets

- **Separation of Concerns**: Frontend and backend are completely autonomous applications. No cross-contamination, separate `package.json` and dependencies.
- **Single Source of Truth**: The backend API defines the domain models, validation schemas, and REST endpoints with OpenAPI documentation.
- **Strict Typing**: TypeScript `strict: true` across all applications.
- **Modularity**: Domain-driven feature slicing on both frontend (`src/features/*`) and backend (`src/modules/*`).
- **Resilience & DX**: Unified linting, formatting, type checking, and automated containerized local database orchestration via Docker Compose.

---

## 2. Technology Stack

### Frontend (`frontend/`)

- **Framework**: Next.js (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Primitives & Icons**: Radix UI Primitives, Lucide React, `tailwind-merge`, `clsx`, `class-variance-authority`
- **Form & Validation**: React Hook Form, Zod
- **Server State**: TanStack Query (React Query)
- **Code Quality**: ESLint, TypeScript Strict Mode, Vitest & React Testing Library

### Backend (`backend/`)

- **Runtime**: Node.js
- **Web Framework**: Fastify (high-performance, low overhead)
- **Database & ORM**: PostgreSQL with Prisma ORM
- **API Documentation**: OpenAPI / Swagger (`@fastify/swagger`, `@fastify/swagger-ui`)
- **Validation**: Zod (strict schema-based input parsing)
- **Logging**: Pino (structured JSON logging via Fastify)
- **Security**: `@fastify/helmet`, `@fastify/cors`, secure cookie/JWT support
- **Testing**: Vitest for unit & integration testing

---

## 3. Quickstart & Setup

### Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **PNPM**: `v9.x` (`corepack enable` or `npm install -g pnpm`)
- **Docker & Docker Compose** (for local PostgreSQL database)

### Installation

1. **Clone the repository and install dependencies**:

   ```bash
   pnpm install
   ```

2. **Configure Environment Variables**:

   ```bash
   # Copy backend environment template
   cp backend/.env.example backend/.env

   # Copy frontend environment template
   cp frontend/.env.example frontend/.env
   ```

3. **Start Local PostgreSQL Database**:

   ```bash
   cd backend
   docker compose up -d
   ```

4. **Initialize Database with Prisma**:

   ```bash
   cd backend
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```

5. **Start Both Applications (Concurrent Development Mode)**:

   ```bash
   # From root directory:
   pnpm dev
   ```

   - **Frontend Application**: `http://localhost:3000`
   - **Backend API Server**: `http://localhost:5000`
   - **Interactive API Documentation (Swagger)**: `http://localhost:5000/docs`

---

## 4. Root Development Commands

All lifecycle scripts can be executed directly from the monorepo root:

| Command             | Description                                                         |
| :------------------ | :------------------------------------------------------------------ |
| `pnpm dev`          | Starts both frontend and backend concurrently in development mode   |
| `pnpm dev:frontend` | Starts only the Next.js frontend application                        |
| `pnpm dev:backend`  | Starts only the Fastify backend server with hot-reload              |
| `pnpm build`        | Builds both backend and frontend applications for production        |
| `pnpm lint`         | Runs ESLint across all workspaces                                   |
| `pnpm typecheck`    | Validates TypeScript types across all workspaces with zero emission |
| `pnpm format`       | Formats the entire codebase using Prettier                          |
| `pnpm format:check` | Verifies code formatting conformance without modifying files        |
| `pnpm test`         | Runs the test suites across all workspaces                          |

---

## 5. Coding Conventions & Best Practices

1. **Naming Conventions**:
   - React Components & Files: `PascalCase` (e.g., `Button.tsx`, `LoginForm.tsx`)
   - Functions & Variables: `camelCase` (e.g., `calculateTotal`, `fetchUserData`)
   - Types & Interfaces: `PascalCase` (e.g., `UserResponse`, `RegisterPayload`)
   - Constants: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_PAGE_SIZE`, `API_ENDPOINTS`)
   - Modules & Folders: `kebab-case` or lowercase (e.g., `user-profile`, `auth`)
2. **Component Discipline**:
   - Keep components small and focused on a single responsibility.
   - Leverage React Server Components (`RSC`) for non-interactive content and client components (`'use client'`) strictly for interactive elements.
   - Decouple business logic into custom hooks (`hooks/`) and feature services.
3. **API & Validation**:
   - Backend is the source of truth: all HTTP inputs must be validated through strict Zod schemas before reaching the service layer.
   - Return predictable REST responses with standardized success and error structures.
