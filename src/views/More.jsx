import React from 'react';
import { useStore } from '../store.jsx';

// Grouped, plain-language menu. Each row has an icon, a clear label, and a short
// description so it's obvious what it does — friendlier for non-technical users.
const GROUPS = [
  {
    title: 'Your availability',
    items: [
      { to: 'settings:work', icon: '🕒', label: 'Working hours', desc: 'The days and times you work' },
      { to: 'settings:auto', icon: '💬', label: 'Automatic replies', desc: 'What senders get when you’re away' },
      { to: 'settings:family', icon: '💛', label: 'Family time', desc: 'When to switch off and be present' },
      { to: 'settings:quiet', icon: '🌙', label: 'Quiet hours', desc: 'Overnight hours when you’re offline' },
      { to: 'settings:shutdown', icon: '🌙', label: 'End-of-day checklist', desc: 'The steps you tick off before finishing' },
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
  const { S, go, theme, setTheme, mutate } = useStore();
  const nav = (to) => {
    const [r, s] = to.split(':');
    if (r === 'settings') go('settings', { sec: s });
    else go(r);
  };
  const toggleDemo = (checked) => mutate((S) => { S.includeDemo = checked; });

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

      {/* Global demo-data toggle */}
      <section className="card">
        <h3>Demo data</h3>
        <p className="mut">BalanceConnect comes pre-filled with example clients, emails and history so you can explore it. Turn this off to hide the demo everywhere and see only your own activity.</p>
        <label className="tog"><input type="checkbox" checked={S.includeDemo} onChange={(e) => toggleDemo(e.target.checked)} />Show demo data</label>
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
