// App state: defaults, seeding, load/save, and derived helpers.
import { uid, dk, addDays, sod, initials } from './utils.js';
import { receive, act } from './intake.js';

export const TIPS = [
  'Batch your replies into windows. Clients adapt quickly to a predictable rhythm.',
  'A 5-minute walk between tasks resets your focus more than scrolling does.',
  'Write tomorrow’s top three tasks before you close the laptop.',
  '“I’ll reply in my next window” is a complete, professional answer.',
  'Step away from your inbox between windows — deep work needs uninterrupted time.',
  'Protect one evening a week with no screens at all.',
  'Turn recurring client questions into a short FAQ you can send in one click.',
  'Rest is part of the job. A tired mind does worse work, not more.',
  'Every client has their own story. You don’t have to carry all of them at once.',
];

export const SHUT = [
  ['msgs', 'All important emails replied to or queued'],
  ['plan', 'Tomorrow’s priorities noted'],
  ['admin', 'Invoices and notes updated'],
  ['auto', 'Automatic replies configured'],
  ['quiet', 'Family time or quiet hours activated'],
];

// Internal service presets. Kept as a small catalogue so new appointments can
// default to a sensible length. `track` groups quick vs in-depth work. These
// are no longer shown to clients — they only drive default durations/notes.
export const COURSES = [
  // Shorter / lighter engagements
  { id: 'children', name: 'Intro call', track: 'Non-native', mins: 45, fee: 55, desc: 'A first conversation to understand the project and scope.' },
  { id: 'everyday', name: 'Working session', track: 'Non-native', mins: 60, fee: 75, desc: 'A focused hands-on session on live project work.' },
  { id: 'business', name: 'Strategy workshop', track: 'Non-native', mins: 70, fee: 90, desc: 'Deeper planning for positioning, scope and timeline.' },
  // Longer / in-depth engagements
  { id: 'preschool', name: 'Quick review', track: 'Native', mins: 45, fee: 55, desc: 'A short review of deliverables and feedback.' },
  { id: 'primary', name: 'Design review', track: 'Native', mins: 60, fee: 75, desc: 'Walkthrough of drafts with structured feedback.' },
  { id: 'secondary', name: 'Milestone review', track: 'Native', mins: 70, fee: 85, desc: 'End-of-phase review and sign-off.' },
  { id: 'ibdp', name: 'Full project workshop', track: 'Native', mins: 80, fee: 120, desc: 'In-depth working session for a major deliverable.' },
];

export const COURSE_BY_ID = Object.fromEntries(COURSES.map((c) => [c.id, c]));

export function defaults() {
  const day = (on, s = '09:00', e = '17:00') => ({ on, s, e });
  return {
    name: 'Mika', subject: 'Independent brand & web design studio',
    // A typical solo-business week: open Mon–Fri with a lighter Saturday,
    // Sunday off.
    days: [day(false, '10:00', '14:00'), day(true, '09:00', '17:00'), day(true), day(true), day(true), day(true), day(true, '09:30', '13:00')],
    windows: [{ s: '09:00', e: '10:00' }, { s: '17:00', e: '18:00' }],
    family: { on: true, s: '18:30', e: '20:30', silence: true }, quiet: { on: true, s: '21:00', e: '08:00' },
    auto: true,
    tpl: "Thanks for your email! I'm heads-down with a client or away from my desk right now, and I'll reply {next}. If it's urgent, please include the word 'Urgent'. Best, {name}",
    urgent: 'hold', notif: true, quietAfterShutdown: true, show: { days: true, windows: true, resp: true },
    typical: 'Within one working day',
  };
}

export function seed() {
  const S = {
    v: 1, onboarded: false, theme: 'system', demoOffset: 0, settings: defaults(), includeDemo: true, tip: new Date().getDate() % TIPS.length,
    students: [
      // Demo clients. Emails are auto-collected from the connected Gmail/Outlook
      // mailbox; `email` is the address each message comes from. `contact` notes
      // when the sender writes on behalf of a company.
      { id: 'sora', name: 'Tanaka Studio', email: 'hello@tanaka-studio.com', course: 'Intro call', courseId: 'children', contact: 'company', active: true, demo: true },
      { id: 'emma', name: 'Emma Lim', email: 'emma.lim@gmail.com', course: 'Working session', courseId: 'everyday', active: true, demo: true },
      { id: 'raj', name: 'Rajesh Menon', email: 'rajesh.menon@outlook.com', course: 'Strategy workshop', courseId: 'business', active: true, demo: true },
      { id: 'hina', name: 'Yamamoto & Co.', email: 'accounts@yamamoto.co', course: 'Design review', courseId: 'primary', contact: 'company', active: true, demo: true },
      { id: 'kenta', name: 'Kenta Watanabe', email: 'k.watanabe@gmail.com', course: 'Milestone review', courseId: 'secondary', active: true, demo: true },
      { id: 'aiko', name: 'Aiko Chua', email: 'aiko.chua@outlook.com', course: 'Full project workshop', courseId: 'ibdp', active: true, demo: true },
      { id: 'olivia', name: 'Olivia Tan', email: 'olivia.tan@gmail.com', course: 'Prospective client', courseId: 'everyday', isNew: true, active: false, demo: true },
    ],
    messages: [], lessons: [], acts: [], tasks: {}, shutdowns: {}, usage: {},
    family: { active: false, manual: false, start: null, endedOn: null }, offlineUntil: null, rm: { active: false, start: null, done: [], skip: [] },
  };
  const now = Date.now(), H = 36e5, today = new Date(), t = dk(today);
  // A realistic full working day. Most appointments recur on a fixed cadence
  // (weekly or biweekly), which is how regular clients are usually scheduled.
  // `repeat`: 'none' | 'weekly' | 'biweekly'; `anchor` is the first occurrence
  // date so biweekly parity is stable even as the week scrolls.
  const lesson = (sid, subject, s, e, notes, repeat) => ({
    id: uid(), sid, subject, date: t, s, e, notes: notes || '',
    repeat: repeat || 'none', anchor: t, seriesId: uid(), demo: true,
  });
  S.lessons = [
    lesson('sora', 'Tanaka Studio — brand intro call', '09:30', '10:15', 'Discovery questions; moodboard links', 'weekly'),
    lesson('hina', 'Yamamoto & Co. — homepage design review', '10:30', '11:30', 'Walk through hero + nav drafts', 'weekly'),
    lesson('emma', 'Emma Lim — working session (logo marks)', '12:00', '13:00', 'Refine two directions; export options', 'biweekly'),
    lesson('raj', 'Rajesh Menon — strategy workshop', '13:30', '14:40', 'Positioning and scope for new site', 'weekly'),
    lesson('kenta', 'Kenta Watanabe — milestone review', '15:00', '16:10', 'Phase 1 sign-off; next steps', 'weekly'),
    lesson('aiko', 'Aiko Chua — full project workshop', '16:30', '17:50', 'Deliverable deep-dive; timed review', 'weekly'),
  ];
  const noop = { save: () => {}, toast: () => {} };
  const o = { quiet: true, demo: true };
  receive(S, noop, 'olivia', "Hi! My co-founder and I are launching next spring and we'd love to talk about a brand and website. Do you offer an intro call?", new Date(now - 26 * H), o);
  receive(S, noop, 'sora', "Hi Mika! The team loved last week's directions. Could you resend the moodboard link? (This is Yuki from Tanaka Studio.)", new Date(now - 15 * H), o);
  receive(S, noop, 'raj', "Could we move next week's session to Friday at the same time? A work trip came up. Also, we approved the budget for phase 2!", new Date(now - 6 * H), o);
  receive(S, noop, 'aiko', "Urgent: our investor deck is due this Friday and I'm stuck on how to lay out the product section. Could we go over it before then?", new Date(now - 3 * H), o);
  S.messages.find((m) => m.sid === 'olivia').read = true;
  // Seed today's app usage so the Home usage card shows a believable day.
  // (External apps are illustrative demo data; BalanceConnect time is tracked for real.)
  S.usage[t] = { bc: 18, gdocs: 42, gclass: 25, gmail: 16, demo: true };
  // A week of recent usage so stepping the demo day still shows a plausible card.
  for (let i = 1; i <= 7; i++) {
    const key = dk(addDays(new Date(), -i));
    const dow = new Date(+sod(addDays(new Date(), -i))).getDay();
    if (dow === 0) { S.usage[key] = { bc: 4, gdocs: 8, gclass: 3, gmail: 5, demo: true }; continue; }
    S.usage[key] = {
      bc: 10 + Math.round(Math.abs(Math.sin(i)) * 14),
      gdocs: 30 + Math.round(Math.abs(Math.sin(i + 1)) * 30),
      gclass: 15 + Math.round(Math.abs(Math.sin(i + 2)) * 20),
      gmail: 10 + Math.round(Math.abs(Math.sin(i + 3)) * 15),
      demo: true,
    };
  }

  // ---- Rich, labelled demo history (~12 months) ----
  // A realistic weekly rhythm with a gentle improving trend so week/month/year
  // analytics all show meaningful values. Deterministic pseudo-random keeps the
  // data stable within a run while looking organic.
  const rnd = (seed) => { const x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const DAYS_BACK = 364;
  for (let i = 1; i <= DAYS_BACK; i++) {
    const d = sod(addDays(new Date(), -i));
    const dow = new Date(+d).getDay(); // 0 Sun … 6 Sat
    if (dow === 0) continue; // Sunday off — no teaching activity
    // `progress` 0 (a year ago) → 1 (recent). Boundaries improve over time:
    // after-hours share drops, Family Time and shutdowns become more consistent.
    const progress = 1 - i / DAYS_BACK;
    const weekend = dow === 6;
    const baseMsgs = weekend ? 1 : 2;
    const total = baseMsgs + Math.round(rnd(i) * (weekend ? 1 : 3)); // ~1–5 messages
    // After-hours share: ~55% a year ago → ~18% recently (+ a little noise).
    const afterShare = Math.max(0.1, 0.55 - 0.37 * progress + (rnd(i + 99) - 0.5) * 0.12);
    let after = 0;
    for (let j = 0; j < total; j++) {
      const isAfter = rnd(i * 10 + j) < afterShare;
      if (isAfter) after++;
      const hour = isAfter ? 21 + Math.floor(rnd(i + j) * 3) : 9 + Math.floor(rnd(i + j) * 8);
      const at = +d + hour * H + j * 7e5;
      act(S, 'msg', at, { after: isAfter, demo: true });
      if (isAfter) act(S, 'auto', at, { demo: true });
      // Replies: faster over time (720 min → ~90 min for after-hours; windows quick).
      const replyDelay = isAfter ? (720 - 540 * progress) : (100 + rnd(i + j) * 80);
      act(S, 'reply', at + replyDelay * 6e4, { dur: replyDelay, ok: !isAfter || rnd(i + j) > 0.3, demo: true });
    }
    // Family Time most evenings, longer as habits improve (60 → ~140 min).
    if (rnd(i + 7) < 0.55 + 0.35 * progress) {
      act(S, 'family', +d + 19 * H, { dur: Math.round(60 + 80 * progress + rnd(i) * 20), demo: true });
    }
    // End-of-day routine, more consistent recently.
    if (!weekend && rnd(i + 3) < 0.45 + 0.45 * progress) act(S, 'shutdown', +d + 18 * H, { demo: true });
    // A couple of working sessions a week (counts toward "work" time).
    if (!weekend && rnd(i + 5) < 0.4) act(S, 'session', +d + 13 * H, { dur: 30 + Math.round(rnd(i) * 40), demo: true });
  }
  return S;
}

const STORAGE_KEY = 'bc1';

// Ensure a settings object has every field the app relies on. Missing or
// malformed fields are backfilled from defaults so older or partial saves
// (and hand-edited localStorage) can never crash a view.
function sanitizeSettings(s) {
  const d = defaults();
  if (!s || typeof s !== 'object') return d;
  const day = (v, def) => (v && typeof v === 'object' && typeof v.s === 'string' && typeof v.e === 'string'
    ? { on: !!v.on, s: v.s, e: v.e } : def);
  const win = (w) => (w && typeof w.s === 'string' && typeof w.e === 'string' ? { s: w.s, e: w.e } : null);
  const windows = Array.isArray(s.windows) ? s.windows.map(win).filter(Boolean) : [];
  return {
    name: typeof s.name === 'string' ? s.name : d.name,
    subject: typeof s.subject === 'string' ? s.subject : d.subject,
    days: Array.isArray(s.days) && s.days.length === 7 ? s.days.map((v, i) => day(v, d.days[i])) : d.days,
    windows: windows.length ? windows : d.windows,
    family: { ...d.family, ...(s.family && typeof s.family === 'object' ? s.family : {}) },
    quiet: { ...d.quiet, ...(s.quiet && typeof s.quiet === 'object' ? s.quiet : {}) },
    auto: typeof s.auto === 'boolean' ? s.auto : d.auto,
    tpl: typeof s.tpl === 'string' ? s.tpl : d.tpl,
    urgent: ['hold', 'except_family', 'always'].includes(s.urgent) ? s.urgent : d.urgent,
    notif: typeof s.notif === 'boolean' ? s.notif : d.notif,
    quietAfterShutdown: typeof s.quietAfterShutdown === 'boolean' ? s.quietAfterShutdown : d.quietAfterShutdown,
    show: { ...d.show, ...(s.show && typeof s.show === 'object' ? s.show : {}) },
    typical: typeof s.typical === 'string' ? s.typical : d.typical,
  };
}

// Repair a loaded state object so every top-level collection exists and has the
// right shape. Anything unrecognisable falls back to a fresh seed.
function sanitizeState(S) {
  if (!S || typeof S !== 'object' || S.v !== 1) return null;
  const arr = (v) => (Array.isArray(v) ? v : []);
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  return {
    v: 1,
    onboarded: !!S.onboarded,
    theme: ['system', 'light', 'dark'].includes(S.theme) ? S.theme : 'system',
    demoOffset: Number.isFinite(S.demoOffset) ? S.demoOffset : 0,
    settings: sanitizeSettings(S.settings),
    includeDemo: typeof S.includeDemo === 'boolean' ? S.includeDemo : true,
    tip: Number.isFinite(S.tip) ? S.tip : 0,
    students: arr(S.students).filter((s) => s && typeof s.id === 'string' && typeof s.name === 'string'),
    messages: arr(S.messages).filter((m) => m && typeof m.id === 'string' && Array.isArray(m.thread)),
    lessons: arr(S.lessons).filter((l) => l && typeof l.id === 'string' && typeof l.date === 'string'),
    acts: arr(S.acts).filter((a) => a && typeof a.type === 'string' && Number.isFinite(a.at)),
    tasks: obj(S.tasks),
    shutdowns: obj(S.shutdowns),
    usage: obj(S.usage),
    family: { active: false, manual: false, start: null, endedOn: null, ...obj(S.family) },
    offlineUntil: Number.isFinite(S.offlineUntil) ? S.offlineUntil : null,
    rm: { active: false, start: null, done: [], skip: [], ...obj(S.rm) },
  };
}

export function load() {
  let raw;
  try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { raw = null; }
  const repaired = sanitizeState(raw);
  // If there were students but none survived sanitisation, keep the demo seed so
  // test messages always have a valid sender.
  if (repaired && repaired.students.length === 0) return seed();
  return repaired || seed();
}

// Returns true on success, false if persistence failed (e.g. storage full or
// disabled). Callers can surface this to the user instead of losing data silently.
export function save(S) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
    return true;
  } catch (e) {
    return false;
  }
}

export { STORAGE_KEY, sanitizeState, sanitizeSettings };

// Derived helpers
export const stuName = (S, id) => (S.students.find((s) => s.id === id) || { name: 'Unknown' }).name;
export const stu = (S, id) => S.students.find((s) => s.id === id) || { name: 'Unknown', email: '', course: '' };
export const AVC = ['var(--lav)', 'var(--sage-s)', 'var(--peach-s)', 'var(--rose-s)'];
export const avColor = (S, id) => { const i = Math.max(0, S.students.findIndex((s) => s.id === id)); return AVC[i % 4]; };
export { initials };
