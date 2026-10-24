import React from 'react';
import { useStore } from '../store.jsx';
import { IllLaptop } from '../components/ui.jsx';
import { addDays, dur, pct } from '../lib/utils.js';
import { range, metrics, usageBuckets } from '../lib/analytics.js';

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

// Accessible SVG multi-line chart of app time per bucket (day or month).
// Draws one line per app plus a Total line (5 lines). Fills the full container
// width (measured) at a fixed pixel height, so the plot uses all the space
// while axis/labels stay at a readable, non-stretched size.
function UsageChart({ data, period }) {
  const { buckets, apps } = data;
  const wrapRef = React.useRef(null);
  const [W, setW] = React.useState(720);
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setW(Math.max(280, Math.round(el.clientWidth)));
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ro) ro.observe(el); else window.addEventListener('resize', update);
    return () => { if (ro) ro.disconnect(); else window.removeEventListener('resize', update); };
  }, []);

  const H = 200, padL = 34, padR = 12, padT = 12, padB = 24;
  const n = buckets.length;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  // Total line sits above every app line, so it defines the y-axis top.
  const mx = Math.max(1, ...buckets.map((b) => b.total));
  const steps = [15, 30, 60, 90, 120, 180, 240, 300, 360, 480, 600, 720, 960, 1200, 1800, 2400];
  const niceTop = steps.find((s) => s >= mx) || Math.ceil(mx / 60) * 60;
  const x = (i) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => padT + innerH - (v / niceTop) * innerH;
  const gridVals = [0, Math.round(niceTop / 2), niceTop];
  const fmtAxis = (m) => m >= 60 ? (m / 60) + 'h' : m + 'm';
  const labelEvery = Math.ceil(n / (period === 'year' ? 12 : 7));

  // One series per app (built-ins + user websites), plus Total.
  const series = [
    ...apps.map((app) => ({ key: app.key, label: app.label, color: app.color, get: (b) => b.apps[app.key] || 0 })),
    { key: 'total', label: 'Total', color: 'var(--ink)', total: true, get: (b) => b.total },
  ];
  const line = (get) => buckets.map((b, i) => `${x(i)},${y(get(b))}`).join(' ');
  const summary = `App time by ${period === 'year' ? 'month' : 'day'}. ` +
    series.map((s) => `${s.label}: ${Math.round(buckets.reduce((a, b) => a + s.get(b), 0))} min`).join('; ');

  return (
    <figure ref={wrapRef} className="linechart" role="img" aria-label={summary} style={{ margin: 0, width: '100%' }}>
      {/* viewBox matches the measured pixel size 1:1 so text is never scaled/stretched. */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMinYMin meet" style={{ display: 'block' }}>
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
            <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="11" fill="var(--muted)">{fmtAxis(v)}</text>
          </g>
        ))}
        {series.map((s) => (
          <polyline key={s.key} points={line(s.get)} fill="none" stroke={s.color}
            strokeWidth={s.total ? 2.5 : 1.8} strokeDasharray={s.total ? '5 3' : undefined}
            strokeLinejoin="round" strokeLinecap="round" opacity={s.total ? 0.9 : 1} />
        ))}
        {series.map((s) => buckets.map((b, i) => (
          <circle key={s.key + i} cx={x(i)} cy={y(s.get(b))} r={s.total ? 2.6 : 2} fill={s.color} />
        )))}
        {buckets.map((b, i) => (
          (i % labelEvery === 0 || i === n - 1) && b.l
            ? <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{b.l}</text>
            : null
        ))}
      </svg>
    </figure>
  );
}

// Builds an assistant-style summary from the app's own data: a plain-language
// read on how the period went, plus concrete suggestions to improve working
// hours and boundaries. Deterministic — derived purely from the metrics.
function buildInsight(M, P, U, p) {
  const afterShare = M.msgs ? Math.round((M.after / M.msgs) * 100) : 0;
  const inWin = pct(M.inWin, M.msgs);
  const findings = [];
  const suggestions = [];

  // Headline read on the period.
  let headline;
  if (afterShare <= 20 && M.shut >= 1) headline = `Strong ${p}. Most emails landed inside your reply windows and you’re closing the day on purpose.`;
  else if (afterShare >= 50) headline = `This ${p} leaned after-hours. Your inbox is reaching you well outside your working hours.`;
  else headline = `A fairly balanced ${p}, with a few habits worth nudging.`;

  // Findings — comparisons against last period where we have data.
  if (P.msgs >= 3 && P.after > 0 && M.msgs > 0) {
    const ch = Math.round(((M.after - P.after) / P.after) * 100);
    findings.push(`After-hours emails ${ch <= 0 ? 'fell' : 'rose'} ${Math.abs(ch)}% versus last ${p}.`);
  }
  findings.push(`${inWin}% of emails arrived during your reply windows (${M.inWin} of ${M.msgs}).`);
  if (M.avg != null) findings.push(`Average reply time was ${dur(M.avg)}.`);
  if (M.fam > 0) findings.push(`You logged ${M.fam} Family Time session${M.fam === 1 ? '' : 's'} (${dur(M.famMin)}).`);
  if (U.grand >= 1) findings.push(`Tracked app time totalled ${dur(U.grand)} this ${p}.`);

  // Suggestions — actionable, aimed at working hours & boundaries.
  if (afterShare >= 35) suggestions.push('Add or widen a reply window so more email lands inside working hours instead of spilling into the evening.');
  if (M.avg != null && M.avg > 240) suggestions.push('Your replies average over four hours — a short midday window can cut the wait without constant checking.');
  if (M.shut < 2) suggestions.push('Run the end-of-day routine more often; a clear stop makes it easier to switch off.');
  if (M.fam === 0) suggestions.push('Schedule a daily Family Time block so non-urgent alerts go quiet automatically.');
  if (inWin >= 70 && afterShare < 25) suggestions.push('Boundaries are holding well — consider protecting one screen-free evening to lock in the gains.');
  if (!suggestions.length) suggestions.push('Keep your current rhythm — batching replies into windows is clearly working.');

  return { headline, findings, suggestions: suggestions.slice(0, 3) };
}

export default function Analytics() {
  const { S, route, patchRoute, mutate } = useStore();
  const p = route.p || 'week';
  const [a, b] = range(p), [pa, pb] = range(p, -1);
  const M = metrics(S, a, b), P = metrics(S, pa, pb);
  const enough = M.n >= 3;

  const U = usageBuckets(S, p, a, b);
  const usageMax = Math.max(1, ...U.apps.map((x) => U.totals[x.key] || 0));
  const perLabel = p === 'week' ? 'day' : p === 'month' ? 'day' : 'month';

  const workPct = pct(M.work, M.work + M.famMin);
  const ai = buildInsight(M, P, U, p);
  const toggleDemo = (checked) => mutate((S) => { S.includeDemo = checked; });

  return (
    <>
      <h2>Your well-being</h2>
      <p className="mut">A gentle look at your working rhythm — not a performance score.</p>

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
          <section className="card">
            <div className="row sp">
              <h3>Time in apps</h3>
              <span className="mut">{U.grand >= 1 ? dur(U.grand) + ' total' : '—'}</span>
            </div>
            <p className="mut">App time per {perLabel} across {p === 'week' ? 'this week' : p === 'month' ? 'this month' : 'this year'} — one line per app, plus the daily total.</p>
            <div className="row wrap sm" style={{ gap: 12, marginBottom: 4 }}>
              {U.apps.map((app) => (
                <span key={app.key} className="row" style={{ gap: 6 }}>
                  <span style={{ width: 14, height: 3, background: app.color, borderRadius: 2, display: 'inline-block' }} />{app.label}
                </span>
              ))}
              <span className="row" style={{ gap: 6 }}>
                <span style={{ width: 14, height: 0, borderTop: '2.5px dashed var(--ink)', display: 'inline-block' }} />Total
              </span>
            </div>
            <UsageChart data={U} period={p} />
            <div className="row sp sm" style={{ marginTop: 6 }}>
              <span>Total this {p}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{U.grand >= 1 ? dur(U.grand) : '0 min'}</span>
            </div>
          </section>

          <section className="card" style={{ background: 'var(--lav)', border: 0 }}>
            <div className="row sp">
              <h3>✨ AI insights</h3>
              <span className="chip c-demo" style={{ textTransform: 'none' }}>Auto-generated</span>
            </div>
            <p className="sm">{ai.headline}</p>
            {ai.findings.length > 0 && (
              <ul className="sm" style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                {ai.findings.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            )}
            <p className="sm" style={{ fontWeight: 700, marginTop: 8 }}>Suggestions to improve your working hours</p>
            <ul className="sm" style={{ margin: 0, paddingLeft: 18 }}>
              {ai.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
            <p className="mut" style={{ marginTop: 6 }}>Generated from your own activity in this app. Not professional advice.</p>
          </section>

          <div className="kpis">
            <Kpi value={M.after} label="After-hours emails" help="Arrived outside your working hours" />
            <Kpi value={`${pct(M.inWin, M.msgs)}%`} label="Arrived in your windows" help={`${M.inWin} of ${M.msgs} emails`} />
            <Kpi value={M.fam} label="Family Time sessions" help="Times you switched off" />
            <Kpi value={M.shut} label="End-of-day routines" help="Days you wrapped up cleanly" />
          </div>

          <section className="card">
            <h3>Where the time went</h3>
            <p className="mut">How your total app time this {p} splits across each app.</p>
            {U.apps.map((app) => {
              const mins = U.totals[app.key] || 0;
              return (
                <div key={app.key} className="row" style={{ gap: 12 }}>
                  <span style={{ width: 150, flex: 'none' }} className="sm"><span aria-hidden="true">{app.icon}</span> {app.label}</span>
                  <span className="grow bar" style={{ background: 'var(--bg-2)' }}>
                    <i style={{ width: Math.round((mins / usageMax) * 100) + '%', background: app.color }} />
                  </span>
                  <span className="sm" style={{ width: 64, flex: 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{mins >= 1 ? dur(mins) : '0 min'}</span>
                </div>
              );
            })}
            <p className="mut">BalanceConnect time is measured on this device. Other apps and the websites you
              add are shown with example data — a web app can’t read other apps’ usage without a browser extension or device permissions.</p>
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
            <p className="mut">Work counts completed appointments and working sessions. Personal counts the Family Time you logged.</p>
          </section>
        </>
      )}
    </>
  );
}
