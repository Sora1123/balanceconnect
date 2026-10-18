import React from 'react';
import { useStore } from '../store.jsx';
import { Head, Avatar } from '../components/ui.jsx';
import { fmtT, fmtD, pct } from '../lib/utils.js';
import { Avail, nextFromNow } from '../lib/availability.js';
import { CAT, openMsgs, byTriage, tier } from '../lib/triage.js';
import { act } from '../lib/intake.js';

export default function ResponseMode() {
  const { S, go, mutate, save, toast, stuName } = useStore();
  const st = S.settings, now = new Date(), w = Avail.win(now, st), rm = S.rm;

  const queue = byTriage(openMsgs(S).filter((m) => !rm.done.includes(m.id)));
  const sk = queue.filter((m) => rm.skip.includes(m.id));
  const q = [...queue.filter((m) => !rm.skip.includes(m.id)), ...sk];
  const grp = { urgent: 0, scheduling: 0, existing: 0, enquiry: 0, other: 0 };
  q.forEach((m) => grp[tier(m)]++);
  const done = rm.done.length, total = done + q.length;

  const rmStart = () => mutate((S) => { S.rm = { active: true, start: Date.now(), done: [], skip: [] }; });
  const rmOpen = (id) => { mutate((S) => { const x = S.messages.find((y) => y.id === id); if (x) x.read = true; }); go('msg', { id, back: 'rm' }); };
  const rmSkip = (id) => mutate((S) => { const s = S.rm.skip; s.includes(id) ? s.splice(s.indexOf(id), 1) : s.push(id); });
  const rmFol = (id) => { mutate((S) => { const x = S.messages.find((y) => y.id === id); x.status = 'followup'; if (!S.rm.done.includes(id)) S.rm.done.push(id); }); toast('Marked for follow-up'); };
  const rmNext = () => { if (q.length) rmOpen(q[0].id); };
  const rmExit = () => {
    const n = S.rm.done.length;
    mutate((S) => { act(S, 'session', S.rm.start, { dur: (Date.now() - S.rm.start) / 6e4 }); S.rm = { active: false, start: null, done: [], skip: [] }; });
    toast(`Session ended · ${n} processed`);
    go('home');
  };

  if (!rm.active) {
    const nx = nextFromNow(S);
    const inWin = w && Avail.windowTime(now, st);
    return (
      <>
        <Head title="Response Window" />
        <section className="card">
          <h3>{inWin ? `You’re in your ${fmtT(w.s)}–${fmtT(w.e)} window` : 'No window is active right now'}</h3>
          <p className="sm">{inWin ? 'Work through your queue in priority order. Progress updates as you reply.' : `Your next window starts ${nx ? Avail.describe(nx) : 'once you set one in Settings'}. You can still start a session now.`}</p>
          <p className="mut">{q.length} message{q.length === 1 ? '' : 's'} waiting.</p>
          <button className="btn sage full" onClick={rmStart}>Start response session</button>
        </section>
      </>
    );
  }

  return (
    <>
      <Head title="Response Window" />
      <section className="card">
        <div className="row sp"><b>{w ? `${fmtT(w.s)} – ${fmtT(w.e)}` : 'Manual session'}</b><span className="mut">Started {fmtD(rm.start)}</span></div>
        <div className="bar"><i style={{ width: pct(done, total) + '%' }} /></div>
        <div className="row sp sm"><span>{done} processed</span><span>{q.length} remaining</span></div>
      </section>
      <section className="card">
        <h3>Suggested order</h3>
        {Object.entries(grp).map(([k, n]) => (
          <div key={k} className="row sp sm"><span>{CAT[k][0]}</span><b>{n}</b></div>
        ))}
      </section>
      <section className="card" style={{ padding: '4px 12px' }}>
        <div className="list">
          {q.length ? q.map((m, i) => (
            <div key={m.id} className="mrow" style={{ cursor: 'default' }}>
              <Avatar sid={m.sid} />
              <div className="grow">
                <div className="row sp">
                  <b>{i + 1}. {stuName(m.sid)}</b>
                  {m.urgent ? <span className="chip c-urgent">Urgent</span> : <span className="chip">{CAT[m.cat][0]}</span>}
                </div>
                <div className="pv">{m.thread[0].t}</div>
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  <button className="btn sm" onClick={() => rmOpen(m.id)}>Reply</button>
                  <button className="btn ghost sm" onClick={() => rmSkip(m.id)}>{rm.skip.includes(m.id) ? 'Skipped' : 'Skip'}</button>
                  <button className="btn ghost sm" onClick={() => rmFol(m.id)}>Follow-up</button>
                </div>
              </div>
            </div>
          )) : <div className="ok" style={{ margin: '12px 0' }}>All caught up. Nice work! 🎉</div>}
        </div>
      </section>
      <div className="row">
        <button className="btn grow" onClick={rmNext} disabled={!q.length}>Process next</button>
        <button className="btn ghost grow" onClick={rmExit}>Exit response mode</button>
      </div>
    </>
  );
}
