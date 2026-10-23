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
| `npm run lint` | Run ESLint |
| `npm test` | Run the test suite (Vitest) |

## Layout

Responsive across devices:

- **Phone** — single column with a bottom tab bar
- **Tablet** — roomier single column
- **Laptop/desktop** — persistent left sidebar with full-width content

## Features

### Availability engine

Everything in BalanceConnect is driven by the teacher's own schedule. You set
per-day working hours (any day can be off, each day can have different times),
plus daily **response windows** — the slots when you actually plan to reply to
messages. From these the app derives a live status at any moment:

- **Working hours** — you're teaching, but not in a reply window
- **Reply window** — messages get handled now
- **Family Time** — scheduled personal time, non-urgent alerts silenced
- **Quiet hours** — overnight offline period (ranges like 9 PM – 8 AM work)
- **Off work** / **Done for today** — outside everything, or shut down early

The status appears as a pill in the sidebar and on Home, the ambient
background tint shifts with it, and a forward scan (in 5-minute steps, up to
14 days) always answers "when is my next reply window?" — handling days off,
recurrence and local time correctly.

### Home dashboard

A single-glance daily board:

- Greeting, date, and current availability status
- **Today's schedule** — a timeline of today's lessons with "On now" /
  "Up next" / done markers; tap any lesson to edit it
- **Today's focus** — a persisted four-item checklist (replies, lessons,
  materials, admin)
- **Next lesson** card and message KPIs (unread / waiting / urgent)
- **Time in apps today** — BalanceConnect time is measured for real on the
  device; Google Docs / Classroom / Gmail figures are clearly-labelled demo data
- Quick actions into Working mode, Family Time, and End of day
- A rotating well-being tip
- **Demo day picker** — preview any date (±1 day buttons or a date input); the
  whole app — availability, Family Time, schedule, analytics — follows the
  chosen day, and the choice survives a page refresh (a patched demo clock).

### Messaging & triage (simulated)

Students and parents "message" you inside the app; nothing is ever sent
externally. Every incoming message is:

- **Auto-classified** — Urgent (detected from wording like "urgent", "exam",
  "ASAP"), Scheduling (reschedule/cancel requests), Existing student, New
  enquiry, or Other
- **Scored and sorted** — higher categories float to the top, with a small
  aging boost so older messages creep up; you can also override priority
  manually (high / normal / low / automatic)
- **Queued or accepted** — messages outside your boundaries are queued with an
  expected-reply time; messages in a window land as "awaiting reply"

The inbox offers search, filters (All / Urgent / Normal / Enquiries / Queued /
Archived), unread badges, and per-message actions: mark read/unread, mark
urgent, flag for follow-up, and archive with an Undo toast.

Notifications follow your policy: alerts during working time can be toggled,
and urgent messages have three modes — hold until the next window (respect all
boundaries), alert in quiet hours but not during Family Time, or always alert.

### Automatic replies

When a message arrives while you're unavailable, the app drafts an automatic
reply from your template. `{next}` is replaced with the real next reply time
("tomorrow after 5:00 PM", "on Monday after 9:00 AM", …) and `{name}` with your
name. The template is editable in Settings with a live preview and insert
buttons for the placeholders.

### Working mode (focused response sessions)

A batched-reply workflow instead of constant interruption:

- Start a session from Home, Inbox, or the Working mode screen (in a reply
  window it notes the window times; otherwise it's a manual session)
- Your queue is presented in triage order with a suggested breakdown by
  category, a progress bar, and per-message Reply / Skip / Follow-up controls
- "Process next" walks the queue one message at a time
- Ending the session logs the time spent as work activity for analytics

### Family Time

A protected daily block (default 6:30–8:30 PM) that **starts and stops
automatically** at the scheduled times while the app is open, or manually on
demand. During Family Time:

- Non-urgent notifications are silenced (per your settings)
- Incoming messages keep queuing safely, with a count and expected-reply time
- A dismissible banner reminds you on every other screen
- Ending early is one tap away and won't auto-restart that day

### End-of-day shutdown routine

A five-item closing checklist (messages handled, materials ready, admin done,
auto-replies configured, quiet/Family time on) with live hints — e.g. how many
messages are still awaiting a reply. Completing it logs the routine to your
analytics and, if enabled, puts the app **offline until your next reply
window** ("Done for today"). A completed day shows a wrap-up card with the
option to review the checklist again.

### Lesson schedule

- **Day and week views** with previous/next navigation; each day shows lessons
  alongside your reply windows, Family Time and quiet hours, plus that day's
  working hours (or "Day off")
- **Add/edit lessons** in a sheet: student, topic, date, times, notes — the
  end time defaults to the student's course length (from the built-in
  HIPPOCAMPUS course catalogue)
- **Recurring lessons** — weekly or every 2 weeks, with a stable anchor date;
  deleting a recurring lesson offers "this date only" (exception date) or the
  whole series
- **Conflict detection** — hard errors block saving when a lesson overlaps
  another student's lesson (recurrences included); soft warnings flag time
  inside Family Time, quiet hours, a response window, or on a non-working day,
  and can be overridden by saving again

### Well-being analytics

A gentle, non-judgmental view of your teaching rhythm over this week / month /
year, compared against the previous period:

- KPIs: after-hours messages, % that arrived in your windows, average reply
  time, Family Time sessions, auto-replies sent, end-of-day routines completed
- An accessible SVG line chart of messages per day (or month), split into
  in-window vs after-hours
- A work vs personal time split bar (finished lessons + sessions vs logged
  Family Time)
- Plain-language insights ("Your after-hours messages went down 32% compared
  with last month")
- A toggle to exclude the built-in demo history and see only your own activity

### Student view preview

A read-only preview of the public page students and families would see: your
avatar, live "Available now / Away · replies tomorrow after…" pill, the course
catalogue, teaching days and hours, reply windows, typical response time, and
what happens to messages sent outside those times (including the "start with
Urgent" convention). Each section can be shown or hidden in Settings — Family
Time is never exposed.

### Settings & onboarding

One validated form (also used as first-run setup, though the app now opens
straight onto the demo dashboard) covering: profile, working days and hours,
response windows (add/remove), Family Time, quiet hours, automatic replies,
notification and urgent-message policy, quiet-after-shutdown, and Student view
visibility. Validation catches impossible times, empty window lists, and
missing templates before saving; saving re-computes expected reply times for
queued messages.

### Test scenario simulator

A sandbox (More → Test scenarios) for seeing how the app behaves without
waiting for real conditions:

- Seven one-click scenarios — message during a response window, after hours,
  during Family Time, urgent in quiet hours, on a non-working day, just before
  the next window, and a completed shutdown routine — each picking a realistic
arrival time **from your own saved schedule**
- A custom test message: choose the sender, text, and arrival time (or "now",
  which uses live Family Time/shutdown state)
- Every run shows the outcome: queued vs awaiting, urgent flag, notify vs
silenced, the generated auto-reply, and the expected next window

### Data management

- All state lives in `localStorage` on your device — nothing is sent anywhere
- **Remove demo data** keeps your own activity but clears seeded messages,
  lessons, and history (demo students stay so tests still work)
- **Reset everything** restores the original demo seed
- Saves are sanitised on load (corrupt or hand-edited data can't crash the
  app), and a full/disabled storage failure raises a visible warning instead
  of losing data silently

### Appearance, responsiveness & accessibility

- Light / dark / **system** theme toggle (More → Appearance)
- Responsive layout: bottom tab bar on phone, roomy single column on tablet,
persistent sidebar on laptop/desktop
- Accessibility touches throughout: skip link, labelled controls, `aria-current`
navigation, radio-group semantics, live-region errors, chart text summaries,
and an error boundary
- An in-app usage tracker accrues your real time in BalanceConnect (per local
day) to power the Home usage widget

All messaging is simulated in-app; nothing is sent externally. Data is stored in
the browser only.
