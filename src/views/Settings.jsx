import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store.jsx';
import { Head, IllLaptop } from '../components/ui.jsx';
import { DAYS, ORDER, toMin } from '../lib/utils.js';
import { Avail } from '../lib/availability.js';

// Deep-set a dotted path on an object (clone-friendly).
function setPath(o, k, v) {
  const p = k.split('.'); let x = o;
  p.slice(0, -1).forEach((s) => { x = x[s]; });
  x[p.at(-1)] = v;
}

function clone(o) { return JSON.parse(JSON.stringify(o)); }

function previewAR(D) {
  const n = Avail.windowTime(new Date(), D) ? Avail.next(new Date(Date.now() + 864e5 / 2), D) : Avail.next(new Date(), D);
  return D.tpl.replaceAll('{next}', Avail.describe(n)).replaceAll('{name}', D.name);
}

function validate(D) {
  const e = [];
  if (!D.name.trim()) e.push('Add your name.');
  if (!ORDER.some((i) => D.days[i].on)) e.push('Choose at least one working day.');
  ORDER.forEach((i) => { const d = D.days[i]; if (d.on && toMin(d.s) >= toMin(d.e)) e.push(`${DAYS[i]}: end time must be after start time.`); });
  D.windows.forEach((w, i) => { if (!w.s || !w.e || toMin(w.s) >= toMin(w.e)) e.push(`Response window ${i + 1}: end must be after start (same day).`); });
  if (!D.windows.length) e.push('Add at least one response window.');
  if (D.family.on && D.family.s === D.family.e) e.push('Family time start and end can’t be the same.');
  if (D.quiet.on && D.quiet.s === D.quiet.e) e.push('Quiet hours start and end can’t be the same.');
  if (D.auto && !D.tpl.trim()) e.push('Write an automatic reply message or turn automatic replies off.');
  return e;
}

function SettingsForm({ draft, setDraft, onSave, sec }) {
  const [errors, setErrors] = useState([]);
  const errRef = useRef(null);
  const D = draft;

  // scroll to requested section on mount
  useEffect(() => {
    if (sec) { const el = document.getElementById('sec-' + sec); if (el) el.scrollIntoView({ block: 'start' }); }
  }, [sec]);

  const upd = (k, v) => setDraft((prev) => { const next = clone(prev); setPath(next, k, v); return next; });
  const winAdd = () => setDraft((prev) => { const next = clone(prev); next.windows.push({ s: '12:00', e: '13:00' }); return next; });
  const winDel = (i) => setDraft((prev) => { const next = clone(prev); next.windows.splice(i, 1); return next; });

  const save = () => {
    const er = validate(D);
    if (er.length) { setErrors(er); setTimeout(() => errRef.current?.scrollIntoView({ block: 'center' }), 0); return; }
    setErrors([]);
    onSave(D);
  };

  const cb = (k) => ({ type: 'checkbox', checked: !!getPath(D, k), onChange: (e) => upd(k, e.target.checked) });

  return (
    <>
      <section className="card" id="sec-work">
        <h3>About you</h3>
        <div className="row">
          <label className="sm grow">Name<input value={D.name} onChange={(e) => upd('name', e.target.value)} /></label>
          <label className="sm grow">Subject<input value={D.subject} onChange={(e) => upd('subject', e.target.value)} /></label>
        </div>
        <h3>Working days & hours</h3>
        {ORDER.map((i) => (
          <div key={i} className="row">
            <label className="tog" style={{ width: 72 }}><input {...cb(`days.${i}.on`)} />{DAYS[i]}</label>
            <input type="time" value={D.days[i].s} onChange={(e) => upd(`days.${i}.s`, e.target.value)} aria-label={`${DAYS[i]} start`} />
            <span className="mut">to</span>
            <input type="time" value={D.days[i].e} onChange={(e) => upd(`days.${i}.e`, e.target.value)} aria-label={`${DAYS[i]} end`} />
          </div>
        ))}
      </section>

      <section className="card">
        <h3>Response windows</h3>
        <p className="mut">When you plan to reply to messages on working days.</p>
        {D.windows.map((w, i) => (
          <div key={i} className="row">
            <input type="time" value={w.s} onChange={(e) => upd(`windows.${i}.s`, e.target.value)} aria-label="Window start" />
            <span className="mut">to</span>
            <input type="time" value={w.e} onChange={(e) => upd(`windows.${i}.e`, e.target.value)} aria-label="Window end" />
            <button className="btn danger sm" onClick={() => winDel(i)} aria-label="Remove window">✕</button>
          </div>
        ))}
        <button className="btn ghost sm" onClick={winAdd}>+ Add window</button>
      </section>

      <section className="card" id="sec-family">
        <label className="tog"><input {...cb('family.on')} /><h3>Family time</h3></label>
        <div className="row">
          <input type="time" value={D.family.s} onChange={(e) => upd('family.s', e.target.value)} aria-label="Family start" />
          <span className="mut">to</span>
          <input type="time" value={D.family.e} onChange={(e) => upd('family.e', e.target.value)} aria-label="Family end" />
        </div>
        <label className="tog sm"><input {...cb('family.silence')} />Silence non-urgent notifications</label>
      </section>

      <section className="card" id="sec-quiet">
        <label className="tog"><input {...cb('quiet.on')} /><h3>Quiet hours</h3></label>
        <div className="row">
          <input type="time" value={D.quiet.s} onChange={(e) => upd('quiet.s', e.target.value)} aria-label="Quiet start" />
          <span className="mut">to</span>
          <input type="time" value={D.quiet.e} onChange={(e) => upd('quiet.e', e.target.value)} aria-label="Quiet end" />
        </div>
        <p className="mut">Overnight ranges like 9 PM – 8 AM work.</p>
      </section>

      <section className="card" id="sec-auto">
        <label className="tog"><input {...cb('auto')} /><h3>Automatic replies</h3></label>
        <label className="sm">Message <span className="mut">· {'{next}'} = next reply time, {'{name}'} = your name</span>
          <textarea value={D.tpl} onChange={(e) => upd('tpl', e.target.value)} />
        </label>
        <p className="mut">Preview if a message arrived now:</p>
        <div className="bub a" style={{ maxWidth: '100%' }}>{previewAR(D)}</div>
      </section>

      <section className="card" id="sec-notif">
        <h3>Notifications</h3>
        <label className="tog sm"><input {...cb('notif')} />Show in-app alerts during working time</label>
        <p className="sm"><b>Urgent messages</b></p>
        {[['hold', 'Hold until my next window (respect all boundaries)'], ['except_family', 'Alert me in quiet hours, but not during Family Time'], ['always', 'Always alert me, even in Family Time']].map(([k, l]) => (
          <label key={k} className="tog sm">
            <input type="radio" name="urg" value={k} checked={D.urgent === k} onChange={() => upd('urgent', k)} style={{ width: 18, height: 18, margin: 0 }} />{l}
          </label>
        ))}
        <label className="tog sm"><input {...cb('quietAfterShutdown')} />Go offline until the next window after my shutdown routine</label>
      </section>

      <section className="card" id="sec-student">
        <h3>Student view</h3>
        <p className="mut">Choose what students can see. Family time is never shown.</p>
        <label className="tog sm"><input {...cb('show.days')} />Working days & hours</label>
        <label className="tog sm"><input {...cb('show.windows')} />Response windows</label>
        <label className="tog sm"><input {...cb('show.resp')} />Typical response time</label>
        <input value={D.typical} onChange={(e) => upd('typical', e.target.value)} aria-label="Typical response time" />
      </section>

      <div ref={errRef}>{errors.length > 0 && <div className="err">{errors.map((e, i) => <React.Fragment key={i}>{e}<br /></React.Fragment>)}</div>}</div>
      <button className="btn full" onClick={save}>Save Settings</button>
    </>
  );
}

function getPath(o, k) { const p = k.split('.'); let x = o; for (const s of p) x = x[s]; return x; }

function useSettingsSave() {
  const { S, mutate, toast, go } = useStore();
  return (D) => {
    const first = !S.onboarded;
    mutate((S) => {
      S.settings = clone(D);
      S.onboarded = true;
      S.messages.forEach((x) => {
        if (x.status === 'queued') { const n = Avail.next(new Date(Math.max(Date.now(), x.at)), S.settings); x.exp = n ? +n : null; }
      });
    });
    toast('Settings saved');
    go(first ? 'home' : 'more');
  };
}

export function Settings() {
  const { S, route } = useStore();
  const [draft, setDraft] = useState(() => clone(S.settings));
  const onSave = useSettingsSave();
  return (
    <>
      <Head title="Working preferences" back="more" />
      <SettingsForm draft={draft} setDraft={setDraft} onSave={onSave} sec={route.sec} />
    </>
  );
}

export function Onboard() {
  const { S } = useStore();
  const [draft, setDraft] = useState(() => clone(S.settings));
  const onSave = useSettingsSave();
  return (
    <>
      <section className="card" style={{ background: 'var(--lav)', border: 0, flexDirection: 'row', alignItems: 'center' }}>
        <IllLaptop />
        <div><h1>BalanceConnect</h1><p className="sm">Clear Boundaries. Meaningful Connections.</p></div>
      </section>
      <p className="sm">Welcome! Set when you teach, when you reply, and when you’re off. You can change all of this later in More.</p>
      <SettingsForm draft={draft} setDraft={setDraft} onSave={onSave} />
    </>
  );
}
