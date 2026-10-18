import React from 'react';
import { useStore } from '../store.jsx';
import { Avatar, IllLaptop } from '../components/ui.jsx';
import { dk, atDate, toMin, fmtT } from '../lib/utils.js';
import { statusNow, nextFromNow } from '../lib/availability.js';
import { Avail } from '../lib/availability.js';
import { openMsgs } from '../lib/triage.js';
import { TIPS } from '../lib/state.js';

export default function Home() {
  const { S, go, mutate, stuName } = useStore();
  const now = new Date(), h = now.getHours(), st = S.settings;
  const [sk, sl] = statusNow(S);
  const g = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const tk = S.tasks[dk(now)] || {};
  const open = openMsgs(S);
  const unread = S.messages.filter((m) => !m.read && m.status !== 'archived').length;
  const todayL = S.lessons.filter((l) => l.date === dk(now)).sort((a, b) => toMin(a.s) - toMin(b.s));
  const up = S.lessons.filter((l) => +atDate(l.date, l.e) > Date.now()).sort((a, b) => atDate(a.date, a.s) - atDate(b.date, b.s))[0];
  const nx = nextFromNow(S);
  const tasks = [
    ['reply', 'Reply to pending messages', `${open.length} waiting`],
    ['lessons', 'Conduct scheduled lessons', `${todayL.length} today`],
    ['prep', 'Prepare lesson materials', ''],
    ['admin', 'Complete administrative tasks', ''],
  ];
  const doneCount = Object.values(tk).filter(Boolean).length;

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

      <div className="content-grid">
      <section className="card span-2" style={{ flexDirection: 'row', alignItems: 'center', background: 'var(--lav)', border: 0 }}>
        <IllLaptop />
        <div className="grow">
          <b>Your day at a glance</b>
          <p className="sm">{todayL.length} lesson{todayL.length === 1 ? '' : 's'} today · {open.length} message{open.length === 1 ? '' : 's'} waiting.</p>
          <p className="sm">{sk === 'window' ? 'You’re in a response window now.' : 'Next response window: ' + (nx ? Avail.describe(nx) : 'none set') + '.'}</p>
        </div>
      </section>

      <section className="card">
        <div className="row sp"><h3>Today’s Focus</h3><span className="mut">{doneCount}/4</span></div>
        {tasks.map(([k, l, hnt]) => (
          <label key={k} className={`check ${tk[k] ? 'done' : ''}`}>
            <input type="checkbox" checked={!!tk[k]} onChange={(e) => toggleTask(k, e.target.checked)} />
            <span className="grow">{l}{hnt ? <> <span className="mut">· {hnt}</span></> : null}</span>
          </label>
        ))}
      </section>

      <section className="card">
        <div className="row sp"><h3>Upcoming Lesson</h3><button className="btn ghost sm" onClick={() => go('schedule')}>Schedule</button></div>
        {up ? (
          <div className="row">
            <Avatar sid={up.sid} />
            <div className="grow">
              <b>{stuName(up.sid)}</b>
              <p className="sm">{up.subject}</p>
              <p className="mut">{up.date === dk(now) ? 'Today' : atDate(up.date, '12:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · {fmtT(up.s)}–{fmtT(up.e)}</p>
            </div>
            <button className="btn sm" onClick={() => go('schedule', { date: up.date, editId: up.id })}>Details</button>
          </div>
        ) : <p className="mut">No upcoming lessons. Add one in Schedule.</p>}
      </section>

      <section className="card">
        <div className="row sp"><h3>Messages</h3><button className="btn sm" onClick={() => go('inbox')}>Open inbox</button></div>
        <div className="row">
          <div className="kpi grow"><b>{unread}</b><span className="mut">Unread</span></div>
          <div className="kpi grow"><b>{open.length}</b><span className="mut">Pending</span></div>
          <div className="kpi grow"><b>{open.filter((m) => m.urgent).length}</b><span className="mut">Urgent</span></div>
        </div>
      </section>

      <div className="row wrap span-2">
        <button className="btn sage grow" onClick={() => go('rm')}>Response mode</button>
        <button className="btn peach grow" onClick={() => go('family')}>Family Time</button>
        <button className="btn ghost grow" onClick={() => go('shutdown')}>Shutdown</button>
      </div>

      <section className="card span-2" style={{ background: 'var(--sage-s)', border: 0 }}>
        <div className="row sp"><h3>🌿 Well-being tip</h3><button className="btn ghost sm" onClick={nextTip}>Next tip</button></div>
        <p className="sm">{TIPS[S.tip % TIPS.length]}</p>
      </section>
      </div>
    </>
  );
}
