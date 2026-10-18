// Stateful workflow actions: family time, shutdown routine.
import { dk, addDays } from './utils.js';
import { Avail } from './availability.js';
import { act } from './intake.js';
import { SHUT } from './state.js';

export function startFamily(S, manual) {
  S.family = { active: true, manual, start: Date.now(), endedOn: null };
}

export function endFamily(S, early) {
  const f = S.family;
  act(S, 'family', f.start, { dur: (Date.now() - f.start) / 6e4, ok: !early });
  S.family = { active: false, manual: false, start: null, endedOn: early ? dk(new Date()) : null };
}

// Completes the shutdown routine. `chk` is the current checklist state (map of id->bool).
export function completeShutdown(S, chk) {
  const k = dk(new Date());
  S.shutdowns[k] = { items: SHUT.filter(([i]) => chk[i]).map(([i]) => i), at: Date.now() };
  act(S, 'shutdown', Date.now());
  if (S.settings.quietAfterShutdown) {
    const n = Avail.next(new Date(Date.now() + 6e4), S.settings);
    if (n) S.offlineUntil = +n;
  }
}
