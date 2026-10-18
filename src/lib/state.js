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

export function load() {
  let S;
  try { S = JSON.parse(localStorage.getItem('bc1')); } catch (e) { /* ignore */ }
  if (!S || S.v !== 1) S = seed();
  return S;
}

export function save(S) { try { localStorage.setItem('bc1', JSON.stringify(S)); } catch (e) { /* ignore */ } }

// Derived helpers
export const stuName = (S, id) => (S.students.find((s) => s.id === id) || { name: 'Unknown' }).name;
export const stu = (S, id) => S.students.find((s) => s.id === id) || { name: 'Unknown', course: '' };
export const AVC = ['var(--lav)', 'var(--sage-s)', 'var(--peach-s)', 'var(--rose-s)'];
export const avColor = (S, id) => { const i = Math.max(0, S.students.findIndex((s) => s.id === id)); return AVC[i % 4]; };
export { initials };
