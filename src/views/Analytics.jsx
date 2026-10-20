import React from 'react';
import { useStore } from '../store.jsx';
import { IllLaptop } from '../components/ui.jsx';
import { addDays, dur, pct } from '../lib/utils.js';
import { range, metrics, buckets } from '../lib/analytics.js';

const PERIODS = [['week', 'This week'], ['month', 'This month'], ['year', 'This year']];

// A plain-language KPI tile with a short explanation underneath.
function Kpi({ value, label, help }) {
  return (
    <div className="kpi">
      <b>{value}</b>
      <span className="mut" style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{label}</span>
      {help && <span className="mut" style={{ display: 'block', marginTop: 2 }}>{help}</span>}
    </div>
  );
}

export default function Analytics() {
  const { S, route, patchRoute, mutate } = useStore();
  const p = route.p || 'week';
  const [a, b] = range(p), [pa, pb] = range(p, -1);
  const M = metrics(S, a, b), P = metrics(S, pa, pb);
  const B = buckets(p, a, b, M.A);
  const mx = Math.max(1, ...B.map((x) => x.in + x.af));
  // Nice round y-axis top (1, 2, 5, 10, …) at or above the tallest bar.
  const niceTop = (() => { const steps = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 50]; return steps.find((s) => s >= mx) || Math.ceil(mx / 10) * 10; })();

  const ins = [];
  if (P.msgs >= 3 && M.msgs > 0 && P.after > 0) { const ch = Math.round((M.after - P.after) / P.after * 100); ins.push(`Your after-hours messages ${ch <= 0 ? 'went down' : 'went up'} by ${Math.abs(ch)}% compared with last ${p}.`); }
  if (P.fam > 0 && M.famMin > P.famMin) ins.push(`You protected ${dur(M.famMin - P.famMin)} more personal time than last ${p}.`);
  if (p === 'week') { const days = Math.min(7, Math.floor((Date.now() - a) / 864e5) + 1); if (M.shut) ins.push(`You finished your end-of-day routine on ${M.shut} of ${days} day${days === 1 ? '' : 's'}.`); }
  if (M.avg != null && M.rep >= 2) ins.push(`On average you replied in ${dur(M.avg)}.`);
  const enough = M.n >= 3;

  const workPct = pct(M.work, M.work + M.famMin);
  const toggleDemo = (checked) => mutate((S) => { S.includeDemo = checked; });

  return (
    <>
      <h2>Your well-being</h2>
      <p className="mut">A gentle look at your teaching rhythm — not a performance score.</p>

      <div className="seg" role="radiogroup" aria-label="Time period">
        {PERIODS.map(([k, label]) => (
          <button key={k} role="radio" aria-checked={p === k} className={`seg-btn ${p === k ? 'on' : ''}`} onClick={() => patchRoute({ p: k })}>{label}</button>
        ))}
      </div>
      <div className="row sp wrap">
        <span className="mut">{a.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – {addDays(b, -1).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <label className="tog sm"><input type="checkbox" checked={S.includeDemo} onChange={(e) => toggleDemo(e.target.checked)} />Include demo history</label>
      </div>
      {S.includeDemo && <div className="warn"><span aria-hidden="true">💡 </span>These figures include the built-in demo history. Turn off “Include demo history” to see only your own activity.</div>}

      {!enough ? (
        <section className="card" style={{ textAlign: 'center', alignItems: 'center' }}>
          <IllLaptop />
          <h3>Your insights are on their way</h3>
          <p className="sm">As you reply to messages, take Family Time, and finish your day, friendly trends will appear here.</p>
        </section>
      ) : (
        <>
          <div className="kpis">
            <Kpi value={M.after} label="After-hours messages" help="Arrived outside your teaching hours" />
            <Kpi value={`${pct(M.inWin, M.msgs)}%`} label="Arrived in your windows" help={`${M.inWin} of ${M.msgs} messages`} />
            <Kpi value={M.avg == null ? '—' : dur(M.avg)} label="Average reply time" help="How long students waited" />
            <Kpi value={M.fam} label="Family Time sessions" help="Times you switched off" />
            <Kpi value={M.auto} label="Auto-replies sent" help="Handled for you while away" />
            <Kpi value={M.shut} label="End-of-day routines" help="Days you wrapped up cleanly" />
          </div>

          <section className="card">
            <h3>When messages arrived</h3>
            <p className="mut">Taller bars mean more messages that {p === 'year' ? 'month' : 'day'}. Green = during your reply windows; amber = after hours.</p>
            <div className="row sm" style={{ gap: 14 }}>
              <span className="row" style={{ gap: 6 }}><span style={{ width: 12, height: 12, background: 'var(--sage)', borderRadius: 3, display: 'inline-block' }} />In your windows</span>
              <span className="row" style={{ gap: 6 }}><span style={{ width: 12, height: 12, background: 'var(--peach)', borderRadius: 3, display: 'inline-block' }} />After hours</span>
            </div>
            <div className="chart-wrap">
              <div className="chart-y" aria-hidden="true">
                <span>{niceTop}</span><span>{Math.round(niceTop / 2)}</span><span>0</span>
              </div>
              <div className="chart" role="img" aria-label={`Messages by ${p === 'year' ? 'month' : 'day'}: ${B.map((x) => `${x.l || ''} ${x.in + x.af}`).join(', ')}`}>
                {B.map((x, i) => (
                  <div key={i} className="col" title={`${x.in} in window, ${x.af} after hours`}>
                    <i className="b" style={{ height: (x.af / niceTop) * 100 + '%' }} />
                    <i className="a" style={{ height: (x.in / niceTop) * 100 + '%' }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="xl" aria-hidden="true">{B.map((x, i) => <span key={i}>{x.l}</span>)}</div>
          </section>

          <section className="card">
            <h3>Work vs personal time</h3>
            <div className="split-bar" role="img" aria-label={`Work ${dur(M.work)}, personal ${dur(M.famMin)}`}>
              <span className="split-work" style={{ width: workPct + '%' }} />
              <span className="split-personal" style={{ width: (100 - workPct) + '%' }} />
            </div>
            <div className="row sp sm">
              <span className="row" style={{ gap: 6 }}><span style={{ width: 12, height: 12, background: 'var(--pur)', borderRadius: 3, display: 'inline-block' }} />Work · {dur(M.work)}</span>
              <span className="row" style={{ gap: 6 }}><span style={{ width: 12, height: 12, background: 'var(--peach)', borderRadius: 3, display: 'inline-block' }} />Personal · {dur(M.famMin)}</span>
            </div>
            <p className="mut">Work counts finished lessons and working sessions. Personal counts the Family Time you logged.</p>
          </section>

          <section className="card" style={{ background: 'var(--sage-s)', border: 0 }}>
            <h3>✨ What stands out</h3>
            {ins.length ? ins.map((i, idx) => <p key={idx} className="sm">{i}</p>)
              : <p className="mut">Keep going — comparisons appear once last {p} has activity too.</p>}
          </section>
        </>
      )}
    </>
  );
}
