import React from 'react';
import { useStore } from '../store.jsx';
import { Head } from '../components/ui.jsx';
import { initials, DAYS, ORDER, fmtT } from '../lib/utils.js';
import { availableNow, nextFromNow, Avail } from '../lib/availability.js';

export default function Student() {
  const { S } = useStore();
  const st = S.settings, sh = st.show;
  const av_ = availableNow(S);
  const nx = nextFromNow(S);
  const wd = ORDER.filter((i) => st.days[i].on);

  return (
    <>
      <Head title="Student View" back="more" />
      <div className="warn">Preview of what students see. A real student page needs login, a backend and access controls.</div>
      <section className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className="av" style={{ width: 72, height: 72, fontSize: 24, background: 'var(--lav)' }}>{initials(st.name)}</div>
        <h2>{st.name}</h2>
        <p className="mut">{st.subject}</p>
        <span className={`pill ${av_ ? 'st-window' : 'st-quiet'}`}>{av_ ? 'Available for messages now' : 'Away · replies ' + (nx ? Avail.describe(nx) : 'soon')}</span>
      </section>
      {sh.days && (
        <section className="card"><h3>Working days & hours</h3>
          {wd.map((i) => <div key={i} className="row sp sm"><span>{DAYS[i]}</span><span>{fmtT(st.days[i].s)} – {fmtT(st.days[i].e)}</span></div>)}
        </section>
      )}
      {sh.windows && (
        <section className="card"><h3>When I reply to messages</h3>
          {st.windows.map((w, i) => <p key={i} className="sm">💬 {fmtT(w.s)} – {fmtT(w.e)} on working days</p>)}
        </section>
      )}
      {sh.resp && (
        <section className="card"><h3>Typical response time</h3><p className="sm">{st.typical}</p></section>
      )}
      <section className="card">
        <h3>Messaging outside these times</h3>
        <p className="sm">{st.auto ? 'You’ll get an automatic reply telling you when to expect an answer. Your message is never lost.' : 'Your message will be answered in the next reply window.'}</p>
        <p className="sm"><b>Urgent?</b> Start your message with “Urgent” so it goes to the top of the queue.</p>
      </section>
    </>
  );
}
