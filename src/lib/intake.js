// Intake (simulated messaging): act logging, receive, sendReply.
// Mutates S. `save` and `toast` are injected so this stays decoupled from React.
import { uid, isLive } from './utils.js';
import { Avail, availableNow, autoText } from './availability.js';
import { classify } from './triage.js';

export function act(S, type, at, extra = {}) { S.acts.push({ id: uid(), type, at: +at, ...extra }); }

export function receive(S, { save, toast }, sid, text, at = new Date(), opt = {}) {
  const st = S.settings, live = isLive(at), demo = !!opt.demo;
  const urgent = /urgent|exam|asap|急/i.test(text);
  const avail = live ? availableNow(S, at) : Avail.windowTime(at, st);
  const fam = live ? S.family.active || (Avail.inFamily(at, st) && !S.family.endedOn) : Avail.inFamily(at, st);
  const quiet = Avail.inQuiet(at, st) || (live && S.offlineUntil > +at);
  const m = {
    id: uid(), sid, at: +at, cat: classify(S, sid, text), urgent, pri: 'auto', read: false,
    status: avail ? 'awaiting' : 'queued', thread: [{ f: 's', t: text, at: +at }], sim: !!opt.sim, demo,
  };
  let next = null, auto = null;
  if (!avail) {
    next = Avail.next(live && S.offlineUntil > +at ? new Date(S.offlineUntil) : at, st);
    m.exp = next ? +next : null;
    if (st.auto) { auto = autoText(S, next, at); m.thread.push({ f: 'a', t: auto, at: +at + 1000 }); act(S, 'auto', at, { ref: m.id, demo }); }
  }
  // notification decision (in-app only)
  let note;
  if (fam) { note = urgent && st.urgent === 'always' ? 'notify' : (st.family.silence ? 'silenced' : 'notify'); }
  else if (quiet) { note = urgent && st.urgent !== 'hold' ? 'notify' : 'silenced'; }
  else note = st.notif ? 'notify' : 'silenced';
  m.note = note;
  S.messages.unshift(m); act(S, 'msg', at, { ref: m.id, after: !avail, demo }); if (note === 'silenced') act(S, 'silenced', at, { ref: m.id, demo });
  if (!opt.quiet) {
    save();
    const s = S.students.find((x) => x.id === sid);
    if (note === 'notify') toast(`🔔 ${s ? s.name : 'New message'}: ${text.slice(0, 50)}`);
  }
  return { m, avail, next, auto, note, fam, quiet };
}

export function sendReply(S, { save }, id, text) {
  const m = S.messages.find((x) => x.id === id), now = Date.now();
  m.thread.push({ f: 'm', t: text, at: now }); m.status = 'replied'; m.read = true; m.repliedAt = now;
  act(S, 'reply', now, { ref: id, dur: Math.max(0, (now - m.at) / 6e4), ok: Avail.windowTime(new Date(), S.settings) || S.rm.active });
  if (S.rm.active && !S.rm.done.includes(id)) S.rm.done.push(id);
  save();
}
