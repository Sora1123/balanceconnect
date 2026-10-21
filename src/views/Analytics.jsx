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

// Accessible SVG line graph with two series (in-window vs after-hours).
// Uses a fixed viewBox and scales to the container width; y-axis gridlines and
// labels, points on each data value, and x-axis labels underneath.
function LineChart({ buckets, niceTop, period }) {
  const W = 320, H = 150, padL = 24, padR = 8, padT = 10, padB = 20;
  const n = buckets.length;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const x = (i) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => padT + innerH - (v / niceTop) * innerH;
  const line = (key) => buckets.map((b, i) => `${x(i)},${y(b[key])}`).join(' ');
  const gridVals = [0, Math.round(niceTop / 2), niceTop];

  const labelEvery = Math.ceil(n / (period === 'year' ? 12 : 7));
  const summary = `Messages by ${period === 'year' ? 'month' : 'day'}. ` +
    buckets.map((b) => `${b.l || ''}: ${b.in + b.af}`).filter((s) => !s.startsWith(':')).join(', ');

  return (
    <figure className="linechart" role="img" aria-label={summary} style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: 'block', height: 'auto' }}>
        {/* y gridlines + labels */}
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
            <text x={padL - 4} y={y(v) + 3} textAnchor="end" fontSize="8" fill="var(--muted)">{v}</text>
          </g>
        ))}
        {/* after-hours series (amber) */}
        <polyline points={line('af')} fill="none" stroke="var(--peach)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* in-window series (green) */}
        <polyline points={line('in')} fill="none" stroke="var(--sage)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* points */}
        {buckets.map((b, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(b.af)} r="2.4" fill="var(--peach)" />
            <circle cx={x(i)} cy={y(b.in)} r="2.4" fill="var(--sage)" />
          </g>
        ))}
        {/* x labels */}
        {buckets.map((b, i) => (
          (i % labelEvery === 0 || i === n - 1) && b.l
            ? <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="var(--muted)">{b.l}</text>
            : null
        ))}
      </svg>
    </figure>
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
            <p className="mut">Each point is the number of messages that {p === 'year' ? 'month' : 'day'}. Green = during your reply windows; amber = after hours.</p>
            <div className="row sm" style={{ gap: 14 }}>
              <span className="row" style={{ gap: 6 }}><span style={{ width: 14, height: 3, background: 'var(--sage)', borderRadius: 2, display: 'inline-block' }} />In your windows</span>
              <span className="row" style={{ gap: 6 }}><span style={{ width: 14, height: 3, background: 'var(--peach)', borderRadius: 2, display: 'inline-block' }} />After hours</span>
            </div>
            <LineChart buckets={B} niceTop={niceTop} period={p} />
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
