# BillTrail

Invoicing and online payments for small businesses, built with Paystack.

## Structure

```
billtrail/
  backend/    Node + TypeScript API (deployed on its own)
  frontend/   React app (added later, deployed on its own)
  docs/       DESIGN.md, PROGRESS.md
```

## Run the backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev        # https://billtrail-api.onrender.com/api/v1/health
```

Other scripts: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

![Backend CI](https://github.com/confidenceefem/billtrail/actions/workflows/backend-ci.yml/badge.svg)
