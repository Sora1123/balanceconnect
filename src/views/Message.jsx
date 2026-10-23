import React, { useState } from 'react';
import { useStore } from '../store.jsx';
import { Head, StatusChip } from '../components/ui.jsx';
import { fmtD } from '../lib/utils.js';
import { Avail } from '../lib/availability.js';
import { CAT } from '../lib/triage.js';
import { sendReply } from '../lib/intake.js';

const PRI_OPTS = [['auto', 'Automatic'], ['high', 'High'], ['normal', 'Normal'], ['low', 'Low']];

export default function Message() {
  const { S, route, go, mutate, save, toast, stu } = useStore();
  const [replyText, setReplyText] = useState('');
  const m = S.messages.find((x) => x.id === route.id);
  if (!m) return <><Head title="Message" back="inbox" /><p>Message not found.</p></>;
  const s = stu(m.sid);

  const findM = (S) => S.messages.find((x) => x.id === m.id);

  const mRead = () => mutate((S) => { const x = findM(S); x.read = !x.read; });
  const mUrg = () => { mutate((S) => { const x = findM(S); x.urgent = !x.urgent; }); toast(m.urgent ? 'Urgent removed' : 'Marked urgent, moved up the queue'); };
  const mFol = () => { mutate((S) => { const x = findM(S); x.status = 'followup'; if (S.rm.active && !S.rm.done.includes(x.id)) S.rm.done.push(x.id); }); toast('Marked for follow-up'); };
  const mArc = () => {
    const prevStatus = m.status;
    const wasArchived = prevStatus === 'archived';
    mutate((S) => { const x = findM(S); x.status = wasArchived ? (x.repliedAt ? 'replied' : 'awaiting') : 'archived'; });
    if (wasArchived) {
      toast('Message restored');
    } else {
      toast('Message archived', { label: 'Undo', onClick: () => { mutate((S) => { const x = findM(S); if (x) x.status = prevStatus; }); toast('Archive undone'); } });
    }
    go('inbox');
  };
  const changePri = (v) => { mutate((S) => { findM(S).pri = v; }); toast('Priority updated'); };
  const send = () => {
    const t = replyText.trim();
    if (!t) { toast('Write a reply first'); return; }
    sendReply(S, { save }, m.id, t);
    toast('Reply saved in the conversation');
    setReplyText('');
    if (route.back === 'rm') go('rm'); else mutate(() => {});
  };

  return (
    <>
      <Head title={s.name} back={route.back || 'inbox'} />
      {s.email && <p className="mut" style={{ marginTop: -4 }}>From {s.email} · collected from your {/@outlook|@hotmail|@live/.test(s.email) ? 'Outlook' : 'Gmail'} inbox</p>}
      <div className="row wrap" style={{ gap: 6 }}>
        <StatusChip m={m} /><span className="chip">{CAT[m.cat][0]}</span><span className="mut">{s.course}</span>
      </div>
      {m.status === 'queued' && (
        <div className="warn">
          Queued at {fmtD(m.at)} · expected reply {m.exp ? Avail.describe(new Date(m.exp)) : 'when a window is set'}.
          {m.note === 'silenced' ? ' Notification was silenced.' : ''}
        </div>
      )}
      <section className="card">
        {m.thread.map((t, i) => (
          <div key={i} className={`bub ${t.f}`}>
            {t.f === 'a' && <><b className="sm">Automatic reply (draft)</b>{'\n'}</>}
            {t.t}
            <div className="mut" style={{ fontSize: 11, marginTop: 4 }}>{fmtD(t.at)}</div>
          </div>
        ))}
      </section>
      <div className="row wrap" style={{ gap: 6 }}>
        <button className="btn ghost sm" onClick={mRead}>Mark {m.read ? 'unread' : 'read'}</button>
        <button className="btn ghost sm" onClick={mUrg}>{m.urgent ? 'Remove urgent' : 'Mark urgent'}</button>
        <button className="btn ghost sm" onClick={mFol}>Needs follow-up</button>
        <button className="btn danger sm" onClick={mArc}>{m.status === 'archived' ? 'Unarchive' : 'Archive'}</button>
      </div>
      <label className="row sm">Priority
        <select value={m.pri} onChange={(e) => changePri(e.target.value)} style={{ width: 'auto' }}>
          {PRI_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      <section className="card">
        <label className="sm"><b>Reply</b> <span className="mut">(drafted here; in this demo nothing is actually sent)</span></label>
        <textarea placeholder="Write your reply…" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
        <button className="btn" onClick={send}>Send reply{s.email ? ` to ${s.email}` : ''}</button>
      </section>
    </>
  );
}
