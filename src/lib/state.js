// App state: defaults, seeding, load/save, and derived helpers.
import { uid, dk, addDays, sod, initials } from './utils.js';
import { receive, act } from './intake.js';

export const TIPS = [
  'Batch your replies into windows. Families adapt quickly to a predictable rhythm.',
  'A 5-minute walk between lessons resets your focus more than scrolling does.',
  'Write tomorrow’s top three tasks before you close the laptop.',
  '“I’ll reply in my next window” is a complete, professional answer.',
  'Drink a glass of water before each lesson — your voice will thank you.',
  'Protect one evening a week with no screens at all.',
  'Turn recurring parent questions into a short FAQ you can share.',
  'Rest is part of the job. A tired sensei explains less clearly.',
  'Every learner has their own story. You don’t have to carry all of them at once.',
];

export const SHUT = [
  ['msgs', 'All important messages replied to or queued'],
  ['plan', 'Tomorrow’s lesson materials ready'],
  ['admin', 'Invoices and notes updated'],
  ['auto', 'Automatic replies configured'],
  ['quiet', 'Family time or quiet hours activated'],
];

// Mika's course catalogue (HIPPOCAMPUS). Durations and fees in SGD mirror her
// published 1-on-1 / online lesson fees. `track` groups non-native vs native.
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

export function defaults() {
  const day = (on, s = '09:00', e = '17:00') => ({ on, s, e });
  return {
    name: 'Mika', subject: 'HIPPOCAMPUS · Japanese Language Educator',
    // Teaching Tue–Sat (common for after-school / family lessons in Singapore);
    // Sunday off, Monday a shorter day.
    days: [day(false, '10:00', '14:00'), day(true, '10:00', '15:00'), day(true), day(true), day(true), day(true), day(true, '09:30', '15:00')],
    windows: [{ s: '09:00', e: '10:00' }, { s: '17:00', e: '18:00' }],
    family: { on: true, s: '18:30', e: '20:30', silence: true }, quiet: { on: true, s: '21:00', e: '08:00' },
    auto: true,
    tpl: "Thank you for your message! I'm with a learner or away from my desk right now, and I'll reply {next}. If it's urgent, please include the word 'Urgent'. Warm regards, {name} (HIPPOCAMPUS)",
    urgent: 'hold', notif: true, quietAfterShutdown: true, show: { days: true, windows: true, resp: true },
    typical: 'Within one working day',
  };
}

export function seed() {
  const S = {
    v: 1, onboarded: false, theme: 'system', demoOffset: 0, settings: defaults(), includeDemo: true, tip: new Date().getDate() % TIPS.length,
    students: [
      // A mix across Mika's real course types. For young children the contact is a parent.
      { id: 'sora', name: 'Sora (Tanaka family)', course: 'Japanese for Children', courseId: 'children', contact: 'parent', active: true, demo: true },
      { id: 'emma', name: 'Emma Lim', course: 'Everyday Japanese', courseId: 'everyday', active: true, demo: true },
      { id: 'raj', name: 'Rajesh Menon', course: 'Business & JLPT N3', courseId: 'business', active: true, demo: true },
      { id: 'hina', name: 'Hina (Yamamoto family)', course: 'First Language · Primary Y5', courseId: 'primary', contact: 'parent', active: true, demo: true },
      { id: 'kenta', name: 'Kenta Watanabe', course: 'Returnee prep · Secondary Y9', courseId: 'secondary', active: true, demo: true },
      { id: 'aiko', name: 'Aiko Chua', course: 'IBDP Japanese A: Literature', courseId: 'ibdp', active: true, demo: true },
      { id: 'olivia', name: 'Olivia Tan', course: 'Prospective student', courseId: 'everyday', isNew: true, active: false, demo: true },
    ],
    messages: [], lessons: [], acts: [], tasks: {}, shutdowns: {}, usage: {},
    family: { active: false, manual: false, start: null, endedOn: null }, offlineUntil: null, rm: { active: false, start: null, done: [], skip: [] },
  };
  const now = Date.now(), H = 36e5, today = new Date(), t = dk(today);
  // A realistic full teaching day for Mika. Most lessons recur on a fixed cadence
  // (weekly or biweekly), which is how regular students are usually scheduled.
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
  // Seed today's app usage so the Home usage card shows a believable day.
  // (External apps are illustrative demo data; BalanceConnect time is tracked for real.)
  S.usage[t] = { bc: 18, gdocs: 42, gclass: 25, gmail: 16, demo: true };
  // labelled demo history: earlier week busier after hours, so insights have something to compare
  for (let i = 1; i <= 13; i++) {
    const d = sod(addDays(new Date(), -i)), k = i > 6 ? 2 : 1;
    for (let j = 0; j < 3; j++) {
      const after = j < k; const at = +d + (after ? 22 : 10) * H + j * 6e5;
      act(S, 'msg', at, { after, demo: true }); if (after) act(S, 'auto', at, { demo: true });
      act(S, 'reply', at + (after ? 11 : 2) * H, { dur: after ? 660 : 120, ok: true, demo: true });
    }
    if (i % 2 === 0 || i < 4) act(S, 'family', +d + 19 * H, { dur: i < 7 ? 120 : 60, demo: true });
    if (i % 3 !== 0) act(S, 'shutdown', +d + 18 * H, { demo: true });
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
export const stu = (S, id) => S.students.find((s) => s.id === id) || { name: 'Unknown', course: '' };
export const AVC = ['var(--lav)', 'var(--sage-s)', 'var(--peach-s)', 'var(--rose-s)'];
export const avColor = (S, id) => { const i = Math.max(0, S.students.findIndex((s) => s.id === id)); return AVC[i % 4]; };
export { initials };
