// Schedule: recurrence expansion + conflict detection.
import { toMin, fmtT, atDate, dk, DAYS, inRange } from './utils.js';

const DAY_MS = 864e5;

// Whole days between two date keys (b - a), ignoring DST via UTC noon.
function dayDiff(aKey, bKey) {
  const a = atDate(aKey, '12:00'), b = atDate(bKey, '12:00');
  return Math.round((b - a) / DAY_MS);
}

// Does a (possibly recurring) lesson occur on dateKey?
// repeat: 'none' | 'weekly' | 'biweekly'. `anchor` is the first occurrence;
// falls back to the lesson's own date. `exdates` skips specific occurrences.
export function occursOn(lesson, dateKey) {
  const anchor = lesson.anchor || lesson.date;
  if (lesson.exdates && lesson.exdates.includes(dateKey)) return false;
  if (!lesson.repeat || lesson.repeat === 'none') return lesson.date === dateKey;
  const diff = dayDiff(anchor, dateKey);
  if (diff < 0) return false; // before the series starts
  if (lesson.repeat === 'weekly') return diff % 7 === 0;
  if (lesson.repeat === 'biweekly') return diff % 14 === 0;
  return lesson.date === dateKey;
}

// All lesson occurrences on a given date, as concrete items (date overridden to
// dateKey). Sorted by start time.
export function lessonsOn(lessons, dateKey) {
  return lessons
    .filter((l) => occursOn(l, dateKey))
    .map((l) => ({ ...l, date: dateKey, occurrenceOf: l.id }))
    .sort((a, b) => toMin(a.s) - toMin(b.s));
}

// Next lesson occurrence at or after `fromKey` within `horizon` days. Returns a
// concrete occurrence (date set) or null. If `afterNow` is true, only counts
// occurrences whose end time is still in the future today.
export function upcomingOccurrence(lessons, fromKey, horizon = 60, afterNow = false) {
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  for (let i = 0; i < horizon; i++) {
    const key = dk(new Date(atDate(fromKey, '12:00').getTime() + i * DAY_MS));
    const list = lessonsOn(lessons, key);
    for (const l of list) {
      if (afterNow && i === 0 && toMin(l.e) <= nowMin) continue;
      return l;
    }
  }
  return null;
}
const REPEAT_LABEL = { none: 'One-off', weekly: 'Weekly', biweekly: 'Every 2 weeks' };
export const repeatLabel = (r) => REPEAT_LABEL[r || 'none'];

export function conflicts(S, stuName, L) {
  const st = S.settings, s = toMin(L.s), e = toMin(L.e), hard = [], soft = [];
  // Compare against every lesson occurrence on the same date (recurring included),
  // excluding the lesson being edited and its own series.
  lessonsOn(S.lessons, L.date).forEach((o) => {
    const sameLesson = o.occurrenceOf === L.id;
    const sameSeries = L.seriesId && o.seriesId && o.seriesId === L.seriesId;
    if (!sameLesson && !sameSeries && s < toMin(o.e) && toMin(o.s) < e) {
      hard.push(`Overlaps ${stuName(o.sid)}'s lesson ${fmtT(o.s)}–${fmtT(o.e)}`);
    }
  });
  const ov = (a, b) => { for (let m = s; m < e; m += 5) if (inRange(m, a, b)) return true; return false; };
  if (st.family.on && ov(st.family.s, st.family.e)) soft.push('Falls inside Family Time');
  if (st.quiet.on && ov(st.quiet.s, st.quiet.e)) soft.push('Falls inside quiet hours');
  const dow = atDate(L.date, '12:00').getDay();
  if (st.days[dow].on) st.windows.forEach((w) => { if (ov(w.s, w.e)) soft.push(`Overlaps response window ${fmtT(w.s)}–${fmtT(w.e)}`); });
  else soft.push(`${DAYS[dow]} is not a working day`);
  return { hard, soft };
}
