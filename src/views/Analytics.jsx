import React from 'react';
import { useStore } from '../store.jsx';
import { IllLaptop } from '../components/ui.jsx';
import { addDays, dur, pct } from '../lib/utils.js';
import { range, metrics, usageBuckets, USAGE_APPS } from '../lib/analytics.js';

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

// Accessible SVG bar chart of total app time per bucket (day or month).
function UsageChart({ buckets, period }) {
  const W = 320, H = 150, padL = 28, padR = 8, padT = 10, padB = 20;
  const n = buckets.length;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const mx = Math.max(1, ...buckets.map((b) => b.total));
  // Nice round y-axis top in minutes.
  const steps = [15, 30, 60, 90, 120, 180, 240, 300, 360, 480, 600, 720, 960, 1200];
  const niceTop = steps.find((s) => s >= mx) || Math.ceil(mx / 60) * 60;
  const y = (v) => padT + innerH - (v / niceTop) * innerH;
  const bw = (innerW / n) * 0.62;
  const bx = (i) => padL + (i + 0.5) * (innerW / n) - bw / 2;
  const gridVals = [0, Math.round(niceTop / 2), niceTop];
  const fmtAxis = (m) => m >= 60 ? (m / 60) + 'h' : m + 'm';
  const labelEvery = Math.ceil(n / (period === 'year' ? 12 : 7));
  const summary = `Total app time by ${period === 'year' ? 'month' : 'day'}. ` +
    buckets.map((b) => `${b.l || ''}: ${Math.round(b.total)} min`).filter((s) => !s.startsWith(':')).join(', ');

  return (
    <figure className="linechart" role="img" aria-label={summary} style={{ margin: 0, maxWidth: 560 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', height: 'auto' }}>
        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="1" />
            <text x={padL - 4} y={y(v) + 3} textAnchor="end" fontSize="8" fill="var(--muted)">{fmtAxis(v)}</text>
          </g>
        ))}
        {buckets.map((b, i) => (
          <rect key={i} x={bx(i)} y={y(b.total)} width={bw} height={Math.max(0, innerH - (y(b.total) - padT))} rx="1.5" fill="var(--sage)" />
        ))}
        {buckets.map((b, i) => (
          (i % labelEvery === 0 || i === n - 1) && b.l
            ? <text key={i} x={bx(i) + bw / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="var(--muted)">{b.l}</text>
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
  const usageMax = Math.max(1, ...USAGE_APPS.map((x) => U.totals[x.key] || 0));
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
            <div className="row sp">
              <h3>Time in apps</h3>
              <span className="mut">{U.grand >= 1 ? dur(U.grand) + ' total' : '—'}</span>
            </div>
            <p className="mut">Total app time per {perLabel} across {p === 'week' ? 'this week' : p === 'month' ? 'this month' : 'this year'}.</p>
            <UsageChart buckets={U.buckets} period={p} />
            <div className="row sp sm" style={{ marginTop: 6 }}>
              <span>Total this {p}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{U.grand >= 1 ? dur(U.grand) : '0 min'}</span>
            </div>
          </section>

          <section className="card">
            <h3>Where the time went</h3>
            <p className="mut">How your total app time this {p} splits across each app.</p>
            {USAGE_APPS.map((app) => {
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
            <p className="mut">BalanceConnect time is measured on this device. Google Docs, Notion and email
              figures are example data — a web app can’t read other apps’ usage without a browser extension or device permissions.</p>
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
