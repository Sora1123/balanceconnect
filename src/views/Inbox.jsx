import React from 'react';
import { useStore } from '../store.jsx';
import { Avatar, StatusChip, CatChip } from '../components/ui.jsx';
import { ago } from '../lib/utils.js';
import { Avail } from '../lib/availability.js';
import { CAT } from '../lib/triage.js';
import { byTriage } from '../lib/triage.js';

const FILTERS = [['all', 'All'], ['urgent', 'Urgent'], ['normal', 'Normal'], ['enquiry', 'Enquiries'], ['queued', 'Queued'], ['archived', 'Archived']];

function MessageRow({ m }) {
  const { go, mutate, stuName } = useStore();
  const open = () => {
    mutate((S) => { const x = S.messages.find((y) => y.id === m.id); if (x) x.read = true; });
    go('msg', { id: m.id, back: 'inbox' });
  };
  return (
    <button className={`mrow ${m.read ? '' : 'unread'}`} onClick={open}>
      <Avatar sid={m.sid} />
      <div className="grow">
        <div className="row sp"><b>{stuName(m.sid)}</b><span className="mut">{ago(m.at)}</span></div>
        <div className="pv">{m.thread[0].t}</div>
        <div className="row wrap" style={{ gap: 4, marginTop: 4 }}>
          <StatusChip m={m} />
          <span className="chip">{CAT[m.cat][0]}</span>
          {m.demo && <span className="chip c-demo">Demo</span>}
          {m.sim && <span className="chip c-demo">Simulated</span>}
        </div>
        {m.status === 'queued' && m.exp && (
          <p className="mut" style={{ marginTop: 2 }}>Reply expected {Avail.describe(new Date(m.exp))}</p>
        )}
      </div>
      {!m.read && <span className="dot" />}
    </button>
  );
}

export default function Inbox() {
  const { S, route, go, patchRoute } = useStore();
  const q = (route.q || '').toLowerCase();
  const f = route.f || 'all';

  const { stuName } = useStore();
  let L = S.messages.filter((m) => (f === 'archived' ? m.status === 'archived' : m.status !== 'archived'));
  if (f === 'urgent') L = L.filter((m) => m.urgent);
  if (f === 'normal') L = L.filter((m) => !m.urgent && m.cat !== 'enquiry');
  if (f === 'enquiry') L = L.filter((m) => m.cat === 'enquiry');
  if (f === 'queued') L = L.filter((m) => m.status === 'queued');
  if (q) L = L.filter((m) => (stuName(m.sid) + ' ' + m.thread.map((t) => t.t).join(' ')).toLowerCase().includes(q));

  const open = byTriage(L.filter((m) => m.status !== 'replied'));
  const done = L.filter((m) => m.status === 'replied');
  const all = [...open, ...done];

  return (
    <>
      <div className="row sp"><h2>Messages</h2><button className="btn sm sage" onClick={() => go('rm')}>Response mode</button></div>
      <input
        type="search"
        placeholder="Search students or messages"
        value={route.q || ''}
        onChange={(e) => patchRoute({ q: e.target.value })}
        aria-label="Search"
      />
      <div className="tabs">
        {FILTERS.map(([k, l]) => (
          <button key={k} className={`tab ${f === k ? 'on' : ''}`} onClick={() => patchRoute({ f: k })}>{l}</button>
        ))}
      </div>
      <p className="mut">Sorted by triage: urgent → scheduling → existing students → new enquiries → other.</p>
      <section className="card" style={{ padding: '4px 12px' }}>
        <div className="list">
          {all.length ? all.map((m) => <MessageRow key={m.id} m={m} />)
            : <p className="mut" style={{ padding: '16px 4px' }}>No messages match. Try another filter, or send a test message from More → Test scenarios.</p>}
        </div>
      </section>
    </>
  );
}
