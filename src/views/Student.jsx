import React from 'react';
import { useStore } from '../store.jsx';
import { Head } from '../components/ui.jsx';
import { initials, DAYS, ORDER, fmtT } from '../lib/utils.js';
import { availableNow, nextFromNow, Avail } from '../lib/availability.js';
import { COURSES } from '../lib/state.js';

export default function Student() {
  const { S } = useStore();
  const st = S.settings, sh = st.show;
  const av_ = availableNow(S);
  const nx = nextFromNow(S);
  const wd = ORDER.filter((i) => st.days[i].on);
  const tracks = [...new Set(COURSES.map((c) => c.track))];

  return (
    <>
      <Head title="Student View" back="more" />
      <div className="warn"><span aria-hidden="true">👀 </span>This is a preview of what students and families see. A live student page would need login and a secure backend.</div>
      <section className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className="av" style={{ width: 72, height: 72, fontSize: 24, background: 'var(--lav)' }}>{initials(st.name)}</div>
        <h2>{st.name}</h2>
        <p className="mut">{st.subject}</p>
        <span className={`pill ${av_ ? 'st-window' : 'st-quiet'}`}>{av_ ? 'Available for messages now' : 'Away · replies ' + (nx ? Avail.describe(nx) : 'soon')}</span>
      </section>

      <section className="card">
        <h3>Lessons &amp; fees</h3>
        <p className="mut">1-on-1, online. Prices in Singapore dollars.</p>
        {tracks.map((track) => (
          <div key={track}>
            <p className="sm" style={{ marginTop: 6, fontWeight: 700 }}>{track === 'Non-native' ? 'For new learners of Japanese' : 'For native & heritage learners'}</p>
            {COURSES.filter((c) => c.track === track).map((c) => (
              <div key={c.id} className="row sp" style={{ alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--line)', gap: 12 }}>
                <div className="grow">
                  <b className="sm">{c.name}</b>
                  <p className="mut">{c.desc}</p>
                </div>
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <b className="sm" style={{ display: 'block' }}>${c.fee}</b>
                  <span className="mut">{c.mins} min</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      {sh.days && (
        <section className="card"><h3>Teaching days &amp; hours</h3>
          {wd.map((i) => <div key={i} className="row sp sm"><span>{DAYS[i]}</span><span>{fmtT(st.days[i].s)} – {fmtT(st.days[i].e)}</span></div>)}
        </section>
      )}
      {sh.windows && (
        <section className="card"><h3>When I reply to messages</h3>
          {st.windows.map((w, i) => <p key={i} className="sm">💬 {fmtT(w.s)} – {fmtT(w.e)} on teaching days</p>)}
        </section>
      )}
      {sh.resp && (
        <section className="card"><h3>Typical response time</h3><p className="sm">{st.typical}</p></section>
      )}
      <section className="card">
        <h3>Messaging outside these times</h3>
        <p className="sm">{st.auto ? 'You’ll get an automatic reply letting you know when to expect an answer. Your message is never lost.' : 'Your message will be answered in the next reply window.'}</p>
        <p className="sm"><b>Urgent?</b> Start your message with “Urgent” so it goes to the top of the queue.</p>
      </section>
    </>
  );
}
