// Analytics service: date ranges, metrics aggregation, chart buckets.
import { sod, addDays, atDate, toMin, dk, DAYS } from './utils.js';

// The only app measured for real on this device. Everything else the user
// measures lives in settings.trackedApps (see usageApps).
export const USAGE_APPS = [
  { key: 'bc', label: 'BalanceConnect', icon: '🌿', color: 'var(--pur)' },
];

// Palette for tracked websites that don't carry their own colour.
const WEB_COLORS = ['#4285F4', '#111111', '#EA4335', '#F59E0B', '#8B5CF6', '#10B981', '#EC4899', '#0EA5E9', '#EF4444'];

// The full list of apps to chart: BalanceConnect (real) plus every website the
// user is measuring in settings. Each tracked site keeps its own colour/icon
// if set, otherwise gets one cycled from the palette.
export function usageApps(S) {
  const tracked = (S.settings && Array.isArray(S.settings.trackedApps)) ? S.settings.trackedApps : [];
  return [
    ...USAGE_APPS,
    ...tracked.map((a, i) => ({ key: a.key, label: a.label, icon: a.icon || '🌐', color: a.color || WEB_COLORS[i % WEB_COLORS.length], web: true })),
  ];
}

// Aggregate per-app usage over [a, b) into chart buckets. Each bucket carries
// a per-app minute value plus a `total`, and we also return per-app totals and
// a grand total. Respects the "include demo history" toggle via S.includeDemo.
export function usageBuckets(S, p, a, b) {
  const apps = usageApps(S);
  const usage = S.usage || {};
  const dayMins = (key) => {
    const u = usage[key];
    if (!u || (u.demo && !S.includeDemo)) return null;
    return u;
  };

  // Build the same bucket boundaries as the message chart.
  const spans = [];
  if (p === 'year') {
    for (let i = 0; i < 12; i++) spans.push([new Date(a.getFullYear(), i, 1).toLocaleDateString(undefined, { month: 'narrow' }), new Date(a.getFullYear(), i, 1), new Date(a.getFullYear(), i + 1, 1)]);
  } else {
    for (let d = new Date(a); d < b; d = addDays(d, 1)) spans.push([p === 'week' ? DAYS[d.getDay()] : (d.getDate() % 5 === 1 ? d.getDate() : ''), new Date(d), addDays(d, 1)]);
  }

  const totals = Object.fromEntries(apps.map((app) => [app.key, 0]));
  let grand = 0;

  const bkts = spans.map(([l, s, e]) => {
    const perApp = Object.fromEntries(apps.map((app) => [app.key, 0]));
    let total = 0;
    for (let d = new Date(s); d < e; d = addDays(d, 1)) {
      const u = dayMins(dk(d));
      if (!u) continue;
      for (const app of apps) { const m = u[app.key] || 0; perApp[app.key] += m; total += m; totals[app.key] += m; }
    }
    grand += total;
    return { l, total, apps: perApp };
  });

  return { buckets: bkts, totals, grand, apps };
}

export function range(p, off = 0) {
  const n = new Date(); let a, b;
  if (p === 'week') { a = sod(n); a.setDate(a.getDate() - ((a.getDay() + 6) % 7) + 7 * off); b = addDays(a, 7); }
  else if (p === 'month') { a = new Date(n.getFullYear(), n.getMonth() + off, 1); b = new Date(n.getFullYear(), n.getMonth() + off + 1, 1); }
  else { a = new Date(n.getFullYear() + off, 0, 1); b = new Date(n.getFullYear() + off + 1, 0, 1); }
  return [a, b];
}

export function metrics(S, a, b) {
  const A = S.acts.filter((x) => x.at >= +a && x.at < +b && (S.includeDemo || !x.demo));
  const T = (t) => A.filter((x) => x.type === t);
  const msgs = T('msg'), rep = T('reply'), fam = T('family'), ses = T('session');
  const lessonMin = S.lessons.filter((l) => { const t = +atDate(l.date, l.e); return t >= +a && t < +b && t <= Date.now(); }).reduce((s, l) => s + toMin(l.e) - toMin(l.s), 0);
  return {
    n: A.length, msgs: msgs.length, after: msgs.filter((x) => x.after).length, inWin: msgs.filter((x) => !x.after).length, auto: T('auto').length,
    rep: rep.length, repOk: rep.filter((x) => x.ok).length, avg: rep.length ? rep.reduce((s, x) => s + x.dur, 0) / rep.length : null,
    fam: fam.length, famMin: fam.reduce((s, x) => s + (x.dur || 0), 0), shut: T('shutdown').length, silenced: T('silenced').length,
    work: lessonMin + ses.reduce((s, x) => s + (x.dur || 0), 0), A,
  };
}

export function buckets(p, a, b, A) {
  const out = [];
  if (p === 'year') { for (let i = 0; i < 12; i++) { const s = new Date(a.getFullYear(), i, 1), e = new Date(a.getFullYear(), i + 1, 1); out.push([s.toLocaleDateString(undefined, { month: 'narrow' }), s, e]); } }
  else { for (let d = new Date(a); d < b; d = addDays(d, 1)) out.push([p === 'week' ? DAYS[d.getDay()] : (d.getDate() % 5 === 1 ? d.getDate() : ''), new Date(d), addDays(d, 1)]); }
  return out.map(([l, s, e]) => { const M = A.filter((x) => x.type === 'msg' && x.at >= +s && x.at < +e); return { l, in: M.filter((x) => !x.after).length, af: M.filter((x) => x.after).length }; });
}
