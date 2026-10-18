import React, { useState, useEffect } from 'react';
import { useStore } from '../store.jsx';
import { fmtT, dk, atDate, addDays, sod, toMin, uid, DAYS } from '../lib/utils.js';
import { conflicts } from '../lib/schedule.js';

function LessonSheet({ initial, onClose }) {
  const { S, mutate, save, toast, confirmBox, stuName } = useStore();
  const [L, setL] = useState(initial);
  const [cf, setCf] = useState(null);
  const isExisting = S.lessons.some((x) => x.id === L.id);
  const set = (k, v) => setL((p) => ({ ...p, [k]: v }));

  const close = () => onClose(null);

  const del = () => {
    const id = L.id;
    confirmBox('Delete this lesson?', 'It will be removed from your schedule.', 'Delete', () => {
      mutate((S) => { S.lessons = S.lessons.filter((x) => x.id !== id); });
      toast('Lesson deleted');
    });
    onClose(null);
  };

  const doSave = () => {
    const lesson = { ...L, subject: (L.subject || '').trim() || 'Lesson' };
    if (!lesson.date || !lesson.s || !lesson.e || toMin(lesson.e) <= toMin(lesson.s)) {
      setCf({ err: 'End time must be after start time.' }); return;
    }
    const c = conflicts(S, (id) => stuName(id), lesson);
    if (c.hard.length) { setCf({ err: c.hard.join('. ') + '. Pick another time.' }); return; }
    const prevSoft = cf?.soft?.join();
    if (c.soft.length && prevSoft !== c.soft.join()) { setCf({ soft: c.soft }); setL(lesson); return; }
    mutate((S) => {
      const i = S.lessons.findIndex((x) => x.id === lesson.id);
      if (i >= 0) S.lessons[i] = lesson; else S.lessons.push(lesson);
    });
    toast('Lesson saved');
    onClose(lesson.date);
  };

  return (
    <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div>
        <h3>{isExisting ? 'Edit lesson' : 'New lesson'}</h3>
        <label className="sm">Student
          <select value={L.sid} onChange={(e) => set('sid', e.target.value)}>
            {S.students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="sm">Subject<input value={L.subject} onChange={(e) => set('subject', e.target.value)} /></label>
        <label className="sm">Date<input type="date" value={L.date} onChange={(e) => set('date', e.target.value)} /></label>
        <div className="row">
          <label className="sm grow">Start<input type="time" value={L.s} onChange={(e) => set('s', e.target.value)} style={{ width: '100%' }} /></label>
          <label className="sm grow">End<input type="time" value={L.e} onChange={(e) => set('e', e.target.value)} style={{ width: '100%' }} /></label>
        </div>
        <label className="sm">Notes<textarea value={L.notes} onChange={(e) => set('notes', e.target.value)} /></label>
        {cf?.err && <div className="err">{cf.err}</div>}
        {cf?.soft?.length > 0 && <div className="warn">Heads up: {cf.soft.join('; ')}. Tap Save again to keep it.</div>}
        <div className="row">
          <button className="btn ghost grow" onClick={close}>Cancel</button>
          {isExisting && <button className="btn danger" onClick={del}>Delete</button>}
          <button className="btn grow" onClick={doSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

function DayItems({ dateKey }) {
  const { S, go, stuName } = useStore();
  const st = S.settings;
  const D = atDate(dateKey, '12:00'), w = st.days[D.getDay()];
  const I = [];
  S.lessons.filter((l) => l.date === dateKey).forEach((l) => I.push([l.s,
    <div key={'l' + l.id} className="blk lesson">
      <span className="tm">{fmtT(l.s)}<br />{fmtT(l.e)}</span>
      <div className="grow"><b>{stuName(l.sid)}</b><p className="sm">📘 Lesson · {l.subject}</p></div>
      <button className="btn ghost sm" onClick={() => go('schedule', { date: l.date, editId: l.id })}>Edit</button>
    </div>]));
  if (w.on) st.windows.forEach((x, idx) => I.push([x.s,
    <div key={'w' + idx} className="blk win"><span className="tm">{fmtT(x.s)}<br />{fmtT(x.e)}</span><div><b>Response window</b><p className="sm">💬 Reply to messages, no lesson</p></div></div>]));
  if (st.family.on) I.push([st.family.s,
    <div key="fam" className="blk fam"><span className="tm">{fmtT(st.family.s)}<br />{fmtT(st.family.e)}</span><div><b>Family Time</b><p className="sm">💛 Personal, private to you</p></div></div>]);
  if (st.quiet.on) I.push([st.quiet.s,
    <div key="qt" className="blk qt"><span className="tm">{fmtT(st.quiet.s)}<br />{fmtT(st.quiet.e)}</span><div><b>Quiet hours</b><p className="sm">🌙 Offline, automatic replies on</p></div></div>]);
  I.sort((a, b) => toMin(a[0]) - toMin(b[0]));
  return (
    <>
      <p className="mut">{w.on ? `Working ${fmtT(w.s)}–${fmtT(w.e)}` : 'Not a working day'}</p>
      {I.map(([, node]) => node)}
    </>
  );
}

export default function Schedule() {
  const { S, route, patchRoute, go, stuName } = useStore();
  const mode = route.mode || 'day';
  const d = route.date || dk(new Date());
  const st = S.settings;
  const [sheet, setSheet] = useState(null);

  // Open the sheet when arriving with editId / newLesson intent from other views.
  useEffect(() => {
    if (route.editId) {
      const l = S.lessons.find((x) => x.id === route.editId);
      if (l) setSheet({ ...l });
      patchRoute({ editId: undefined });
    } else if (route.newLesson) {
      setSheet({ id: uid(), sid: S.students[0].id, subject: '', date: route.date || dk(new Date()), s: '13:00', e: '14:00', notes: '' });
      patchRoute({ newLesson: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.editId, route.newLesson]);

  const D = atDate(d, '12:00');
  const closeSheet = (savedDate) => { setSheet(null); if (savedDate) patchRoute({ date: savedDate }); };

  const newLesson = () => setSheet({ id: uid(), sid: S.students[0].id, subject: '', date: d, s: '13:00', e: '14:00', notes: '' });
  const editLesson = (l) => setSheet({ ...l });
  const shift = (v) => { patchRoute({ date: dk(addDays(D, (mode === 'week' ? 7 : 1) * v)) }); };

  let body;
  if (mode === 'day') {
    body = <DayItems dateKey={d} />;
  } else {
    const mon = addDays(sod(D), -((D.getDay() + 6) % 7));
    body = [...Array(7)].map((_, i) => {
      const x = addDays(mon, i), k = dk(x);
      const Ls = S.lessons.filter((l) => l.date === k).sort((a, b) => toMin(a.s) - toMin(b.s));
      const w = st.days[x.getDay()];
      return (
        <section key={k} className="card" style={{ padding: 12, gap: 6 }}>
          <div className="row sp"><b>{x.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</b>
            <button className="btn ghost sm" onClick={() => patchRoute({ mode: 'day', date: k })}>Day view</button></div>
          <p className="mut">{w.on ? `${fmtT(w.s)}–${fmtT(w.e)} · ${st.windows.length} response window${st.windows.length === 1 ? '' : 's'}` : 'Day off'}</p>
          {Ls.map((l) => (
            <div key={l.id} className="blk lesson" style={{ padding: '6px 10px' }}>
              <span className="tm">{fmtT(l.s)}</span><span className="sm grow">{stuName(l.sid)} · {l.subject}</span>
            </div>
          ))}
        </section>
      );
    });
  }

  return (
    <>
      <div className="row sp"><h2>Schedule</h2><button className="btn sm" onClick={newLesson}>+ Lesson</button></div>
      <div className="tabs">
        <button className={`tab ${mode === 'day' ? 'on' : ''}`} onClick={() => patchRoute({ mode: 'day' })}>Day</button>
        <button className={`tab ${mode === 'week' ? 'on' : ''}`} onClick={() => patchRoute({ mode: 'week' })}>Week</button>
      </div>
      <div className="row sp">
        <button className="btn ghost sm" onClick={() => shift(-1)} aria-label="Previous">←</button>
        <b>{mode === 'day'
          ? D.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
          : 'Week of ' + addDays(sod(D), -((D.getDay() + 6) % 7)).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</b>
        <button className="btn ghost sm" onClick={() => shift(1)} aria-label="Next">→</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{body}</div>
      {sheet && <LessonSheet initial={sheet} onClose={closeSheet} />}
    </>
  );
}
