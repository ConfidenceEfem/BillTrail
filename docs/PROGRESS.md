# BillTrail: Progress log

Paste this file at the start of every mentoring session so we never lose context.

## Decisions
- Payments: Paystack (test mode while building)
- Backend: Node, TypeScript (strict), Express 5, PostgreSQL, Prisma, Zod, Redis + BullMQ, Vitest
- Frontend: React, Vite, TypeScript, TanStack Query, Tailwind, Framer Motion
- Money is stored as integers in kobo. Never floats.
- Repo layout: `backend/` and `frontend/` are independent packages so they can be deployed separately.

## Backend build order
- [x] Step 1: Server foundation (config, logger, error handling, health route, tests)
- [ ] Step 2: Database and Prisma schema
- [ ] Step 3: Authentication (register, verify email, login, refresh, logout, reset password)
- [ ] Step 4: Shared middleware (authenticate, authorize, validate, rate limit)
- [ ] Step 5: Business and clients module
- [ ] Step 6: Invoices module (money calculation, status rules)
- [ ] Step 7: Paystack payments, webhook, idempotency
- [ ] Step 8: Email and background jobs (send invoice, reminders, recurring invoices)
- [ ] Step 9: PDF export, dashboard summary, team roles, partial payments
- [ ] Step 10: Tests, Docker, CI, deployment

## Notes and questions
(Write what confused you here.)
