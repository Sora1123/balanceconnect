import React from 'react';
import { useStore } from '../store.jsx';

const LINKS = [
  ['settings:work', 'Working preferences'],
  ['settings:auto', 'Automatic reply settings'],
  ['settings:notif', 'Notification settings'],
  ['settings:family', 'Family time'],
  ['settings:quiet', 'Quiet hours'],
  ['student', 'Student profile preview'],
  ['sim', 'Test scenarios'],
  ['data', 'Data management'],
  ['about', 'About BalanceConnect'],
];

export default function More() {
  const { go } = useStore();
  const nav = (v) => {
    const [r, s] = v.split(':');
    if (r === 'settings') go('settings', { sec: s });
    else go(r);
  };
  return (
    <>
      <h2>More</h2>
      <section className="card" style={{ padding: '4px 16px' }}>
        {LINKS.map(([r, l]) => (
          <button key={r} className="lnk" onClick={() => nav(r)}><span>{l}</span><span className="mut">›</span></button>
        ))}
      </section>
    </>
  );
}
