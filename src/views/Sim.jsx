import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { Head } from '../components/ui.jsx';
import { fmtD, dk, atDate, addDays, minOf, toMin } from '../lib/utils.js';
import { Avail } from '../lib/availability.js';
import { receive } from '../lib/intake.js';
import { completeShutdown } from '../lib/actions.js';

const SCN_LABELS = ['In response window', 'After working hours', 'During family time', 'Urgent in quiet hours', 'Non-working day', 'Before next window', 'Complete shutdown'];

// Build a scenario by mutating S. Returns a log entry. Mirrors original scenario().
function runScenario(S, save, stuName, n) {
  const st = S.settings, now = new Date();
  let at, text, sid, title;
  const free = (from, ok) => { let t = new Date(from); for (let i = 0; i < 288 * 7; i++) { if (ok(t)) return t; t = new Date(+t + 3e5); } return from; };

  switch (n) {
    case 1: title = 'During a response window'; at = Avail.next(now, st) || now; sid = 'emma'; text = 'Is the vocab quiz still on for our next lesson?'; break;
    case 2: title = 'After working hours'; at = free(now, (t) => !Avail.working(t, st) && !Avail.windowTime(t, st) && !Avail.inFamily(t, st) && !Avail.inQuiet(t, st) && st.days[t.getDay()].on && minOf(t) > toMin(st.days[t.getDay()].s)); sid = 'kenta'; text = 'Quick question about the textbook chapter for next week.'; break;
    case 3: title = 'During family time'; at = free(now, (t) => Avail.inFamily(t, st)); sid = 'emma'; text = 'Thanks for today! I’ve uploaded my writing practice.'; break;
    case 4: title = 'Urgent, during quiet hours'; at = free(now, (t) => Avail.inQuiet(t, st)); sid = 'aiko'; text = 'URGENT: my IB mock is tomorrow morning and I can’t find the essay structure notes!'; break;
    case 5: {
      title = 'On a non-working day'; let d = null;
      for (let i = 0; i < 7; i++) { const x = addDays(now, i); if (!st.days[x.getDay()].on) { d = x; break; } }
      if (!d) return { title, info: 'Every day is a working day, so there is no non-working day to test.' };
      at = atDate(dk(d), '12:00'); sid = 'olivia'; text = 'Hi, could I book a trial lesson next week?'; break;
    }
    case 6: {
      title = 'Just before the next window'; const nx = Avail.next(addDays(now, 0), st);
      at = nx ? new Date(+nx - 30 * 6e4) : now; if (Avail.windowTime(at, st)) at = new Date(+at - 60 * 6e4);
      sid = 'kenta'; text = 'Can we move tomorrow’s lesson 30 minutes later?'; break;
    }
    case 7: {
      const chk = {}; (S.settings.shutdownItems || []).forEach((it) => { chk[it.key] = true; });
      completeShutdown(S, chk); save();
      return { title: 'Shutdown routine completed', info: `Saved at ${fmtD(Date.now())}. ${S.offlineUntil > Date.now() ? 'Quiet mode on until ' + Avail.describe(new Date(S.offlineUntil)) + '.' : 'Quiet-after-shutdown is off in Settings.'}` };
    }
    default: return { title: 'Unknown scenario' };
  }
  const r = receive(S, { save, toast: () => {} }, sid, text, at, { sim: true, quiet: true });
  save();
  return { title, at: +at, status: r.m.status, auto: r.auto, note: r.note, next: r.next, urgent: r.m.urgent, who: stuName(sid) };
}

function LogEntry({ r }) {
  return (
    <section className="card">
      <b>{r.title}</b>
      {r.info ? <p className="sm">{r.info}</p> : (
        <>
          <p className="sm">{r.who} · {new Date(r.at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} {fmtD(r.at)}</p>
          <div className="row wrap" style={{ gap: 4 }}>
            <span className={`chip c-${r.status}`}>{r.status === 'queued' ? 'Queued' : 'Awaiting reply'}</span>
            {r.urgent && <span className="chip c-urgent">Urgent</span>}
            <span className={`chip ${r.note === 'notify' ? 'c-replied' : 'c-archived'}`}>{r.note === 'notify' ? 'Notified' : 'Notification silenced'}</span>
          </div>
          {r.auto ? <div className="bub a" style={{ maxWidth: '100%' }}>{r.auto}</div> : <p className="mut">No automatic reply: you were available (or auto-reply is off).</p>}
          {r.next && <p className="mut">Next response window: {new Date(r.next).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} {fmtD(r.next)}</p>}
        </>
      )}
    </section>
  );
}

export default function Sim() {
  const { S, mutate, save, toast, stuName } = useStore();
  const [log, setLog] = useState([]);
  const [tSid, setTSid] = useState(S.students[0]?.id);
  const [tTxt, setTTxt] = useState('Hi Mika, quick question about today’s homework.');
  const [tAt, setTAt] = useState('');

  const scn = (i) => {
    let entry;
    mutate((S) => { entry = runScenario(S, () => save(), (id) => stuName(id), i); });
    setLog((l) => [entry, ...l]);
  };

  const tsend = () => {
    const t = tTxt.trim();
    if (!t) { toast('Write an email first'); return; }
    const at = tAt ? new Date(tAt) : new Date();
    let r;
    mutate((S) => { r = receive(S, { save: () => save(), toast: () => {} }, tSid, t, at, { sim: true, quiet: !!tAt }); });
    setLog((l) => [{ title: 'Custom test email', at: +at, status: r.m.status, auto: r.auto, note: r.note, next: r.next, urgent: r.m.urgent, who: stuName(r.m.sid) }, ...l]);
  };

  return (
    <>
      <Head title="Test scenarios" back="more" />
      <p className="sm">Each button creates a test email at a time chosen from <b>your saved schedule</b>, then runs the same intake logic as a real collected email.</p>
      <div className="row wrap" style={{ gap: 6 }}>
        {SCN_LABELS.map((l, i) => (
          <button key={i} className="btn ghost sm" onClick={() => scn(i + 1)}>{i + 1}. {l}</button>
        ))}
      </div>
      <section className="card">
        <h3>Add a test email</h3>
        <label className="sm">From
          <select value={tSid} onChange={(e) => setTSid(e.target.value)}>
            {S.students.map((s) => <option key={s.id} value={s.id}>{s.name}{s.email ? ` · ${s.email}` : ''}</option>)}
          </select>
        </label>
        <label className="sm">Email<textarea value={tTxt} onChange={(e) => setTTxt(e.target.value)} /></label>
        <label className="sm">Arrives<input type="datetime-local" value={tAt} onChange={(e) => setTAt(e.target.value)} /></label>
        <p className="mut">Leave blank to arrive now (uses live Family Time and shutdown state).</p>
        <button className="btn" onClick={tsend}>Add test email</button>
      </section>
      {log.map((r, i) => <LogEntry key={i} r={r} />)}
    </>
  );
}
