import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { Head, IllFamily } from '../components/ui.jsx';
import { fmtD, fmtT, dk } from '../lib/utils.js';
import { Avail } from '../lib/availability.js';
import { SHUT, TIPS } from '../lib/state.js';
import { completeShutdown } from '../lib/actions.js';

export default function Shutdown() {
  const { S, mutate, toast } = useStore();
  const [chk, setChk] = useState({});
  const [again, setAgain] = useState(false);

  const k = dk(new Date());
  const done = S.shutdowns[k];
  const unhandled = S.messages.filter((m) => m.status === 'awaiting').length;
  const n = SHUT.filter(([i]) => chk[i]).length;

  if (done && !again) {
    return (
      <>
        <Head title="End of Day" />
        <section className="card" style={{ textAlign: 'center', alignItems: 'center', background: 'var(--sage-s)', border: 0 }}>
          <IllFamily />
          <h2>You’re done for today 🌙</h2>
          <p className="sm">Wrapped up at {fmtD(done.at)} with {done.items.length}/5 items checked.</p>
          <p className="sm">{S.offlineUntil > Date.now() ? 'Quiet mode is on until ' + Avail.describe(new Date(S.offlineUntil)) + '.' : ''}</p>
          <p className="mut">{TIPS[(S.tip + 3) % TIPS.length]}</p>
        </section>
        <button className="btn ghost full" onClick={() => { setAgain(true); setChk({}); }}>Review checklist again</button>
      </>
    );
  }

  const hint = {
    msgs: unhandled ? `${unhandled} still awaiting a reply. Queued messages already count as handled.` : 'Everything is replied to or queued.',
    auto: S.settings.auto ? 'Automatic replies are on.' : 'Automatic replies are off. Turn them on in Settings.',
    quiet: S.settings.quiet.on ? `Quiet hours from ${fmtT(S.settings.quiet.s)}.` : 'Quiet hours are off.',
  };

  const shutDone = () => {
    mutate((S) => completeShutdown(S, chk));
    setAgain(false);
    toast('Saved. Enjoy your evening 🌙');
  };

  return (
    <>
      <Head title="End of Day" />
      <section className="card">
        <h3>Shutdown routine</h3>
        <div className="bar"><i style={{ width: n * 20 + '%' }} /></div>
        <p className="mut">{n} of 5 complete</p>
        {SHUT.map(([i, l]) => (
          <label key={i} className={`check ${chk[i] ? 'done' : ''}`}>
            <input type="checkbox" checked={!!chk[i]} onChange={(e) => setChk((c) => ({ ...c, [i]: e.target.checked }))} />
            <div>
              <span>{l}</span>
              {hint[i] && <p className="mut">{hint[i]}</p>}
            </div>
          </label>
        ))}
      </section>
      <button className="btn full" onClick={shutDone}>I’m Done for Today</button>
    </>
  );
}
