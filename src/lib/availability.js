// Availability service + status helpers. State-aware functions take S explicitly.
import { toMin, minOf, inRange, fmtD, sod } from './utils.js';

export const Avail = {
  inQuiet: (d, st) => st.quiet.on && inRange(minOf(d), st.quiet.s, st.quiet.e),
  inFamily: (d, st) => st.family.on && inRange(minOf(d), st.family.s, st.family.e),
  working: (d, st) => { const w = st.days[d.getDay()]; return w.on && inRange(minOf(d), w.s, w.e); },
  win: (d, st) => st.days[d.getDay()].on ? st.windows.find((w) => inRange(minOf(d), w.s, w.e)) : null,
  windowTime(d, st) { return !!this.win(d, st) && !this.inQuiet(d, st) && !this.inFamily(d, st); },
  // scans forward in 5-min steps across the real schedule (handles weekends, non-working days, DST via local Date)
  next(from, st) {
    let t = new Date(from); t.setSeconds(0, 0); const r = t.getMinutes() % 5; if (r) t.setMinutes(t.getMinutes() + 5 - r);
    for (let i = 0; i < 14 * 288; i++) { if (this.windowTime(t, st)) return t; t = new Date(t.getTime() + 3e5); } return null;
  },
  describe(n, from = new Date()) {
    if (!n) return 'as soon as I can';
    const diff = Math.round((sod(n) - sod(from)) / 864e5);
    if (diff === 0) return `today after ${fmtD(n)}`;
    if (diff === 1) return `tomorrow after ${fmtD(n)}`;
    if (diff < 7) return `on ${n.toLocaleDateString(undefined, { weekday: 'long' })} after ${fmtD(n)}`;
    return `on ${n.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })} after ${fmtD(n)}`;
  },
};

export function availableNow(S, d = new Date()) {
  if (S.family.active) return false;
  if (S.offlineUntil && +d < S.offlineUntil) return false;
  return Avail.windowTime(d, S.settings);
}

export function statusNow(S) {
  const d = new Date(), st = S.settings;
  if (S.family.active) return ['family', 'Family Time'];
  if (S.offlineUntil && +d < S.offlineUntil) return ['offline', 'Done for today'];
  if (Avail.inQuiet(d, st)) return ['quiet', 'Quiet hours'];
  if (Avail.windowTime(d, st)) return ['window', 'Reply window'];
  if (Avail.working(d, st)) return ['working', 'Working hours'];
  return ['off', 'Off work'];
}

export const nextFromNow = (S) => Avail.next(S.offlineUntil && S.offlineUntil > Date.now() ? new Date(S.offlineUntil) : new Date(), S.settings);
export const autoText = (S, n, from) => S.settings.tpl.replaceAll('{next}', Avail.describe(n, from)).replaceAll('{name}', S.settings.name);
