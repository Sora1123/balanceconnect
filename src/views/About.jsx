import React from 'react';
import { Head } from '../components/ui.jsx';

export default function About() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <>
      <Head title="About" back="more" />
      <section className="card">
        <h3>BalanceConnect</h3>
        <p className="mut">Clear Boundaries. Meaningful Connections.</p>
        <p className="sm"><b>Works now:</b> schedule-aware availability, next-window calculation, automatic reply generation, triage, response mode, Family Time, shutdown routine, analytics from your saved activity, lesson scheduling with conflict checks.</p>
        <p className="sm"><b>Simulated:</b> student messages and automatic replies happen inside the app only. Nothing is sent by SMS, WhatsApp or email.</p>
        <p className="sm"><b>Needs a backend:</b> a real student page (login, database, access control) and syncing across devices.</p>
        <p className="sm"><b>Needs integrations:</b> real messaging (e.g. WhatsApp Business API, Twilio, email webhooks) and OS push notifications with permission. Family Time switches on automatically only while this page is open.</p>
        <p className="mut">Times use this device’s timezone ({tz}).</p>
      </section>
    </>
  );
}
