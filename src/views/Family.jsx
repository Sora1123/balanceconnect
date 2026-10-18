import React from 'react';
import { useStore } from '../store.jsx';
import { Head, IllFamily } from '../components/ui.jsx';
import { fmtT, fmtD, dk, atDate } from '../lib/utils.js';
import { Avail } from '../lib/availability.js';
import { openMsgs } from '../lib/triage.js';
import { startFamily, endFamily } from '../lib/actions.js';

export default function Family() {
  const { S, go, mutate, toast, confirmBox } = useStore();
  const st = S.settings, f = S.family, q = openMsgs(S);
  const nx = Avail.next(new Date(Math.max(Date.now(), ...(f.active ? [+atDate(dk(new Date()), st.family.e)] : []))), st);
  const sil = S.acts.filter((a) => a.type === 'silenced' && f.start && a.at >= f.start).length;

  const famStart = () => { mutate((S) => startFamily(S, true)); toast('💛 Family Time started'); };
  const famEnd = () => confirmBox(
    'End Family Time early?',
    'That’s completely fine. Your queued messages will be waiting. Family Time won’t restart by itself today.',
    'End now',
    () => { mutate((S) => endFamily(S, true)); go('home'); },
  );

  if (f.active) {
    const urgentPolicy = { hold: 'urgent messages wait too', except_family: 'urgent messages wait during Family Time', always: 'urgent messages still notify you' }[st.urgent];
    return (
      <>
        <Head title="Family Time" />
        <section className="card" style={{ background: 'var(--peach-s)', border: 0, textAlign: 'center', alignItems: 'center', gap: 12 }}>
          <IllFamily />
          <h2>You are in Family Time 💛</h2>
          <p className="mut">{f.manual ? 'Started ' + fmtD(f.start) : fmtT(st.family.s) + ' – ' + fmtT(st.family.e)}</p>
          <p className="sm" style={{ maxWidth: '32ch' }}>Notifications are silenced so you can be fully present with your loved ones.</p>
        </section>
        <section className="card">
          <p className="sm">{q.length} message{q.length === 1 ? ' is' : 's are'} safely queued. You’ll see them {nx ? Avail.describe(nx) : 'later'}.</p>
          <p className="mut">{sil} notification{sil === 1 ? '' : 's'} silenced this session. Urgent policy: {urgentPolicy}.</p>
        </section>
        <button className="btn ghost full" onClick={famEnd}>End Family Time early</button>
      </>
    );
  }

  return (
    <>
      <Head title="Family Time" />
      <section className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
        <IllFamily />
        <h3>Time for the people who matter</h3>
        <p className="sm">Scheduled daily {st.family.on ? fmtT(st.family.s) + ' – ' + fmtT(st.family.e) : '(off)'}. While the app is open, Family Time starts by itself at that time.</p>
        <p className="mut">Messages keep arriving in your inbox. Non-urgent alerts stay quiet.</p>
        <button className="btn peach full" onClick={famStart}>Start Family Time now</button>
      </section>
      <p className="mut">BalanceConnect only controls its own in-app alerts. It can’t change your phone’s Do Not Disturb settings or run on a schedule while closed.</p>
    </>
  );
}
