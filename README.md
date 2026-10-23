# 🌿 BalanceConnect

> **Clear Boundaries. Meaningful Connections.**

A work–life balance companion for teachers. Set clear availability boundaries,
triage student messages, run focused response windows, protect Family Time, and
review well-being analytics — all in a calm, responsive interface.

![Next.js 14](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![No backend](https://img.shields.io/badge/backend-none-lightgrey)
![Tests](https://img.shields.io/badge/tests-Vitest-6E9F18)

---

## 📖 Contents

- [✨ Features at a glance](#-features-at-a-glance)
- [🧭 Availability engine](#-availability-engine)
- [🏠 Home dashboard](#-home-dashboard)
- [💬 Messaging & triage](#-messaging--triage)
- [🤖 Automatic replies](#-automatic-replies)
- [🎯 Working mode](#-working-mode)
- [💛 Family Time](#-family-time)
- [🌙 End-of-day shutdown](#-end-of-day-shutdown)
- [📅 Lesson schedule](#-lesson-schedule)
- [📊 Well-being analytics](#-well-being-analytics)
- [👀 Student view preview](#-student-view-preview)
- [⚙️ Settings & onboarding](#-settings--onboarding)
- [🧪 Test scenario simulator](#-test-scenario-simulator)
- [💾 Data management](#-data-management)
- [🎨 Appearance, responsiveness & accessibility](#-appearance-responsiveness--accessibility)
- [🛠 Tech stack](#-tech-stack)
- [🚀 Getting started](#-getting-started)
- [📜 Scripts](#-scripts)

---

## ✨ Features at a glance

| | Feature | What it does |
| --- | --- | --- |
| 🧭 | [Availability engine](#-availability-engine) | Live status from your own schedule; next reply window always known |
| 🏠 | [Home dashboard](#-home-dashboard) | Today's lessons, focus checklist, message KPIs, app usage, quick actions |
| 💬 | [Messaging & triage](#-messaging--triage) | Simulated inbox with auto-categorisation, scoring, filters and search |
| 🤖 | [Automatic replies](#-automatic-replies) | Templated replies with the real next-reply time filled in |
| 🎯 | [Working mode](#-working-mode) | Focused, batched reply sessions with progress tracking |
| 💛 | [Family Time](#-family-time) | Auto-silenced personal block; messages queue safely |
| 🌙 | [End-of-day shutdown](#-end-of-day-shutdown) | Closing checklist; optional offline-until-next-window |
| 📅 | [Lesson schedule](#-lesson-schedule) | Day/week views, recurring lessons, conflict detection |
| 📊 | [Well-being analytics](#-well-being-analytics) | Gentle trends: after-hours messages, reply times, work vs personal |
| 👀 | [Student view preview](#-student-view-preview) | See exactly what students and families would see |
| ⚙️ | [Settings & onboarding](#-settings--onboarding) | One validated form for every preference |
| 🧪 | [Test simulator](#-test-scenario-simulator) | Seven one-click scenarios plus custom test messages |
| 💾 | [Data management](#-data-management) | Device-only storage; remove demo data or reset |
| 🎨 | [Themes & accessibility](#-appearance-responsiveness--accessibility) | Light/dark/system, responsive layout, a11y throughout |

---

## 🧭 Availability engine

Everything in BalanceConnect is driven by the teacher's own schedule: per-day
working hours (any day can be off, each day can have different times), plus
daily **response windows** — the slots when you actually plan to reply.

From these the app derives a live status at any moment:

| Status | When it applies | Effect |
| --- | --- | --- |
| 🟣 **Working hours** | Teaching, but not in a reply window | Messages queue normally |
| 🟢 **Reply window** | Inside a configured window | Messages accepted for handling now |
| 💛 **Family Time** | Scheduled personal block | Non-urgent alerts silenced |
| 🌙 **Quiet hours** | Overnight offline period (e.g. 9 PM – 8 AM) | All non-urgent alerts silenced |
| ⚪ **Off work** | Outside everything | Messages queue with expected-reply times |
| ✅ **Done for today** | After the shutdown routine | Offline until the next reply window |

> [!TIP]
> A forward scan in 5-minute steps (up to 14 days) always answers **"when is my
> next reply window?"** — correctly handling days off, recurrence and local
> time. The status shows as a pill in the sidebar and on Home, and the ambient
> background tint shifts with it.

---

## 🏠 Home dashboard

A single-glance daily board:

| Widget | Description |
| --- | --- |
| 👋 **Greeting & status** | Time-aware greeting, date, and current availability pill |
| 📆 **Today's schedule** | Timeline of today's lessons with **On now** / **Up next** / done markers — tap to edit |
| ☑️ **Today's focus** | Persisted four-item checklist: replies, lessons, materials, admin |
| 📈 **Message KPIs** | Unread / waiting / urgent counts at a glance |
| ⏱️ **Time in apps today** | BalanceConnect time measured for real; Google Docs / Classroom / Gmail figures clearly labelled as demo data |
| 🚀 **Quick actions** | One tap into Working mode, Family Time, and End of day |
| 🌿 **Well-being tip** | A rotating tip with a "Next tip" button |
| 🗓️ **Demo day picker** | Preview any date (±1 day buttons or a date input) — the whole app follows the chosen day, and the choice survives a page refresh |

---

## 💬 Messaging & triage

Students and parents "message" you inside the app; nothing is ever sent
externally. Every incoming message is automatically processed:

| Step | Details |
| --- | --- |
| **Auto-classified** | Categorized by wording and sender (see table below) |
| **Scored & sorted** | Higher categories float up; a small aging boost lets older messages creep up |
| **Priority override** | Manually set high / normal / low / automatic per message |
| **Queued or accepted** | Outside your boundaries → queued with an expected-reply time; inside a window → "awaiting reply" |

### 🏷️ Triage categories

| Category | Trigger | Queue position |
| --- | --- | --- |
| 🔴 **Urgent** | Wording like "urgent", "exam", "ASAP", "急" | Top |
| 🟠 **Scheduling** | Reschedule / cancel / time-slot requests | Second |
| 🟡 **Existing student** | Current students and parent contacts | Third |
| 🔵 **New enquiry** | Prospective students; "trial", "rates", "price" | Fourth |
| ⚪ **Other** | Anything else | Last |

### 📥 Inbox tools

- 🔍 **Search** across student names and full threads
- **Filters** — All / Urgent / Normal / Enquiries / Queued / Archived
- 🔴 **Unread badges** on the nav and per message
- **Per-message actions** — mark read/unread, mark urgent, flag for follow-up, archive with an **Undo** toast

### 🔔 Notification policy

Alerts during working time can be toggled on or off. Urgent messages have three
explicit modes:

| Mode | Behaviour |
| --- | --- |
| **Hold until next window** | Respects *all* boundaries — nothing interrupts |
| **Except Family Time** | Alerts in quiet hours, but not during Family Time |
| **Always** | Alerts even during Family Time |

---

## 🤖 Automatic replies

When a message arrives while you're unavailable, the app drafts an automatic
reply from your template:

- `{next}` → the real next reply time ("tomorrow after 5:00 PM", "on Monday after 9:00 AM", …)
- `{name}` → your name

> [!NOTE]
> The template is editable in **Settings** with insert buttons for each
> placeholder and a **live preview** showing exactly what a student would
> receive right now.

---

## 🎯 Working mode

A batched-reply workflow instead of constant interruption:

| Aspect | Details |
| --- | --- |
| ▶️ **Start** | From Home, Inbox, or the Working mode screen — in a reply window it shows the window times; otherwise it's a manual session |
| 📋 **Queue** | Triage order with a suggested breakdown by category, a progress bar, and per-message **Reply / Skip / Follow-up** controls |
| ⏭️ **Process next** | Walks the queue one message at a time |
| 📊 **On exit** | Session duration is logged as work activity for analytics |

---

## 💛 Family Time

A protected daily block (default 6:30–8:30 PM) that **starts and stops
automatically** at the scheduled times while the app is open — or manually on
demand.

| Behaviour | Details |
| --- | --- |
| 🔕 Silencing | Non-urgent notifications are silenced (per your settings) |
| 📥 Safe queuing | Messages keep arriving with a live count and expected-reply time |
| 💛 Banner | A dismissible banner reminds you on every other screen |
| ⏹️ Early exit | One tap away — and it won't auto-restart that day |

---

## 🌙 End-of-day shutdown

A five-item closing checklist with live hints (e.g. how many messages are still
awaiting a reply):

| # | Checklist item |
| --- | --- |
| 1 | All important messages replied to or queued |
| 2 | Tomorrow's lesson materials ready |
| 3 | Invoices and notes updated |
| 4 | Automatic replies configured |
| 5 | Family time or quiet hours activated |

> [!IMPORTANT]
> Completing the routine logs it to your analytics and — if enabled — puts the
> app **offline until your next reply window** ("Done for today"). A completed
> day shows a wrap-up card with the option to review the checklist again.

---

## 📅 Lesson schedule

| Feature | Details |
| --- | --- |
| 📆 **Day & week views** | Previous/next navigation; each day shows lessons alongside reply windows, Family Time, quiet hours, and that day's working hours (or "Day off") |
| ➕ **Add / edit lessons** | Student, topic, date, times, notes — end time defaults to the student's course length from the built-in HIPPOCAMPUS catalogue |
| 🔁 **Recurring lessons** | Weekly or every 2 weeks with a stable anchor date; deleting offers **"this date only"** (exception date) or the **whole series** |
| ⚠️ **Conflict detection** | Hard errors and soft warnings (see below) |

### ⚠️ Conflict handling

| Type | Trigger | Can you override? |
| --- | --- | --- |
| 🔴 **Hard error** | Overlaps another student's lesson (recurrences included) | ❌ No — you must pick a different time |
| 🟡 **Soft warning** | Inside Family Time, quiet hours, a response window, or on a non-working day | ✅ Yes — save again to keep the time |

---

## 📊 Well-being analytics

A gentle, non-judgmental view of your teaching rhythm over **this week / month /
year**, compared against the previous period:

| View | Contents |
| --- | --- |
| 📌 **KPIs** | After-hours messages · % arrived in windows · average reply time · Family Time sessions · auto-replies sent · end-of-day routines completed |
| 📈 **Line chart** | Accessible SVG of messages per day (or month), split into **in-window** vs **after-hours** |
| ⚖️ **Work vs personal** | Split bar: finished lessons + sessions vs logged Family Time |
| ✨ **Insights** | Plain language comparisons ("Your after-hours messages went down 32% compared with last month") |
| 🔘 **Demo toggle** | Exclude the built-in demo history to see only your own activity |

---

## 👀 Student view preview

A read-only preview of the public page students and families would see:

- 👤 Avatar, name, and a live **"Available now" / "Away · replies tomorrow after…"** pill
- 📚 The HIPPOCAMPUS course catalogue (non-native and native/heritage tracks)
- 🕒 Teaching days & hours, reply windows, typical response time
- 📨 What happens to messages sent outside those times — including the "start with Urgent" convention

> [!NOTE]
> Each section can be shown or hidden in Settings. **Family Time is never
> exposed.** A live student page would need login and a secure backend.

---

## ⚙️ Settings & onboarding

One validated form (also used as first-run setup, though the app now opens
straight onto the demo dashboard):

| Section | Options |
| --- | --- |
| 👤 **About you** | Name, subject |
| 🕒 **Teaching hours** | Per-day on/off with start and end times |
| 💬 **Response windows** | Add / remove multiple daily windows |
| 💛 **Family time** | Schedule + silencing toggle |
| 🌙 **Quiet hours** | Overnight ranges like 9 PM – 8 AM |
| 🤖 **Automatic replies** | Template with `{next}` / `{name}` + live preview |
| 🔔 **Notifications** | Working-time alerts, urgent policy, quiet-after-shutdown |
| 👀 **Student view** | Choose visible sections + typical response time |

> [!WARNING]
> Validation catches impossible times, empty window lists, and missing
> templates before saving. Saving also **re-computes expected reply times** for
> already-queued messages.

---

## 🧪 Test scenario simulator

A sandbox (**More → Test scenarios**) for seeing how the app behaves without
waiting for real conditions. Each scenario picks a realistic arrival time
**from your own saved schedule** and runs the same intake logic as real
messages.

| # | Scenario | What it demonstrates |
| --- | --- | --- |
| 1 | During a response window | Message accepted live, no auto-reply needed |
| 2 | After working hours | Queued + automatic reply with next-window time |
| 3 | During Family Time | Notification silenced, message safely queued |
| 4 | Urgent in quiet hours | Your urgent-message policy in action |
| 5 | On a non-working day | Queued until the next working window |
| 6 | Just before the next window | Expected-reply timing edge case |
| 7 | Complete shutdown routine | "Done for today" — offline until next window |

Plus a **custom test message**: choose the sender, text, and arrival time (or
"now", which uses live Family Time/shutdown state). Every run shows the
outcome: queued vs awaiting, urgent flag, notify vs silenced, the generated
auto-reply, and the expected next window.

---

## 💾 Data management

> [!IMPORTANT]
> All state lives in `localStorage` **on your device only** — nothing is sent
> anywhere. If you clear your browser data, it will be removed.

| Action | Effect |
| --- | --- |
| 🧹 **Remove demo data** | Clears seeded messages, lessons, and history — your own activity is kept (demo students stay so tests still work) |
| ♻️ **Reset everything** | Restores the original demo seed |
| 🛡️ **Sanitisation** | Corrupt or hand-edited saved data can never crash the app |
| ⚠️ **Save-failure warning** | A full or disabled storage raises a visible warning instead of losing data silently |

---

## 🎨 Appearance, responsiveness & accessibility

### 🖥️ Responsive layout

| Device | Navigation |
| --- | --- |
| 📱 Phone | Single column with a bottom tab bar |
| 💻 Tablet | Roomy single column |
| 🖥️ Laptop/desktop | Persistent left sidebar with full-width content |

### 🎨 Themes

Light / dark / **system** toggle under **More → Appearance** ("System" follows
your device setting).

### ♿ Accessibility

- Skip link, labelled controls, `aria-current` navigation
- Radio-group semantics, live-region errors
- Chart text summaries, and a global error boundary
- An in-app usage tracker accrues your real time in BalanceConnect (per local
  day) to power the Home usage widget

---

## 🛠 Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 14** (App Router) |
| UI | **React 18** |
| State | Client-side, persisted to `localStorage` — no backend required |
| Tests | **Vitest** (`tests/`) |

---

## 🚀 Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to http://localhost:3000).

---

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the test suite (Vitest) |

---

> [!NOTE]
> All messaging is simulated in-app; nothing is sent externally. Data is stored
> in the browser only.
