// Schedule conflict detection.
import { toMin, fmtT, atDate, DAYS, inRange } from './utils.js';

export function conflicts(S, stuName, L) {
  const st = S.settings, s = toMin(L.s), e = toMin(L.e), hard = [], soft = [];
  S.lessons.forEach((o) => {
    if (o.id !== L.id && o.date === L.date && s < toMin(o.e) && toMin(o.s) < e) hard.push(`Overlaps ${stuName(o.sid)}'s lesson ${fmtT(o.s)}–${fmtT(o.e)}`);
  });
  const ov = (a, b) => { for (let m = s; m < e; m += 5) if (inRange(m, a, b)) return true; return false; };
  if (st.family.on && ov(st.family.s, st.family.e)) soft.push('Falls inside Family Time');
  if (st.quiet.on && ov(st.quiet.s, st.quiet.e)) soft.push('Falls inside quiet hours');
  const dow = atDate(L.date, '12:00').getDay();
  if (st.days[dow].on) st.windows.forEach((w) => { if (ov(w.s, w.e)) soft.push(`Overlaps response window ${fmtT(w.s)}–${fmtT(w.e)}`); });
  else soft.push(`${DAYS[dow]} is not a working day`);
  return { hard, soft };
}
