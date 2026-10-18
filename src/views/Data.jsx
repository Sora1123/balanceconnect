import React from 'react';
import { useStore } from '../store.jsx';
import { Head } from '../components/ui.jsx';
import { seed } from '../lib/state.js';

export default function Data() {
  const { S, mutate, toast, confirmBox, setRoute } = useStore();

  const clearDemo = () => confirmBox(
    'Remove demo data?',
    'Demo students stay so your test messages still have senders. Demo messages, lessons and history are removed.',
    'Remove',
    () => {
      mutate((S) => {
        S.messages = S.messages.filter((x) => !x.demo);
        S.lessons = S.lessons.filter((x) => !x.demo);
        S.acts = S.acts.filter((x) => !x.demo);
      });
      toast('Demo data removed');
    },
  );

  const reset = () => confirmBox(
    'Reset everything?',
    'All settings, messages and activity on this device will be replaced with fresh demo data.',
    'Reset',
    () => {
      mutate((S) => { const fresh = seed(); Object.keys(S).forEach((k) => delete S[k]); Object.assign(S, fresh); });
      setRoute({ name: 'onboard' });
    },
  );

  return (
    <>
      <Head title="Data management" back="more" />
      <section className="card">
        <p className="sm">Everything is stored in this browser only. {S.messages.length} messages, {S.lessons.length} lessons, {S.acts.length} activity records ({S.acts.filter((a) => a.demo).length} demo).</p>
        <button className="btn ghost" onClick={clearDemo}>Remove demo data, keep my activity</button>
        <button className="btn danger" onClick={reset}>Reset to fresh demo</button>
      </section>
    </>
  );
}
