# BalanceConnect

A work–life balance companion for teachers. Set clear availability boundaries,
triage student messages, run focused response windows, protect Family Time, and
review well-being analytics — all in a calm, responsive interface.

> Clear Boundaries. Meaningful Connections.

## Tech stack

- **Next.js 14** (App Router)
- **React 18**
- Client-side state persisted to `localStorage` (no backend required)

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |

## Layout

Responsive across devices:

- **Phone** — single column with a bottom tab bar
- **Tablet** — roomier single column
- **Laptop/desktop** — persistent left sidebar with full-width content

## Features

- Schedule-aware availability and next-window calculation
- Automatic reply generation for off-hours messages
- Message triage (urgent → scheduling → existing → enquiry → other)
- Response mode, Family Time, and an end-of-day shutdown routine
- Well-being analytics from saved activity
- Lesson scheduling with conflict detection
- Built-in test-scenario simulator

All messaging is simulated in-app; nothing is sent externally. Data is stored in
the browser only.
