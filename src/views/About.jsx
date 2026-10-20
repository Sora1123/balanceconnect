import React from 'react';
import { Head } from '../components/ui.jsx';

export default function About() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <>
      <Head title="About" back="more" />
      <section className="card">
        <h3>BalanceConnect for HIPPOCAMPUS</h3>
        <p className="mut">Clear boundaries. Meaningful connections.</p>
        <p className="sm">A calm companion for Mika’s one-on-one Japanese teaching — helping protect
          time for family and rest while every learner’s message is looked after.</p>
        <p className="sm"><b>Works now:</b> availability that follows your teaching schedule, next-window
          replies, automatic replies, message triage, working mode, Family Time, an end-of-day
          routine, well-being analytics, and lesson scheduling with conflict checks.</p>
        <p className="sm"><b>Simulated:</b> student and family messages and automatic replies happen
          inside the app only. Nothing is sent by SMS, WhatsApp or email.</p>
        <p className="sm"><b>Would need a backend:</b> a real student/family page (login, database,
          access control), invoicing, and syncing across devices.</p>
        <p className="sm"><b>Would need integrations:</b> real messaging (e.g. WhatsApp Business API,
          email) and phone push notifications. Family Time switches on automatically only while this
          page is open.</p>
        <p className="mut">Times use this device’s timezone ({tz}).</p>
      </section>
    </>
  );
}
