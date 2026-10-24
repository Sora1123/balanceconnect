import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store.jsx';
import { Head, IllLaptop } from '../components/ui.jsx';
import { DAYS, ORDER, toMin } from '../lib/utils.js';
import { Avail } from '../lib/availability.js';
import { makeTrackedApp } from '../lib/state.js';

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
  if (D.family.on && D.family.s === D.family.e) e.push('Family time start and end can’t be the same.');
  if (D.quiet.on && D.quiet.s === D.quiet.e) e.push('Quiet hours start and end can’t be the same.');
  if (D.auto && !D.tpl.trim()) e.push('Write an automatic reply message or turn automatic replies off.');
  return e;
}

function SettingsForm({ draft, setDraft, onSave, sec }) {
  const [errors, setErrors] = useState([]);
  const [siteInput, setSiteInput] = useState('');
  const [siteErr, setSiteErr] = useState('');
  const errRef = useRef(null);
  const D = draft;

  // scroll to requested section on mount
  useEffect(() => {
    if (sec) { const el = document.getElementById('sec-' + sec); if (el) el.scrollIntoView({ block: 'start' }); }
  }, [sec]);

  const upd = (k, v) => setDraft((prev) => { const next = clone(prev); setPath(next, k, v); return next; });

  const siteAdd = () => {
    const app = makeTrackedApp(siteInput);
    if (!app) { setSiteErr('Enter a website address, e.g. figma.com'); return; }
    if ((D.trackedApps || []).some((a) => a.key === app.key)) { setSiteErr('That website is already on the list.'); return; }
    setDraft((prev) => { const next = clone(prev); next.trackedApps = [...(next.trackedApps || []), app]; return next; });
    setSiteInput(''); setSiteErr('');
  };
  const siteDel = (key) => setDraft((prev) => { const next = clone(prev); next.trackedApps = (next.trackedApps || []).filter((a) => a.key !== key); return next; });

  const shutEdit = (key, label) => setDraft((prev) => {
    const next = clone(prev);
    next.shutdownItems = (next.shutdownItems || []).map((it) => (it.key === key ? { ...it, label } : it));
    return next;
  });
  const shutDel = (key) => setDraft((prev) => { const next = clone(prev); next.shutdownItems = (next.shutdownItems || []).filter((it) => it.key !== key); return next; });
  const shutAdd = () => setDraft((prev) => {
    const next = clone(prev);
    next.shutdownItems = [...(next.shutdownItems || []), { key: `item:${Math.random().toString(36).slice(2, 8)}`, label: '' }];
    return next;
  });

  const save = () => {
    const er = validate(D);
    if (er.length) { setErrors(er); setTimeout(() => errRef.current?.scrollIntoView({ block: 'center' }), 0); return; }
    setErrors([]);
    // Drop any blank end-of-day items before saving.
    const cleaned = { ...D, shutdownItems: (D.shutdownItems || []).filter((it) => it.label.trim()).map((it) => ({ key: it.key, label: it.label.trim() })) };
    onSave(cleaned);
  };

  const cb = (k) => ({ type: 'checkbox', checked: !!getPath(D, k), onChange: (e) => upd(k, e.target.checked) });

  return (
    <>
      <section className="card" id="sec-work">
        <h3>About you</h3>
        <div className="row">
          <label className="sm grow">Name<input value={D.name} onChange={(e) => upd('name', e.target.value)} /></label>
          <label className="sm grow">What you do<input value={D.subject} onChange={(e) => upd('subject', e.target.value)} placeholder="e.g. Independent design studio" /></label>
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
        <p className="mut">When an email arrives outside your reply windows, senders get this
          reply automatically so they know when to expect an answer.</p>
        <label className="sm" htmlFor="auto-tpl">Your automatic reply
          <textarea id="auto-tpl" value={D.tpl} onChange={(e) => upd('tpl', e.target.value)} placeholder="Hi! Thanks for your message…" />
        </label>
        <p className="mut">Tip: the app fills in these for you automatically —
          <b> {'{next}'}</b> becomes your next reply time, and <b>{'{name}'}</b> becomes your name.</p>
        <div className="row wrap" style={{ gap: 6 }}>
          <button type="button" className="btn ghost sm" onClick={() => upd('tpl', (D.tpl || '') + '{next}')}>Insert “next reply time”</button>
          <button type="button" className="btn ghost sm" onClick={() => upd('tpl', (D.tpl || '') + '{name}')}>Insert “your name”</button>
        </div>
        <p className="mut">Here’s how it would look right now:</p>
        <div className="bub a" style={{ maxWidth: '100%' }}>{previewAR(D)}</div>
      </section>

      <section className="card" id="sec-apps">
        <h3>Websites to measure</h3>
        <p className="mut">Add web apps you use for work (e.g. figma.com, notion.so) to see how much time you spend on each in your analytics.</p>
        {(D.trackedApps || []).length > 0 && (D.trackedApps || []).map((a) => (
          <div key={a.key} className="row sp" style={{ gap: 8 }}>
            <span className="sm"><span aria-hidden="true">🌐 </span>{a.label}<span className="mut"> · {a.url}</span></span>
            <button className="btn danger sm" onClick={() => siteDel(a.key)} aria-label={`Remove ${a.label}`}>✕</button>
          </div>
        ))}
        <div className="row" style={{ gap: 8 }}>
          <input
            className="grow"
            value={siteInput}
            onChange={(e) => { setSiteInput(e.target.value); if (siteErr) setSiteErr(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); siteAdd(); } }}
            placeholder="figma.com"
            aria-label="Website address"
          />
          <button type="button" className="btn ghost" onClick={siteAdd}>+ Add</button>
        </div>
        {siteErr && <p className="sm" style={{ color: 'var(--rose)' }}>{siteErr}</p>}
        <p className="mut">Note: a web app can’t read other sites’ usage directly — in this demo these appear with example data.</p>
      </section>

      <section className="card" id="sec-shutdown">
        <h3>End-of-day checklist</h3>
        <p className="mut">The steps you tick off before finishing for the day. Edit the wording, remove any you don’t need, or add your own.</p>
        {(D.shutdownItems || []).map((it) => (
          <div key={it.key} className="row" style={{ gap: 8 }}>
            <input
              className="grow"
              value={it.label}
              onChange={(e) => shutEdit(it.key, e.target.value)}
              placeholder="Checklist item"
              aria-label="Checklist item"
            />
            <button className="btn danger sm" onClick={() => shutDel(it.key)} aria-label="Remove checklist item">✕</button>
          </div>
        ))}
        <button type="button" className="btn ghost sm" onClick={shutAdd}>+ Add item</button>
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
      <p className="sm">Welcome! Set when you work, when you reply, and when you’re off. You can change all of this later in More.</p>
      <SettingsForm draft={draft} setDraft={setDraft} onSave={onSave} />
    </>
  );
}
