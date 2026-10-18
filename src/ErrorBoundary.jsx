'use client';

import React from 'react';
import { STORAGE_KEY } from './lib/state.js';

/**
 * Catches any render error so the whole app never white-screens. Shows a calm,
 * plain-language recovery screen with two safe actions: try again (re-render)
 * and start fresh (clear saved data). Technical details stay collapsed for
 * developers but out of the user's way.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep a diagnostic trail for developers without exposing it to users.
    // eslint-disable-next-line no-console
    console.error('BalanceConnect error boundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  handleReset = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="shell shell-onboard" role="alert">
        <main id="app" style={{ maxWidth: 520, textAlign: 'center' }}>
          <section className="card" style={{ alignItems: 'center', gap: 14, padding: 28 }}>
            <div className="sb-logo" style={{ width: 56, height: 56, fontSize: 28 }} aria-hidden="true">🌿</div>
            <h1>Something went wrong</h1>
            <p className="sm" style={{ maxWidth: '40ch' }}>
              The app hit an unexpected problem. Your saved information is still on
              this device. You can try again, and if that doesn’t help you can
              start fresh.
            </p>
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              <button className="btn" onClick={this.handleRetry}>Try again</button>
              <button className="btn ghost" onClick={() => window.location.reload()}>Reload the page</button>
            </div>
            <details style={{ width: '100%', marginTop: 6 }}>
              <summary className="mut" style={{ cursor: 'pointer' }}>Start fresh (clears saved data)</summary>
              <div style={{ marginTop: 10 }}>
                <p className="sm">This removes all data stored in this browser and reloads the app with the demo content.</p>
                <button className="btn danger" onClick={this.handleReset}>Clear data and restart</button>
              </div>
            </details>
          </section>
        </main>
      </div>
    );
  }
}
