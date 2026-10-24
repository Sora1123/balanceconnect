// App state: defaults, seeding, load/save, and derived helpers.
import { uid, dk, addDays, sod, initials } from './utils.js';
import { receive, act } from './intake.js';

export const TIPS = [
  'Batch your replies into windows. Students and families adapt quickly to a predictable rhythm.',
  'A 5-minute walk between lessons resets your focus more than scrolling does.',
  'Write tomorrow’s top three tasks before you close the laptop.',
  '“I’ll reply in my next window” is a complete, professional answer.',
  'Drink a glass of water before each lesson — your voice will thank you.',
  'Protect one evening a week with no screens at all.',
  'Turn recurring parent questions into a short FAQ you can send in one click.',
  'Rest is part of the job. A tired teacher explains less clearly.',
  'Every learner has their own story. You don’t have to carry all of them at once.',
];

export const SHUT = [
  ['msgs', 'All important emails replied to or queued'],
  ['plan', 'Tomorrow’s priorities noted'],
  ['admin', 'Invoices and notes updated'],
  ['auto', 'Automatic replies configured'],
  ['quiet', 'Family time or quiet hours activated'],
];

// Mika's lesson catalogue (she teaches Japanese 1-on-1, online). Durations and
// fees mirror her published rates; `track` groups non-native vs native/heritage
// learners. Used to default new appointment lengths.
export const COURSES = [
  // Courses for non-native learners
  { id: 'children', name: 'Japanese for Children', track: 'Non-native', mins: 45, fee: 55, desc: 'A fun, beginner-friendly first step into Japanese for young learners.' },
  { id: 'everyday', name: 'Everyday Japanese', track: 'Non-native', mins: 60, fee: 75, desc: 'Practical Japanese for travel, daily life and real conversations.' },
  { id: 'business', name: 'Japanese for Business & JLPT', track: 'Non-native', mins: 70, fee: 90, desc: 'Workplace Japanese and JLPT N5–N1 exam preparation.' },
  // Courses for native / heritage learners
  { id: 'preschool', name: 'Japanese as a First Language (Preschool)', track: 'Native', mins: 45, fee: 55, desc: 'Building blocks of reading, writing and expression through play.' },
  { id: 'primary', name: 'Primary First Language · Returnee · Pre-IB', track: 'Native', mins: 60, fee: 75, desc: 'Grade-level kokugo for Y3–Y8: first language, returnee prep, Pre-IB foundation.' },
  { id: 'secondary', name: 'Secondary First Language · Returnee · Pre-IB', track: 'Native', mins: 70, fee: 85, desc: 'Y9–Y11 kokugo: first language, returnee prep, Pre-IB practice.' },
  { id: 'ibdp', name: 'IBDP Japanese A / B', track: 'Native', mins: 80, fee: 120, desc: 'Exam support for Paper 1, Paper 2 and the Individual Oral.' },
];

export const COURSE_BY_ID = Object.fromEntries(COURSES.map((c) => [c.id, c]));

// Normalise a user-entered website into a tracked-app entry. Derives a stable
// key from the hostname and a friendly label. Returns null if unusable.
export function makeTrackedApp(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  let host;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    host = u.hostname.replace(/^www\./, '');
  } catch (e) {
    host = raw.replace(/^https?:\/\//i, '').replace(/^www\./, '').split('/')[0];
  }
  if (!host) return null;
  const label = host.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { key: `web:${host}`, url: host, label };
}

export function defaults() {
  const day = (on, s = '09:00', e = '17:00') => ({ on, s, e });
  return {
    name: 'Mika', subject: 'Japanese language teacher · 1-on-1, online',
    // Mika's teaching week: Sunday off, a short Monday, full Tue–Sat.
    days: [day(false, '10:00', '14:00'), day(true, '10:00', '15:00'), day(true), day(true), day(true), day(true), day(true, '09:30', '15:00')],
    windows: [{ s: '09:00', e: '10:00' }, { s: '17:00', e: '18:00' }],
    family: { on: true, s: '18:30', e: '20:30', silence: true }, quiet: { on: true, s: '21:00', e: '08:00' },
    auto: true,
    tpl: "Thank you for your email! I'm with a student or away from my desk right now, and I'll reply {next}. If it's urgent, please include the word 'Urgent'. Warm regards, {name}",
    urgent: 'hold', notif: true, quietAfterShutdown: true, show: { days: true, windows: true, resp: true },
    typical: 'Within one working day',
    // Websites/web apps the user measures. Each has a stable key, hostname and
    // friendly label (plus an optional colour/icon). Everything here appears in
    // the "Websites to measure" settings list and in the usage analytics.
    trackedApps: [
      { key: 'gdocs', url: 'docs.google.com', label: 'Google Docs', icon: '📄', color: '#4285F4' },
      { key: 'gclass', url: 'notion.so', label: 'Notion', icon: '🗂️', color: '#111111' },
      { key: 'gmail', url: 'mail.google.com', label: 'Gmail & Outlook', icon: '✉️', color: '#EA4335' },
      { key: 'web:classroom.google.com', url: 'classroom.google.com', label: 'Google Classroom' },
      { key: 'web:quizlet.com', url: 'quizlet.com', label: 'Quizlet' },
    ],
    // End-of-day checklist shown before "I'm done for today". Editable in
    // settings. The known keys (msgs/auto/quiet) also show a live hint.
    shutdownItems: [
      { key: 'msgs', label: 'All important emails replied to or queued' },
      { key: 'plan', label: 'Tomorrow’s lesson materials ready' },
      { key: 'admin', label: 'Invoices and notes updated' },
      { key: 'auto', label: 'Automatic replies configured' },
      { key: 'quiet', label: 'Family time or quiet hours activated' },
    ],
  };
}

export function seed() {
  const S = {
    v: 1, onboarded: false, theme: 'system', demoOffset: 0, settings: defaults(), includeDemo: true, tip: new Date().getDate() % TIPS.length,
    students: [
      // Mika's demo students. Emails are auto-collected from her connected
      // Gmail/Outlook mailbox; `email` is the address each message comes from.
      // For young learners the contact is a parent.
      { id: 'sora', name: 'Sora (Tanaka family)', email: 'yuki.tanaka@gmail.com', course: 'Japanese for Children', courseId: 'children', contact: 'parent', active: true, demo: true },
      { id: 'emma', name: 'Emma Lim', email: 'emma.lim@gmail.com', course: 'Everyday Japanese', courseId: 'everyday', active: true, demo: true },
      { id: 'raj', name: 'Rajesh Menon', email: 'rajesh.menon@outlook.com', course: 'Business & JLPT N3', courseId: 'business', active: true, demo: true },
      { id: 'hina', name: 'Hina (Yamamoto family)', email: 'yamamoto.family@outlook.com', course: 'First Language · Primary Y5', courseId: 'primary', contact: 'parent', active: true, demo: true },
      { id: 'kenta', name: 'Kenta Watanabe', email: 'k.watanabe@gmail.com', course: 'Returnee prep · Secondary Y9', courseId: 'secondary', active: true, demo: true },
      { id: 'aiko', name: 'Aiko Chua', email: 'aiko.chua@outlook.com', course: 'IBDP Japanese A: Literature', courseId: 'ibdp', active: true, demo: true },
      { id: 'olivia', name: 'Olivia Tan', email: 'olivia.tan@gmail.com', course: 'Prospective student', courseId: 'everyday', isNew: true, active: false, demo: true },
    ],
    messages: [], lessons: [], acts: [], tasks: {}, shutdowns: {}, usage: {},
    family: { active: false, manual: false, start: null, endedOn: null }, offlineUntil: null, rm: { active: false, start: null, done: [], skip: [] },
  };
  const now = Date.now(), H = 36e5, today = new Date(), t = dk(today);
  // A realistic full teaching day for Mika. Most lessons recur on a fixed
  // cadence (weekly or biweekly), which is how regular students are scheduled.
  // `repeat`: 'none' | 'weekly' | 'biweekly'; `anchor` is the first occurrence
  // date so biweekly parity is stable even as the week scrolls.
  const lesson = (sid, subject, s, e, notes, repeat) => ({
    id: uid(), sid, subject, date: t, s, e, notes: notes || '',
    repeat: repeat || 'none', anchor: t, seriesId: uid(), demo: true,
  });
  S.lessons = [
    lesson('sora', 'Japanese for Children — hiragana & greetings', '09:30', '10:15', 'Shiritori warm-up; review あ-row', 'weekly'),
    lesson('hina', 'First Language — 読解 (reading comprehension)', '10:30', '11:30', 'Mitsumura Y5 unit; kanji quiz', 'weekly'),
    lesson('emma', 'Everyday Japanese — ordering at a restaurant', '12:00', '13:00', 'Role-play; menu vocabulary', 'biweekly'),
    lesson('raj', 'Business & JLPT N3 — keigo role-play', '13:30', '14:40', 'Client phone-call scenarios', 'weekly'),
    lesson('kenta', 'Returnee prep — 作文 (essay writing)', '15:00', '16:10', 'Structure & interview practice', 'weekly'),
    lesson('aiko', 'IBDP Lit — Paper 1 unseen analysis', '16:30', '17:50', 'Prose extract; timed practice', 'weekly'),
  ];
  const noop = { save: () => {}, toast: () => {} };
  const o = { quiet: true, demo: true };
  receive(S, noop, 'olivia', "Hello! My husband and I are planning a trip to Japan next spring and would love to start Everyday Japanese lessons. Do you offer a trial lesson?", new Date(now - 26 * H), o);
  receive(S, noop, 'sora', "Hi Mika-sensei! Sora really enjoyed last week. He's been practising hiragana at home — could you share which app you recommended? (This is Sora's mum, Yuki.)", new Date(now - 15 * H), o);
  receive(S, noop, 'raj', "Could we move next week's lesson to Friday at the same time? A work trip came up. Also, I registered for JLPT N3 in December!", new Date(now - 6 * H), o);
  receive(S, noop, 'aiko', "Urgent: my IB Paper 1 mock is this Friday and I'm stuck on how to structure the analysis of an unseen prose extract. Could we go over it before then?", new Date(now - 3 * H), o);
  S.messages.find((m) => m.sid === 'olivia').read = true;

  // ---- Rich, labelled demo history for THIS YEAR (1 Jan → 30 Oct) ----
  // A realistic weekly rhythm with a gentle improving trend so week/month/year
  // analytics all show meaningful values, plus per-day app-usage (including the
  // seeded tracked websites). Deterministic pseudo-random keeps the data stable
  // within a run while looking organic.
  const rnd = (seed) => { const x = Math.sin(seed * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const year = today.getFullYear();
  const histStart = new Date(year, 0, 1);          // 1 January this year
  const histEnd = new Date(year, 9, 30);           // 30 October this year (month 9 = Oct)
  const spanDays = Math.round((+sod(histEnd) - +sod(histStart)) / 864e5);
  let i = 0;
  for (let d = sod(histStart); +d <= +sod(histEnd); d = sod(addDays(d, 1)), i++) {
    const dow = new Date(+d).getDay(); // 0 Sun … 6 Sat
    // `progress` 0 (January) → 1 (late October). Boundaries improve over time.
    const progress = spanDays ? i / spanDays : 1;
    const weekend = dow === 6;
    const key = dk(d);

    // Per-day app usage (minutes), trending up a little over the year. Websites
    // the user tracks get their own believable figures.
    if (dow === 0) {
      S.usage[key] = { bc: 4, gdocs: 8, gclass: 3, gmail: 5, 'web:classroom.google.com': 3, 'web:quizlet.com': 4, demo: true };
    } else {
      S.usage[key] = {
        bc: 10 + Math.round(Math.abs(Math.sin(i)) * 14),
        gdocs: 28 + Math.round(Math.abs(Math.sin(i + 1)) * 30 + progress * 10),
        gclass: 14 + Math.round(Math.abs(Math.sin(i + 2)) * 20),
        gmail: 10 + Math.round(Math.abs(Math.sin(i + 3)) * 15),
        'web:classroom.google.com': 12 + Math.round(Math.abs(Math.sin(i + 4)) * 22),
        'web:quizlet.com': 8 + Math.round(Math.abs(Math.sin(i + 5)) * 16),
        demo: true,
      };
    }

    if (dow === 0) continue; // Sunday off — no teaching activity
    const baseMsgs = weekend ? 1 : 2;
    const total = baseMsgs + Math.round(rnd(i) * (weekend ? 1 : 3)); // ~1–5 messages
    // After-hours share: ~55% in January → ~18% by late October (+ a little noise).
    const afterShare = Math.max(0.1, 0.55 - 0.37 * progress + (rnd(i + 99) - 0.5) * 0.12);
    for (let j = 0; j < total; j++) {
      const isAfter = rnd(i * 10 + j) < afterShare;
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
    trackedApps: Array.isArray(s.trackedApps)
      ? s.trackedApps
        .filter((a) => a && typeof a.key === 'string' && typeof a.label === 'string')
        .map((a) => ({
          key: a.key,
          url: typeof a.url === 'string' ? a.url : '',
          label: a.label,
          ...(typeof a.color === 'string' ? { color: a.color } : {}),
          ...(typeof a.icon === 'string' ? { icon: a.icon } : {}),
        }))
      : d.trackedApps,
    shutdownItems: (() => {
      const list = Array.isArray(s.shutdownItems)
        ? s.shutdownItems.filter((a) => a && typeof a.key === 'string' && typeof a.label === 'string').map((a) => ({ key: a.key, label: a.label }))
        : d.shutdownItems;
      return list.length ? list : d.shutdownItems;
    })(),
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
