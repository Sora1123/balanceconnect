// App state: defaults, seeding, load/save, and derived helpers.
import { uid, dk, addDays, sod, initials } from './utils.js';
import { receive, act } from './intake.js';

export const TIPS = [
  'Batch your replies into windows. Students adapt quickly to a predictable rhythm.',
  'A 5-minute walk between lessons resets your focus more than scrolling does.',
  'Write tomorrow’s top three tasks before you close the laptop.',
  '“I’ll reply in my next window” is a complete, professional answer.',
  'Drink a glass of water before each lesson — your voice will thank you.',
  'Protect one evening a week with no screens at all.',
  'Turn recurring questions into a short FAQ you can share.',
  'Rest is part of the job. Tired teachers explain less clearly.',
];

export const SHUT = [
  ['msgs', 'All important messages replied to or queued'],
  ['plan', 'Tomorrow’s lesson plan ready'],
  ['admin', 'Administrative tasks updated'],
  ['auto', 'Automatic replies configured'],
  ['quiet', 'Family time or quiet hours activated'],
];

export function defaults() {
  const day = (on, s = '09:00', e = '17:00') => ({ on, s, e });
  return {
    name: 'Mika', subject: 'Japanese Language Teacher',
    days: [day(false, '10:00', '14:00'), day(true), day(true), day(true), day(true), day(true), day(true, '10:00', '14:00')],
    windows: [{ s: '09:00', e: '11:00' }, { s: '18:00', e: '19:00' }],
    family: { on: true, s: '19:00', e: '21:00', silence: true }, quiet: { on: true, s: '21:00', e: '08:00' },
    auto: true,
    tpl: "Hi! Thanks for your message. I'm currently offline and will reply {next}. For urgent matters, please write 'Urgent' in your message. – {name}",
    urgent: 'hold', notif: true, quietAfterShutdown: true, show: { days: true, windows: true, resp: true }, typical: 'Within 24 hours during working hours',
  };
}

export function seed() {
  const S = {
    v: 1, onboarded: false, settings: defaults(), includeDemo: true, tip: new Date().getDate() % TIPS.length,
    students: [
      { id: 'yuki', name: 'Yuki Tanaka', course: 'JLPT N4 prep', active: true, demo: true },
      { id: 'kenji', name: 'Kenji Sato', course: 'Conversation', active: true, demo: true },
      { id: 'aoi', name: 'Aoi Nakamura', course: 'Prospective student', active: false, isNew: true, demo: true },
      { id: 'hana', name: 'Hana Suzuki', course: 'JLPT N3 prep', active: true, demo: true },
    ],
    messages: [], lessons: [], acts: [], tasks: {}, shutdowns: {},
    family: { active: false, manual: false, start: null, endedOn: null }, offlineUntil: null, rm: { active: false, start: null, done: [], skip: [] },
  };
  const now = Date.now(), H = 36e5, t = dk(new Date()), t1 = dk(addDays(new Date(), 1)), t2 = dk(addDays(new Date(), 2));
  S.lessons = [
    { id: uid(), sid: 'yuki', subject: 'JLPT N4 grammar', date: t, s: '11:30', e: '12:30', notes: 'Te-form review', demo: true },
    { id: uid(), sid: 'kenji', subject: 'Conversation practice', date: t, s: '14:00', e: '15:00', notes: '', demo: true },
    { id: uid(), sid: 'hana', subject: 'JLPT N3 mock exam', date: t1, s: '15:30', e: '16:30', notes: 'Bring listening section', demo: true },
    { id: uid(), sid: 'aoi', subject: 'Trial lesson', date: t2, s: '13:00', e: '13:30', notes: 'New student intro', demo: true },
  ];
  const noop = { save: () => {}, toast: () => {} };
  const o = { quiet: true, demo: true };
  receive(S, noop, 'aoi', "Hello! I'm interested in starting Japanese lessons. Do you offer a trial lesson, and what are your rates?", new Date(now - 26 * H), o);
  receive(S, noop, 'yuki', "Hi Mika-sensei, I'm stuck on question 4 of the homework. When do I use に vs で for locations?", new Date(now - 14 * H), o);
  receive(S, noop, 'kenji', "Could we reschedule Thursday's lesson to Friday at the same time? Something came up at work.", new Date(now - 5 * H), o);
  receive(S, noop, 'hana', "Urgent: my JLPT exam is this weekend and I'm confused about the listening section format. Could you help?", new Date(now - 3 * H), o);
  S.messages.find((m) => m.sid === 'aoi').read = true;
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
    settings: sanitizeSettings(S.settings),
    includeDemo: typeof S.includeDemo === 'boolean' ? S.includeDemo : true,
    tip: Number.isFinite(S.tip) ? S.tip : 0,
    students: arr(S.students).filter((s) => s && typeof s.id === 'string' && typeof s.name === 'string'),
    messages: arr(S.messages).filter((m) => m && typeof m.id === 'string' && Array.isArray(m.thread)),
    lessons: arr(S.lessons).filter((l) => l && typeof l.id === 'string' && typeof l.date === 'string'),
    acts: arr(S.acts).filter((a) => a && typeof a.type === 'string' && Number.isFinite(a.at)),
    tasks: obj(S.tasks),
    shutdowns: obj(S.shutdowns),
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
