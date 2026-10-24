import React, { useState, useEffect } from 'react';
import { useStore } from '../store.jsx';
import { fmtT, dk, atDate, addDays, sod, toMin, uid } from '../lib/utils.js';
import { conflicts, lessonsOn, repeatLabel } from '../lib/schedule.js';
import { COURSE_BY_ID } from '../lib/state.js';
import Dialog from '../components/Dialog.jsx';

// Add `mins` minutes to an HH:MM string, clamped to 23:59.
function addMins(hhmm, mins) {
  const total = Math.min(23 * 60 + 59, toMin(hhmm) + mins);
  const h = Math.floor(total / 60), m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Build a sensible new-lesson draft: end time follows the student's course length.
function newLessonDraft(students, dateKey, start = '13:00') {
  const sid = students[0] ? students[0].id : '';
  const mins = (students[0] && COURSE_BY_ID[students[0].courseId]?.mins) || 60;
  const id = uid();
  return { id, sid, subject: '', date: dateKey, s: start, e: addMins(start, mins), notes: '', repeat: 'none', anchor: dateKey, seriesId: id };
}

const REPEAT_OPTS = [
  ['none', 'Just this once'],
  ['weekly', 'Every week'],
  ['biweekly', 'Every 2 weeks'],
];

function LessonSheet({ initial, onClose }) {
  const { S, mutate, toast, confirmBox, stuName } = useStore();
  const [L, setL] = useState(initial);
  const [cf, setCf] = useState(null);
  const base = S.lessons.find((x) => x.id === L.id);
  const isExisting = !!base;
  const isRecurring = (L.repeat && L.repeat !== 'none');
  // The specific calendar date this editor was opened on (for "this date only").
  const occurrenceDate = initial.date;
  const set = (k, v) => { setL((p) => ({ ...p, [k]: v })); if (cf) setCf(null); };

  const close = () => onClose(null);
  const timeInvalid = L.s && L.e && toMin(L.e) <= toMin(L.s);

  const removeSeries = () => {
    const id = L.id;
    mutate((S) => { S.lessons = S.lessons.filter((x) => x.id !== id); });
    toast('Repeating appointment deleted');
  };
  const removeOccurrence = () => {
    const id = L.id;
    mutate((S) => {
      const x = S.lessons.find((l) => l.id === id);
      if (x) x.exdates = [...(x.exdates || []), occurrenceDate];
    });
    toast('This appointment was removed');
  };
  const del = () => {
    onClose(null);
    if (isExisting && isRecurring) {
      confirmBox(
        'Delete a repeating appointment',
        `“${(L.subject || 'appointment').trim()}” with ${stuName(L.sid)} repeats ${repeatLabel(L.repeat).toLowerCase()}. Remove just this date, or the whole repeating series?`,
        'Remove the whole series',
        removeSeries,
        { danger: true, secondary: { label: 'Remove this date only', onClick: removeOccurrence } },
      );
    } else {
      confirmBox(
        'Delete this appointment?',
        `This removes ${stuName(L.sid)}’s “${(L.subject || 'appointment').trim()}” from your schedule. This can’t be undone.`,
        'Delete appointment',
        removeSeries,
        { danger: true },
      );
    }
  };

  const doSave = () => {
    const lesson = { ...L, subject: (L.subject || '').trim() || 'Appointment' };
    if (!lesson.date) { setCf({ err: 'Please choose a date for the appointment.' }); return; }
    if (!lesson.s || !lesson.e || toMin(lesson.e) <= toMin(lesson.s)) {
      setCf({ err: 'The end time needs to be after the start time (for example, 2:00 PM to 3:00 PM).' }); return;
    }
    // Keep the recurrence anchor aligned with the (possibly changed) date.
    if (!lesson.anchor || lesson.date !== base?.date) lesson.anchor = lesson.date;
    if (!lesson.seriesId) lesson.seriesId = lesson.id;
    const c = conflicts(S, (id) => stuName(id), lesson);
    if (c.hard.length) { setCf({ err: c.hard.join('. ') + '. Please pick a different time.' }); return; }
    const prevSoft = cf?.soft?.join();
    if (c.soft.length && prevSoft !== c.soft.join()) { setCf({ soft: c.soft }); setL(lesson); return; }
    mutate((S) => {
      const i = S.lessons.findIndex((x) => x.id === lesson.id);
      if (i >= 0) S.lessons[i] = lesson; else S.lessons.push(lesson);
    });
    toast(lesson.repeat !== 'none' ? 'Repeating appointment saved' : 'Appointment saved');
    onClose(lesson.date);
  };

  return (
    <Dialog title={isExisting ? 'Edit appointment' : 'New appointment'} onClose={close}>
      <label className="sm">Client
        <select value={L.sid} onChange={(e) => {
          const sid = e.target.value;
          const mins = COURSE_BY_ID[S.students.find((s) => s.id === sid)?.courseId]?.mins;
          if (!isExisting && !(L.subject || '').trim() && mins) {
            setL((p) => ({ ...p, sid, e: addMins(p.s, mins) }));
            if (cf) setCf(null);
          } else { set('sid', sid); }
        }}>
          {S.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label className="sm">What is the appointment about?
        <input value={L.subject} onChange={(e) => set('subject', e.target.value)} placeholder="e.g. Design review, strategy call, project kickoff" />
      </label>
      <label className="sm">{isRecurring ? 'Starting date' : 'Date'}
        <input type="date" value={L.date} onChange={(e) => set('date', e.target.value)} />
      </label>
      <div className="row">
        <label className="sm grow">Start time<input type="time" value={L.s} onChange={(e) => set('s', e.target.value)} aria-invalid={timeInvalid || undefined} style={{ width: '100%' }} /></label>
        <label className="sm grow">End time<input type="time" value={L.e} onChange={(e) => set('e', e.target.value)} aria-invalid={timeInvalid || undefined} style={{ width: '100%' }} /></label>
      </div>
      {timeInvalid && <p className="sm" style={{ color: 'var(--rose)' }}>⚠ The end time should be after the start time.</p>}
      <label className="sm">Repeats
        <select value={L.repeat || 'none'} onChange={(e) => set('repeat', e.target.value)}>
          {REPEAT_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      {isRecurring && <p className="mut">This appointment will repeat {repeatLabel(L.repeat).toLowerCase()} on {atDate(L.date, '12:00').toLocaleDateString(undefined, { weekday: 'long' })}s.</p>}
      <label className="sm">Notes <span className="mut">(optional)</span><textarea value={L.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything to remember for this appointment" /></label>
      {cf?.err && <div className="err" role="alert"><span aria-hidden="true">⚠ </span>{cf.err}</div>}
      {cf?.soft?.length > 0 && <div className="warn" role="alert"><span aria-hidden="true">💡 </span>Heads up: {cf.soft.join('; ')}. Press Save again to keep this time anyway.</div>}
      <div className="row">
        <button className="btn ghost grow" onClick={close}>Cancel</button>
        {isExisting && <button className="btn danger" onClick={del}>Delete</button>}
        <button className="btn grow" onClick={doSave}>Save</button>
      </div>
    </Dialog>
  );
}

function RepeatBadge({ repeat }) {
  if (!repeat || repeat === 'none') return null;
  return <span className="chip" style={{ textTransform: 'none' }} title={`Repeats ${repeatLabel(repeat).toLowerCase()}`}>🔁 {repeatLabel(repeat)}</span>;
}

// Visible calendar window and per-hour pixel height.
const CAL_START = 6, CAL_END = 24, HOUR_PX = 48;
const clampMin = (m) => Math.max(CAL_START * 60, Math.min(CAL_END * 60, m));
const topOf = (min) => ((clampMin(min) - CAL_START * 60) / 60) * HOUR_PX;
const heightOf = (s, e) => Math.max(16, topOf(e) - topOf(s));

// Build the positioned events for a single day. Overnight ranges (e.g. quiet
// hours 21:00–08:00) are split so each day only shows the part that falls
// inside it.
function dayEvents(S, dateKey, onEdit, stuName) {
  const st = S.settings, D = atDate(dateKey, '12:00'), w = st.days[D.getDay()];
  const ev = [];
  // Background boundaries first (so appointments sit on top).
  if (st.quiet.on) {
    const qs = toMin(st.quiet.s), qe = toMin(st.quiet.e);
    const spans = qs < qe ? [[qs, qe]] : [[0, qe], [qs, 24 * 60]]; // overnight → morning + evening part
    spans.forEach(([s, e], i) => ev.push({ key: `qt${i}`, cls: 'ev-qt', s, e, title: 'Quiet hours', sub: '🌙 Offline' }));
  }
  if (w.on) st.windows.forEach((x, i) => ev.push({ key: `win${i}`, cls: 'ev-win', s: toMin(x.s), e: toMin(x.e), title: 'Reply window', sub: '💬 Catch up on emails' }));
  if (st.family.on) {
    const fs = toMin(st.family.s), fe = toMin(st.family.e);
    const spans = fs < fe ? [[fs, fe]] : [[0, fe], [fs, 24 * 60]];
    spans.forEach(([s, e], i) => ev.push({ key: `fam${i}`, cls: 'ev-fam', s, e, title: 'Family Time', sub: '💛 Personal' }));
  }
  lessonsOn(S.lessons, dateKey).filter((l) => S.includeDemo || !l.demo).forEach((l) => ev.push({
    key: `l${l.occurrenceOf}`, cls: 'ev-appt', s: toMin(l.s), e: toMin(l.e),
    title: stuName(l.sid), sub: `${fmtT(l.s)} · ${l.subject}`, repeat: l.repeat,
    onClick: () => onEdit(l.occurrenceOf, dateKey),
  }));
  return ev;
}

function EventBlock({ e }) {
  const style = { top: topOf(e.s), height: heightOf(e.s, e.e) };
  const inner = (
    <>
      <b>{e.title}{e.repeat && e.repeat !== 'none' ? ' 🔁' : ''}</b>
      {heightOf(e.s, e.e) >= 30 && <span className="cal-ev-sub">{e.sub}</span>}
    </>
  );
  return e.onClick
    ? <button className={`cal-ev ${e.cls}`} style={style} onClick={e.onClick}>{inner}</button>
    : <div className={`cal-ev ${e.cls}`} style={style}>{inner}</div>;
}

// A full-height time axis shared by day and week grids.
function TimeAxis() {
  const hours = [];
  for (let h = CAL_START; h < CAL_END; h++) hours.push(h);
  return (
    <div className="cal-times">
      <div className="cal-corner" />
      {hours.map((h) => (
        <div key={h} className="cal-hour-label" style={{ ['--cal-hour']: HOUR_PX + 'px' }}>
          {fmtT(`${String(h).padStart(2, '0')}:00`)}
        </div>
      ))}
    </div>
  );
}

// One day column: header (optional) + positioned events over hour gridlines.
function DayColumn({ S, dateKey, onEdit, stuName, showHead }) {
  const x = atDate(dateKey, '12:00');
  const isToday = dateKey === dk(new Date());
  const ev = dayEvents(S, dateKey, onEdit, stuName);
  const bodyH = (CAL_END - CAL_START) * HOUR_PX;
  const lines = [];
  for (let h = CAL_START; h < CAL_END; h++) lines.push(h);
  // "Now" indicator only on today, within the visible window.
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const showNow = isToday && nowMin >= CAL_START * 60 && nowMin <= CAL_END * 60;
  return (
    <div className="cal-col">
      {showHead && (
        <div className={`cal-col-head ${isToday ? 'today' : ''}`}>
          {x.toLocaleDateString(undefined, { weekday: 'short' })}
          <small>{x.getDate()}</small>
        </div>
      )}
      <div className="cal-body" style={{ height: bodyH }}>
        {lines.map((h, i) => i === 0 ? null : <div key={h} className="cal-gridline" style={{ top: (h - CAL_START) * HOUR_PX }} />)}
        {showNow && <div className="cal-now" style={{ top: topOf(nowMin) }} />}
        {ev.map((e) => <EventBlock key={e.key} e={e} />)}
      </div>
    </div>
  );
}

function CalendarLegend() {
  return (
    <div className="cal-legend">
      <span><span className="sw" style={{ background: 'var(--lav)' }} />Appointment</span>
      <span><span className="sw" style={{ background: 'var(--sage-s)', border: '1px dashed var(--sage)' }} />Reply window</span>
      <span><span className="sw" style={{ background: 'var(--peach-s)' }} />Family Time</span>
      <span><span className="sw" style={{ background: 'var(--card-2)', border: '1px solid var(--line)' }} />Quiet hours</span>
    </div>
  );
}

export default function Schedule() {
  const { S, route, patchRoute } = useStore();
  const { stuName } = useStore();
  const mode = route.mode || 'day';
  const d = route.date || dk(new Date());
  const st = S.settings;
  const [sheet, setSheet] = useState(null);

  // When editing a specific occurrence, open the base series lesson but remember
  // the calendar date that was clicked (for "remove this date only").
  const openEdit = (baseId, onDate) => {
    const l = S.lessons.find((x) => x.id === baseId);
    if (l) setSheet({ ...l, date: onDate || l.date });
  };

  useEffect(() => {
    if (route.editId) {
      openEdit(route.editId, route.editDate);
      patchRoute({ editId: undefined, editDate: undefined });
    } else if (route.newLesson) {
      setSheet(newLessonDraft(S.students, route.date || dk(new Date())));
      patchRoute({ newLesson: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.editId, route.newLesson]);

  const D = atDate(d, '12:00');
  const closeSheet = (savedDate) => { setSheet(null); if (savedDate) patchRoute({ date: savedDate }); };
  const newLesson = () => setSheet(newLessonDraft(S.students, d));
  const shift = (v) => { patchRoute({ date: dk(addDays(D, (mode === 'week' ? 7 : 1) * v)) }); };

  let body;
  if (mode === 'day') {
    body = (
      <div className="cal cal-day">
        <TimeAxis />
        <div className="cal-cols">
          <DayColumn S={S} dateKey={d} onEdit={openEdit} stuName={stuName} showHead={false} />
        </div>
      </div>
    );
  } else {
    const mon = addDays(sod(D), -((D.getDay() + 6) % 7));
    const days = [...Array(7)].map((_, i) => dk(addDays(mon, i)));
    body = (
      <div className="cal cal-week">
        <TimeAxis />
        <div className="cal-cols">
          {days.map((k) => <DayColumn key={k} S={S} dateKey={k} onEdit={openEdit} stuName={stuName} showHead />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="row sp"><h2>Schedule</h2><button className="btn sm" onClick={newLesson}>+ Add appointment</button></div>
      <div className="tabs" role="tablist" aria-label="Schedule view">
        <button role="tab" aria-selected={mode === 'day'} className={`tab ${mode === 'day' ? 'on' : ''}`} onClick={() => patchRoute({ mode: 'day' })}>Day</button>
        <button role="tab" aria-selected={mode === 'week'} className={`tab ${mode === 'week' ? 'on' : ''}`} onClick={() => patchRoute({ mode: 'week' })}>Week</button>
      </div>
      <div className="row sp">
        <button className="btn ghost sm" onClick={() => shift(-1)} aria-label={mode === 'week' ? 'Previous week' : 'Previous day'}>←</button>
        <b>{mode === 'day'
          ? D.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
          : 'Week of ' + addDays(sod(D), -((D.getDay() + 6) % 7)).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</b>
        <button className="btn ghost sm" onClick={() => shift(1)} aria-label={mode === 'week' ? 'Next week' : 'Next day'}>→</button>
      </div>
      <CalendarLegend />
      {body}
      {sheet && <LessonSheet initial={sheet} onClose={closeSheet} />}
    </>
  );
}
