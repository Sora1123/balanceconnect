import React from 'react';
import { useStore } from '../store.jsx';

// Grouped, plain-language menu. Each row has an icon, a clear label, and a short
// description so it's obvious what it does — friendlier for non-technical users.
const GROUPS = [
  {
    title: 'Your availability',
    items: [
      { to: 'settings:work', icon: '🕒', label: 'Teaching hours', desc: 'The days and times you teach' },
      { to: 'settings:auto', icon: '💬', label: 'Automatic replies', desc: 'What students get when you’re away' },
      { to: 'settings:notif', icon: '🔔', label: 'Notifications', desc: 'Alerts and how urgent messages are handled' },
      { to: 'settings:family', icon: '💛', label: 'Family time', desc: 'When to switch off and be present' },
      { to: 'settings:quiet', icon: '🌙', label: 'Quiet hours', desc: 'Overnight hours when you’re offline' },
    ],
  },
  {
    title: 'Your students',
    items: [
      { to: 'student', icon: '👀', label: 'Preview your student page', desc: 'See what students and families see' },
    ],
  },
  {
    title: 'App & data',
    items: [
      { to: 'sim', icon: '🧪', label: 'Try a test message', desc: 'See how the app handles different situations' },
      { to: 'data', icon: '💾', label: 'Your data', desc: 'Everything is stored on this device' },
      { to: 'about', icon: 'ℹ️', label: 'About this app', desc: 'What works now and what’s simulated' },
    ],
  },
];

const THEMES = [
  ['light', '☀️', 'Light'],
  ['dark', '🌙', 'Dark'],
  ['system', '🖥️', 'System'],
];

export default function More() {
  const { go, theme, setTheme } = useStore();
  const nav = (to) => {
    const [r, s] = to.split(':');
    if (r === 'settings') go('settings', { sec: s });
    else go(r);
  };

  return (
    <>
      <h2>More</h2>

      {/* Appearance / theme control */}
      <section className="card">
        <h3>Appearance</h3>
        <p className="mut">Choose how the app looks. “System” follows your device setting.</p>
        <div className="seg" role="radiogroup" aria-label="Colour theme">
          {THEMES.map(([val, icon, label]) => (
            <button
              key={val}
              role="radio"
              aria-checked={theme === val}
              className={`seg-btn ${theme === val ? 'on' : ''}`}
              onClick={() => setTheme(val)}
            >
              <span aria-hidden="true" style={{ fontSize: 18 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </section>

      {GROUPS.map((group) => (
        <section key={group.title} className="card" style={{ padding: '8px 10px', gap: 2 }}>
          <h3 style={{ padding: '6px 6px 2px', fontSize: 14, color: 'var(--muted)' }}>{group.title}</h3>
          {group.items.map((it) => (
            <button key={it.to} className="menu-row" onClick={() => nav(it.to)}>
              <span className="menu-icon" aria-hidden="true">{it.icon}</span>
              <span className="grow">
                <span className="menu-label">{it.label}</span>
                <span className="menu-desc">{it.desc}</span>
              </span>
              <span className="mut" aria-hidden="true" style={{ fontSize: 20 }}>›</span>
            </button>
          ))}
        </section>
      ))}
    </>
  );
}
