import React from 'react';
import { Head } from '../components/ui.jsx';

export default function About() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <>
      <Head title="About" back="more" />
      <section className="card">
        <h3>About BalanceConnect</h3>
        <p className="mut">Clear boundaries. Meaningful connections.</p>
        <p className="sm">A calm companion for self-employed people in any kind of business — helping protect
          time for family and rest while every client email is looked after.</p>
        <p className="sm"><b>Works now:</b> availability that follows your working schedule, next-window
          replies, automatic replies, email triage, working mode, Family Time, an end-of-day
          routine, well-being analytics, and appointment scheduling with conflict checks.</p>
        <p className="sm"><b>Demo data:</b> client emails are shown as if auto-collected from your Gmail
          and Outlook accounts, but this demo doesn’t connect to a real mailbox and nothing is actually sent.</p>
        <p className="sm"><b>Would need a backend:</b> live account sync, invoicing, and syncing across devices.</p>
        <p className="sm"><b>Would need integrations:</b> real Gmail/Outlook connection and phone push
          notifications. Family Time switches on automatically only while this page is open.</p>
        <p className="mut">Times use this device’s timezone ({tz}).</p>
      </section>
    </>
  );
}
