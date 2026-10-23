import React from 'react';
import { useStore } from '../store.jsx';
import { Head } from '../components/ui.jsx';
import { seed } from '../lib/state.js';

export default function Data() {
  const { S, mutate, toast, confirmBox, setRoute } = useStore();

  const clearDemo = () => confirmBox(
    'Remove the demo data?',
    'This clears the example emails, appointments and history. The demo clients stay so your own test emails still have someone to come from. Your real activity is kept.',
    'Remove demo data',
    () => {
      mutate((S) => {
        S.messages = S.messages.filter((x) => !x.demo);
        S.lessons = S.lessons.filter((x) => !x.demo);
        S.acts = S.acts.filter((x) => !x.demo);
      });
      toast('Demo data removed');
    },
    { danger: true },
  );

  const reset = () => confirmBox(
    'Start over from scratch?',
    'This permanently replaces everything on this device — your settings, emails, appointments and history — with the original demo content. This cannot be undone.',
    'Reset everything',
    () => {
      mutate((S) => {
        const fresh = seed();
        fresh.onboarded = true;
        Object.keys(S).forEach((k) => delete S[k]);
        Object.assign(S, fresh);
      });
      toast('Everything was reset to the demo');
      setRoute({ name: 'home' });
    },
    { danger: true },
  );

  return (
    <>
      <Head title="Your data" back="more" />
      <section className="card">
        <h3>Where your data lives</h3>
        <p className="sm">Everything is saved only in this web browser on this device. Nothing is sent
          anywhere. If you clear your browser data, it will be removed.</p>
        <p className="mut">Currently stored: {S.messages.length} emails, {S.lessons.length} appointments,
          and {S.acts.length} activity records ({S.acts.filter((a) => a.demo).length} from the demo).</p>
      </section>
      <section className="card">
        <h3>Manage data</h3>
        <button className="btn ghost full" onClick={clearDemo}>Remove demo data, keep my own</button>
        <button className="btn danger full" onClick={reset}>Reset everything to the demo</button>
      </section>
    </>
  );
}
