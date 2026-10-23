import React, { useEffect } from 'react';
import { useStore, useTick } from './store.jsx';
import { Toast, ConfirmModal, NavIcon, ICON } from './components/ui.jsx';
import { statusNow } from './lib/availability.js';

import Home from './views/Home.jsx';
import Inbox from './views/Inbox.jsx';
import Message from './views/Message.jsx';
import ResponseMode from './views/ResponseMode.jsx';
import Family from './views/Family.jsx';
import Shutdown from './views/Shutdown.jsx';
import Schedule from './views/Schedule.jsx';
import Analytics from './views/Analytics.jsx';
import More from './views/More.jsx';
import Data from './views/Data.jsx';
import About from './views/About.jsx';
import Sim from './views/Sim.jsx';
import { Settings, Onboard } from './views/Settings.jsx';

const VIEWS = {
  home: Home, inbox: Inbox, msg: Message, rm: ResponseMode, family: Family,
  shutdown: Shutdown, schedule: Schedule, analytics: Analytics,
  more: More, data: Data, about: About, sim: Sim, settings: Settings, onboard: Onboard,
};

const TABS = [['home', 'Home'], ['inbox', 'Messages'], ['schedule', 'Schedule'], ['analytics', 'Analytics'], ['more', 'More']];
// which tab/section is highlighted for a given route
const TAB_OF = { msg: 'inbox', rm: 'inbox', family: 'home', shutdown: 'home', settings: 'more', sim: 'more', data: 'more', about: 'more' };

export default function App() {
  const { S, route, go } = useStore();
  useTick();

  const name = route.name;
  const View = VIEWS[name] || Home;

  const un = S.messages.filter((m) => !m.read && m.status !== 'archived').length;
  const cur = TAB_OF[name] || name;
  const showFamilyBanner = S.family.active && name !== 'family';
  const showNav = name !== 'onboard';
  const [sk, sl] = statusNow(S);

  // Reflect the current availability state on <html> so the ambient background
  // tint can shift with the time of day (working / reply window / family / quiet).
  useEffect(() => {
    document.documentElement.setAttribute('data-state', sk);
    return () => { document.documentElement.removeAttribute('data-state'); };
  }, [sk]);

  const NavButton = ({ k, l }) => (
    <button
      className={cur === k ? 'on' : ''}
      onClick={() => go(k)}
      aria-current={cur === k ? 'page' : undefined}
    >
      <NavIcon path={ICON[k]} />
      <span className="nav-label">{l}</span>
      {k === 'inbox' && un > 0 && <span className="bd" aria-label={`${un} unread`}>{un}</span>}
    </button>
  );

  // Onboarding has no navigation chrome — render it centered on its own.
  if (!showNav) {
    return (
      <>
        <div className="shell shell-onboard">
          <main id="app" aria-label="Set up BalanceConnect">
            <View />
          </main>
        </div>
        <Toast />
        <ConfirmModal />
      </>
    );
  }

  return (
    <>
      <a href="#app" className="skip-link">Skip to main content</a>
      <div className="shell">
        {/* Sidebar — visible on tablet/laptop via CSS */}
        <aside className="sb" aria-label="Primary">
          <div className="sb-brand">
            <span className="sb-logo" aria-hidden="true">🌿</span>
            <span className="sb-name">BalanceConnect</span>
          </div>
          <nav className="sb-nav" aria-label="Sections">
            {TABS.map(([k, l]) => <NavButton key={k} k={k} l={l} />)}
          </nav>
          <div className="sb-foot">
            <span className={`pill st-${sk}`}>{sl}</span>
            <p style={{ marginTop: 10 }}>Clear boundaries.<br />Meaningful connections.</p>
          </div>
        </aside>

        {/* Main content fills the remaining width */}
        <main id="app" data-view={name} tabIndex={-1} aria-label={viewLabel(name)}>
          {showFamilyBanner && (
            <button className="banner" onClick={() => go('family')}>
              <span>💛 Family Time is on · non-urgent alerts are silenced</span>
              <span aria-hidden="true">›</span>
            </button>
          )}
          <View />
        </main>
      </div>

      {/* Bottom tab bar — visible on phone via CSS */}
      <nav className="tb" aria-label="Main">
        <div>
          {TABS.map(([k, l]) => <NavButton key={k} k={k} l={l} />)}
        </div>
      </nav>

      <Toast />
      <ConfirmModal />
    </>
  );
}

function viewLabel(name) {
  const labels = {
    home: 'Home', inbox: 'Messages', msg: 'Message', rm: 'Working mode', family: 'Family Time',
    shutdown: 'End of day', schedule: 'Schedule', analytics: 'Well-being analytics',
    more: 'More', data: 'Data management', about: 'About', sim: 'Test scenarios', settings: 'Settings',
  };
  return labels[name] || 'Main content';
}
