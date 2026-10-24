// Stateful workflow actions: family time, shutdown routine.
import { dk } from './utils.js';
import { Avail } from './availability.js';
import { act } from './intake.js';
import { defaults } from './state.js';

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
  const items = (S.settings && Array.isArray(S.settings.shutdownItems) && S.settings.shutdownItems.length)
    ? S.settings.shutdownItems : defaults().shutdownItems;
  S.shutdowns[k] = { items: items.filter((it) => chk[it.key]).map((it) => it.key), at: Date.now() };
  act(S, 'shutdown', Date.now());
  if (S.settings.quietAfterShutdown) {
    const n = Avail.next(new Date(Date.now() + 6e4), S.settings);
    if (n) S.offlineUntil = +n;
  }
}
