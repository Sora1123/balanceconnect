import { describe, it, expect } from 'vitest';
import { conflicts } from '../src/lib/schedule.js';
import { defaults } from '../src/lib/state.js';

const stuName = (id) => ({ yuki: 'Yuki', kenji: 'Kenji' }[id] || 'Unknown');

// Monday 2026-01-05.
const DATE = '2026-01-05';

function makeState(lessons = []) {
  return {
    settings: {
      ...defaults(),
      days: [
        { on: false, s: '09:00', e: '17:00' },
        { on: true, s: '09:00', e: '17:00' },
        { on: true, s: '09:00', e: '17:00' },
        { on: true, s: '09:00', e: '17:00' },
        { on: true, s: '09:00', e: '17:00' },
        { on: true, s: '09:00', e: '17:00' },
        { on: false, s: '09:00', e: '17:00' },
      ],
      windows: [{ s: '09:00', e: '11:00' }],
      family: { on: true, s: '19:00', e: '21:00', silence: true },
      quiet: { on: true, s: '21:00', e: '08:00' },
    },
    lessons,
  };
}

describe('schedule conflicts', () => {
  it('flags a hard overlap with another lesson', () => {
    const S = makeState([{ id: 'a', sid: 'yuki', date: DATE, s: '13:00', e: '14:00' }]);
    const L = { id: 'b', sid: 'kenji', date: DATE, s: '13:30', e: '14:30' };
    const c = conflicts(S, stuName, L);
    expect(c.hard.length).toBe(1);
    expect(c.hard[0]).toMatch(/Overlaps Yuki/);
  });

  it('does not flag a touching but non-overlapping lesson', () => {
    const S = makeState([{ id: 'a', sid: 'yuki', date: DATE, s: '13:00', e: '14:00' }]);
    const L = { id: 'b', sid: 'kenji', date: DATE, s: '14:00', e: '15:00' };
    expect(conflicts(S, stuName, L).hard.length).toBe(0);
  });

  it('ignores the lesson being edited (same id)', () => {
    const S = makeState([{ id: 'a', sid: 'yuki', date: DATE, s: '13:00', e: '14:00' }]);
    const L = { id: 'a', sid: 'yuki', date: DATE, s: '13:00', e: '14:00' };
    expect(conflicts(S, stuName, L).hard.length).toBe(0);
  });

  it('soft-warns when a lesson falls inside Family Time', () => {
    const S = makeState();
    const L = { id: 'b', sid: 'kenji', date: DATE, s: '19:30', e: '20:30' };
    const c = conflicts(S, stuName, L);
    expect(c.hard.length).toBe(0);
    expect(c.soft.some((m) => /Family Time/.test(m))).toBe(true);
  });

  it('soft-warns on a non-working day', () => {
    const sunday = '2026-01-04';
    const S = makeState();
    const L = { id: 'b', sid: 'kenji', date: sunday, s: '13:00', e: '14:00' };
    const c = conflicts(S, stuName, L);
    expect(c.soft.some((m) => /not a working day/.test(m))).toBe(true);
  });

  it('soft-warns when overlapping a response window', () => {
    const S = makeState();
    const L = { id: 'b', sid: 'kenji', date: DATE, s: '10:00', e: '10:30' };
    const c = conflicts(S, stuName, L);
    expect(c.soft.some((m) => /response window/.test(m))).toBe(true);
  });
});
