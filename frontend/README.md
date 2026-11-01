# Amra Muhammadpuri - Frontend Web Application

Modern, performant web client built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, and **TanStack Query**.

---

## 1. Architecture & Folder Hierarchy

The frontend follows Next.js App Router guidelines and feature-based modularity:

```text
frontend/
├── public/                       # Static public assets (images, icons, logos, fonts)
├── src/
│   ├── app/                      # App Router: file-based routing, nested layouts, loading, errors
│   │   ├── (public)/             # Public routes group (Landing, explore)
│   │   ├── (auth)/               # Auth routes group (Login, register)
│   │   ├── (dashboard)/          # Authenticated routes group (Dashboard)
│   │   ├── error.tsx             # Route-level error boundary
│   │   ├── loading.tsx           # Global suspense loading fallback
│   │   ├── not-found.tsx         # 404 handler
│   │   ├── globals.css           # Global Tailwind CSS directives & color variables
│   │   └── layout.tsx            # Root HTML layout with providers
│   ├── components/               # Pure presentation & design system primitives
│   │   ├── ui/                   # Atomic UI components (Button, Input, Card, Skeleton)
│   │   ├── layout/               # PageContainer, grid and flex wrappers
│   │   ├── navigation/           # Navbar, footer, breadcrumbs
│   │   ├── forms/                # Form fields, labels, error messages
│   │   ├── feedback/             # Alerts, badges, dialogs, toasts
│   │   └── common/               # Shared compound components
│   ├── features/                 # Modular domain slices (components, hooks, services, schemas, types)
│   │   └── auth/                 # Authentication feature slice
│   ├── hooks/                    # Reusable React hooks (useDebounce, useMediaQuery)
│   ├── lib/                      # Infrastructure & utility functions
│   │   ├── api/                  # Typed fetch client (apiClient)
│   │   ├── constants/            # Site metadata & navigation links
│   │   ├── formatters/           # Date, currency, string formatters
│   │   └── utils.ts              # Styling merge utility (cn)
│   ├── providers/                # React Context & TanStack Query providers
│   ├── config/                   # Zod-validated client environment variables
│   └── types/                    # Shared frontend TypeScript interfaces
├── tests/                        # Vitest & Testing Library component test suites
├── next.config.ts                # Next.js build configuration
├── tailwind.config.ts            # Tailwind design tokens & breakpoints
├── tsconfig.json                 # TypeScript strict configuration
└── package.json                  # Dependencies and scripts
```

---

## 2. Component Standards

- **Server Components (RSC) by default**: Pages and non-interactive wrappers render on the server.
- **Client Components (`'use client'`)**: Only when interactivity, DOM hooks (`useState`, `useEffect`), or browser APIs are required.
- **Accessible UI Primitives**: Accessible primitives powered by Radix UI and Tailwind CSS.
- **Strict Typing**: All component props typed with TypeScript interfaces without `any`.

---

## 3. Development Commands

Run commands from `frontend/` or through the root monorepo scripts:

```bash
pnpm dev          # Start Next.js development server at http://localhost:3000
pnpm build        # Compile production build
pnpm start        # Serve production build
pnpm test         # Run Vitest test suite
pnpm typecheck    # Validate TypeScript types
pnpm lint         # Run ESLint checks
```
