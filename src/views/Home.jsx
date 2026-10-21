import React from 'react';
import { useStore } from '../store.jsx';
import { Avatar, IllLaptop } from '../components/ui.jsx';
import { dk, atDate, toMin, fmtT, dur, addDays } from '../lib/utils.js';
import { statusNow, nextFromNow, Avail } from '../lib/availability.js';
import { openMsgs } from '../lib/triage.js';
import { lessonsOn, upcomingOccurrence } from '../lib/schedule.js';
import { TIPS } from '../lib/state.js';

// App-usage sources shown on Home. BalanceConnect time is measured for real;
// the external apps are illustrative demo figures (a web app can't read other
// apps' usage).
const USAGE_APPS = [
  { key: 'gdocs', label: 'Google Docs', icon: '📄', color: '#4285F4' },
  { key: 'gclass', label: 'Google Classroom', icon: '🎓', color: '#1E8E3E' },
  { key: 'gmail', label: 'Gmail', icon: '✉️', color: '#EA4335' },
  { key: 'bc', label: 'BalanceConnect', icon: '🌿', color: 'var(--pur)' },
];

export default function Home() {
  const { S, go, mutate, stuName, setDemoDay, resetDemoDay, demoOffset } = useStore();
  const now = new Date(), h = now.getHours(), st = S.settings;
  const nowMin = h * 60 + now.getMinutes();
  const todayKey = dk(now);
  const [sk, sl] = statusNow(S);
  const g = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const tk = S.tasks[todayKey] || {};
  const open = openMsgs(S);
  const unread = S.messages.filter((m) => !m.read && m.status !== 'archived').length;

  const todayL = lessonsOn(S.lessons, todayKey);
  const up = upcomingOccurrence(S.lessons, todayKey, 60, true);
  const nx = nextFromNow(S);

  // Which of today's lessons is happening now / is next?
  const nowIdx = todayL.findIndex((l) => toMin(l.s) <= nowMin && nowMin < toMin(l.e));
  const nextIdx = todayL.findIndex((l) => toMin(l.s) > nowMin);
  const doneToday = todayL.filter((l) => toMin(l.e) <= nowMin).length;

  const tasks = [
    ['reply', 'Reply to waiting messages', `${open.length} waiting`],
    ['lessons', 'Teach today’s lessons', `${todayL.length} today`],
    ['prep', 'Prepare lesson materials', ''],
    ['admin', 'Update notes & admin', ''],
  ];
  const doneCount = Object.values(tk).filter(Boolean).length;

  // App usage for today.
  const usage = S.usage[todayKey] || {};
  const usageTotal = USAGE_APPS.reduce((a, x) => a + (usage[x.key] || 0), 0);
  const usageMax = Math.max(1, ...USAGE_APPS.map((x) => usage[x.key] || 0));

  const toggleTask = (k, checked) => mutate((S) => {
    const key = dk(new Date());
    (S.tasks[key] = S.tasks[key] || {})[k] = checked;
  });
  const nextTip = () => mutate((S) => { S.tip++; });

  return (
    <>
      <header className="row sp wrap">
        <div>
          <h1>{g}, {st.name}! 👋</h1>
          <p className="mut">{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <span className={`pill st-${sk}`}>{sl}</span>
      </header>

      {/* ===== Demo day picker — lets you preview any day/time ===== */}
      <section className="card demo-day" aria-label="Demo day">
        <div className="row sp wrap" style={{ gap: 10 }}>
          <div className="row" style={{ gap: 8 }}>
            <span className="chip c-demo" style={{ textTransform: 'none' }}>Demo</span>
            <label htmlFor="demo-date" className="sm" style={{ fontWeight: 600 }}>Preview day</label>
            <input
              id="demo-date"
              type="date"
              value={todayKey}
              onChange={(e) => { if (e.target.value) setDemoDay(e.target.value); }}
              style={{ width: 'auto' }}
            />
          </div>
          <div className="row wrap" style={{ gap: 6 }}>
            <button className="btn ghost sm" onClick={() => setDemoDay(dk(addDays(now, -1)))} aria-label="Previous day">← Day</button>
            <button className="btn ghost sm" onClick={() => setDemoDay(dk(addDays(now, 1)))} aria-label="Next day">Day →</button>
            {demoOffset !== 0 && <button className="btn ghost sm" onClick={resetDemoDay}>Back to today</button>}
          </div>
        </div>
        {demoOffset !== 0 && (
          <p className="mut">Previewing {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} — availability, Family Time and the schedule all follow this day. This is a demo control only.</p>
        )}
      </section>
      <section className="card" aria-label="Today's schedule">
        <div className="row sp">
          <h3>Today’s schedule</h3>
          <button className="btn ghost sm" onClick={() => go('schedule')}>Open schedule</button>
        </div>
        <p className="mut">
          {todayL.length
            ? `${todayL.length} lesson${todayL.length === 1 ? '' : 's'} · ${doneToday} done`
            : 'No lessons today — a lighter day.'}
        </p>
        {todayL.length > 0 && (
          <ol className="timeline" aria-label="Lessons today">
            {todayL.map((l, i) => {
              const state = i === nowIdx ? 'now' : toMin(l.e) <= nowMin ? 'done' : 'upcoming';
              return (
                <li key={l.occurrenceOf} className={`tl-item tl-${state}`}>
                  <span className="tl-time">{fmtT(l.s)}</span>
                  <span className="tl-dot" aria-hidden="true" />
                  <button className="tl-body" onClick={() => go('schedule', { date: todayKey, editId: l.occurrenceOf, editDate: todayKey })}>
                    <span className="row wrap" style={{ gap: 8 }}>
                      <b>{stuName(l.sid)}</b>
                      {state === 'now' && <span className="chip c-urgent" style={{ textTransform: 'none' }}>On now</span>}
                      {i === nextIdx && nowIdx === -1 && <span className="chip" style={{ textTransform: 'none' }}>Up next</span>}
                      {l.repeat && l.repeat !== 'none' && <span aria-hidden="true" title="Repeats">🔁</span>}
                    </span>
                    <span className="sm mut">{l.subject} · {fmtT(l.s)}–{fmtT(l.e)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="content-grid">
        <section className="card" style={{ flexDirection: 'row', alignItems: 'center', background: 'var(--lav)', border: 0 }}>
          <IllLaptop />
          <div className="grow">
            <b>Where things stand</b>
            <p className="sm">{open.length} message{open.length === 1 ? '' : 's'} waiting · {unread} unread.</p>
            <p className="sm">{sk === 'window' ? 'You’re in a reply window now.' : 'Next reply window: ' + (nx ? Avail.describe(nx) : 'none set') + '.'}</p>
          </div>
        </section>

        <section className="card">
          <div className="row sp"><h3>Today’s focus</h3><span className="mut">{doneCount}/4 done</span></div>
          {tasks.map(([k, l, hnt]) => (
            <label key={k} className={`check ${tk[k] ? 'done' : ''}`}>
              <input type="checkbox" checked={!!tk[k]} onChange={(e) => toggleTask(k, e.target.checked)} />
              <span className="grow">{l}{hnt ? <> <span className="mut">· {hnt}</span></> : null}</span>
            </label>
          ))}
        </section>

        <section className="card">
          <div className="row sp"><h3>Next lesson</h3><button className="btn ghost sm" onClick={() => go('schedule')}>Schedule</button></div>
          {up ? (
            <div className="row">
              <Avatar sid={up.sid} />
              <div className="grow">
                <b>{stuName(up.sid)}</b>
                <p className="sm">{up.subject}</p>
                <p className="mut">{up.date === todayKey ? 'Today' : atDate(up.date, '12:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtT(up.s)}–{fmtT(up.e)}</p>
              </div>
              <button className="btn sm" onClick={() => go('schedule', { date: up.date, editId: up.occurrenceOf, editDate: up.date })}>Details</button>
            </div>
          ) : <p className="mut">No upcoming lessons. Add one in Schedule.</p>}
        </section>

        <section className="card">
          <div className="row sp"><h3>Messages</h3><button className="btn sm" onClick={() => go('inbox')}>Open inbox</button></div>
          <div className="row">
            <div className="kpi grow"><b>{unread}</b><span className="mut">Unread</span></div>
            <div className="kpi grow"><b>{open.length}</b><span className="mut">Waiting</span></div>
            <div className="kpi grow"><b>{open.filter((m) => m.urgent).length}</b><span className="mut">Urgent</span></div>
          </div>
        </section>

        {/* ===== App usage ===== */}
        <section className="card span-2" aria-label="Time in apps today">
          <div className="row sp">
            <h3>Time in apps today</h3>
            <span className="mut">{usageTotal >= 1 ? dur(usageTotal) + ' total' : '—'}</span>
          </div>
          {USAGE_APPS.map((a) => {
            const mins = usage[a.key] || 0;
            return (
              <div key={a.key} className="row" style={{ gap: 12 }}>
                <span style={{ width: 150, flex: 'none' }} className="sm"><span aria-hidden="true">{a.icon}</span> {a.label}</span>
                <span className="grow bar" style={{ background: 'var(--bg-2)' }}>
                  <i style={{ width: Math.round((mins / usageMax) * 100) + '%', background: a.color }} />
                </span>
                <span className="sm" style={{ width: 56, flex: 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{mins >= 1 ? dur(mins) : '0 min'}</span>
              </div>
            );
          })}
          <p className="mut">BalanceConnect time is measured on this device. Google Docs, Classroom and Gmail
            figures are example data — a web app can’t read other apps’ usage without a browser extension or device permissions.</p>
        </section>

        <div className="row wrap span-2">
          <button className="btn sage grow" onClick={() => go('rm')}>Working mode</button>
          <button className="btn peach grow" onClick={() => go('family')}>Family Time</button>
          <button className="btn ghost grow" onClick={() => go('shutdown')}>End of day</button>
        </div>

        <section className="card span-2" style={{ background: 'var(--sage-s)', border: 0 }}>
          <div className="row sp"><h3>🌿 Well-being tip</h3><button className="btn ghost sm" onClick={nextTip}>Next tip</button></div>
          <p className="sm">{TIPS[S.tip % TIPS.length]}</p>
        </section>
      </div>
    </>
  );
}
