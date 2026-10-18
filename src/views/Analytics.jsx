import React from 'react';
import { useStore } from '../store.jsx';
import { IllLaptop } from '../components/ui.jsx';
import { addDays, dur, pct } from '../lib/utils.js';
import { range, metrics, buckets } from '../lib/analytics.js';

export default function Analytics() {
  const { S, route, patchRoute, mutate } = useStore();
  const p = route.p || 'week';
  const [a, b] = range(p), [pa, pb] = range(p, -1);
  const M = metrics(S, a, b), P = metrics(S, pa, pb);
  const B = buckets(p, a, b, M.A);
  const mx = Math.max(1, ...B.map((x) => x.in + x.af));

  const ins = [];
  if (P.msgs >= 3 && M.msgs > 0 && P.after > 0) { const ch = Math.round((M.after - P.after) / P.after * 100); ins.push(`Your after-hours messages ${ch <= 0 ? 'decreased' : 'increased'} by ${Math.abs(ch)}% compared with last ${p}.`); }
  if (P.fam > 0 && M.famMin > P.famMin) ins.push(`You protected ${dur(M.famMin - P.famMin)} more personal time than last ${p}.`);
  if (p === 'week') { const days = Math.min(7, Math.floor((Date.now() - a) / 864e5) + 1); if (M.shut) ins.push(`You completed your shutdown routine on ${M.shut} out of ${days} day${days === 1 ? '' : 's'}.`); }
  if (M.avg != null && M.rep >= 2) ins.push(`Your average response time was ${dur(M.avg)}.`);
  const enough = M.n >= 3;

  const toggleDemo = (checked) => mutate((S) => { S.includeDemo = checked; });

  return (
    <>
      <h2>Well-being Analytics</h2>
      <div className="tabs">
        {['week', 'month', 'year'].map((k) => (
          <button key={k} className={`tab ${p === k ? 'on' : ''}`} onClick={() => patchRoute({ p: k })}>{k[0].toUpperCase() + k.slice(1)}</button>
        ))}
      </div>
      <div className="row sp wrap">
        <span className="mut">{a.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} – {addDays(b, -1).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <label className="tog sm"><input type="checkbox" checked={S.includeDemo} onChange={(e) => toggleDemo(e.target.checked)} />Include demo data</label>
      </div>
      {S.includeDemo && <div className="warn">Includes seeded demo history (labelled). Turn it off to see only your real activity.</div>}

      {!enough ? (
        <section className="card" style={{ textAlign: 'center', alignItems: 'center' }}>
          <IllLaptop />
          <h3>Your insights are on their way</h3>
          <p className="sm">As you reply to messages, take Family Time and finish your day, trends will appear here.</p>
        </section>
      ) : (
        <>
          <div className="kpis">
            <div className="kpi"><b>{M.after}</b><span className="mut">After-hours messages</span></div>
            <div className="kpi"><b>{pct(M.inWin, M.msgs)}%</b><span className="mut">Arrived in windows ({M.inWin}/{M.msgs})</span></div>
            <div className="kpi"><b>{M.auto}</b><span className="mut">Auto-replies sent</span></div>
            <div className="kpi"><b>{M.avg == null ? '—' : dur(M.avg)}</b><span className="mut">Avg response time</span></div>
            <div className="kpi"><b>{M.fam}</b><span className="mut">Family Time sessions</span></div>
            <div className="kpi"><b>{M.shut}</b><span className="mut">Shutdowns completed</span></div>
          </div>
          <section className="card">
            <h3>Messages by time received</h3>
            <div className="row sm">
              <span style={{ width: 10, height: 10, background: 'var(--sage)', borderRadius: 2 }} />In window
              <span style={{ width: 10, height: 10, background: 'var(--peach)', borderRadius: 2, marginLeft: 8 }} />After hours
            </div>
            <div className="chart">
              {B.map((x, i) => (
                <div key={i} className="col" title={`${x.in} in window, ${x.af} after hours`}>
                  <i className="a" style={{ height: x.in / mx * 100 + '%' }} />
                  <i className="b" style={{ height: x.af / mx * 100 + '%' }} />
                </div>
              ))}
            </div>
            <div className="xl">{B.map((x, i) => <span key={i}>{x.l}</span>)}</div>
            <p className="mut">Tallest bar = {mx} message{mx === 1 ? '' : 's'}</p>
          </section>
          <section className="card">
            <h3>Work vs personal time</h3>
            <div className="bar" style={{ height: 14, background: 'var(--peach-s)' }}><i style={{ width: pct(M.work, M.work + M.famMin) + '%', background: 'var(--pur)' }} /></div>
            <div className="row sp sm"><span>Work {dur(M.work)}</span><span>Family {dur(M.famMin)}</span></div>
            <p className="mut">Work counts completed lessons and response sessions. Personal counts logged Family Time.</p>
          </section>
          <section className="card">
            <h3>Insights</h3>
            {ins.length ? ins.map((i, idx) => <p key={idx} className="sm">✨ {i}</p>)
              : <p className="mut">Keep going. Comparisons appear once last {p} has activity too.</p>}
          </section>
        </>
      )}
    </>
  );
}
