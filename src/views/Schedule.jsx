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
    toast('Lesson series deleted');
  };
  const removeOccurrence = () => {
    const id = L.id;
    mutate((S) => {
      const x = S.lessons.find((l) => l.id === id);
      if (x) x.exdates = [...(x.exdates || []), occurrenceDate];
    });
    toast('This lesson was removed');
  };
  const del = () => {
    onClose(null);
    if (isExisting && isRecurring) {
      confirmBox(
        'Delete a repeating lesson',
        `“${(L.subject || 'lesson').trim()}” with ${stuName(L.sid)} repeats ${repeatLabel(L.repeat).toLowerCase()}. Remove just this date, or the whole repeating series?`,
        'Remove the whole series',
        removeSeries,
        { danger: true, secondary: { label: 'Remove this date only', onClick: removeOccurrence } },
      );
    } else {
      confirmBox(
        'Delete this lesson?',
        `This removes ${stuName(L.sid)}’s “${(L.subject || 'lesson').trim()}” from your schedule. This can’t be undone.`,
        'Delete lesson',
        removeSeries,
        { danger: true },
      );
    }
  };

  const doSave = () => {
    const lesson = { ...L, subject: (L.subject || '').trim() || 'Lesson' };
    if (!lesson.date) { setCf({ err: 'Please choose a date for the lesson.' }); return; }
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
    toast(lesson.repeat !== 'none' ? 'Repeating lesson saved' : 'Lesson saved');
    onClose(lesson.date);
  };

  return (
    <Dialog title={isExisting ? 'Edit lesson' : 'New lesson'} onClose={close}>
      <label className="sm">Student
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
      <label className="sm">What is the lesson about?
        <input value={L.subject} onChange={(e) => set('subject', e.target.value)} placeholder="e.g. Hiragana review, JLPT N3, IB Paper 1" />
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
      {isRecurring && <p className="mut">This lesson will repeat {repeatLabel(L.repeat).toLowerCase()} on {atDate(L.date, '12:00').toLocaleDateString(undefined, { weekday: 'long' })}s.</p>}
      <label className="sm">Notes <span className="mut">(optional)</span><textarea value={L.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything to remember for this lesson" /></label>
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

function DayItems({ dateKey, onEdit }) {
  const { S, stuName } = useStore();
  const st = S.settings;
  const D = atDate(dateKey, '12:00'), w = st.days[D.getDay()];
  const I = [];
  lessonsOn(S.lessons, dateKey).forEach((l) => I.push([l.s,
    <div key={'l' + l.occurrenceOf} className="blk lesson">
      <span className="tm">{fmtT(l.s)}<br />{fmtT(l.e)}</span>
      <div className="grow">
        <div className="row wrap" style={{ gap: 6 }}><b>{stuName(l.sid)}</b><RepeatBadge repeat={l.repeat} /></div>
        <p className="sm">📘 {l.subject}</p>
      </div>
      <button className="btn ghost sm" onClick={() => onEdit(l.occurrenceOf, dateKey)}>Edit</button>
    </div>]));
  if (w.on) st.windows.forEach((x, idx) => I.push([x.s,
    <div key={'w' + idx} className="blk win"><span className="tm">{fmtT(x.s)}<br />{fmtT(x.e)}</span><div><b>Reply window</b><p className="sm">💬 Catch up on messages</p></div></div>]));
  if (st.family.on) I.push([st.family.s,
    <div key="fam" className="blk fam"><span className="tm">{fmtT(st.family.s)}<br />{fmtT(st.family.e)}</span><div><b>Family Time</b><p className="sm">💛 Personal, private to you</p></div></div>]);
  if (st.quiet.on) I.push([st.quiet.s,
    <div key="qt" className="blk qt"><span className="tm">{fmtT(st.quiet.s)}<br />{fmtT(st.quiet.e)}</span><div><b>Quiet hours</b><p className="sm">🌙 Offline, automatic replies on</p></div></div>]);
  I.sort((a, b) => toMin(a[0]) - toMin(b[0]));
  return (
    <>
      <p className="mut">{w.on ? `Teaching ${fmtT(w.s)}–${fmtT(w.e)}` : 'Not a teaching day'}</p>
      {I.length ? I.map(([, node]) => node) : <p className="mut">Nothing scheduled.</p>}
    </>
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
    body = <DayItems dateKey={d} onEdit={openEdit} />;
  } else {
    const mon = addDays(sod(D), -((D.getDay() + 6) % 7));
    body = [...Array(7)].map((_, i) => {
      const x = addDays(mon, i), k = dk(x);
      const Ls = lessonsOn(S.lessons, k);
      const w = st.days[x.getDay()];
      const isToday = k === dk(new Date());
      return (
        <section key={k} className="card" style={{ padding: 12, gap: 6, outline: isToday ? '2px solid var(--pur)' : 'none' }}>
          <div className="row sp"><b>{x.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}{isToday ? ' · Today' : ''}</b>
            <button className="btn ghost sm" onClick={() => patchRoute({ mode: 'day', date: k })}>Open day</button></div>
          <p className="mut">{w.on ? `${fmtT(w.s)}–${fmtT(w.e)}` : 'Day off'}</p>
          {Ls.length ? Ls.map((l) => (
            <button key={l.occurrenceOf} className="blk lesson" style={{ padding: '6px 10px', width: '100%', border: 0, textAlign: 'left', cursor: 'pointer' }}
              onClick={() => openEdit(l.occurrenceOf, k)}>
              <span className="tm">{fmtT(l.s)}</span>
              <span className="sm grow">{stuName(l.sid)} · {l.subject}</span>
              {l.repeat && l.repeat !== 'none' && <span aria-hidden="true" title="Repeats">🔁</span>}
            </button>
          )) : <p className="mut sm">No lessons</p>}
        </section>
      );
    });
  }

  return (
    <>
      <div className="row sp"><h2>Schedule</h2><button className="btn sm" onClick={newLesson}>+ Add lesson</button></div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{body}</div>
      {sheet && <LessonSheet initial={sheet} onClose={closeSheet} />}
    </>
  );
}
