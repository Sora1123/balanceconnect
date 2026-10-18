import { describe, it, expect } from 'vitest';
import { toMin, inRange, fmtT, dk, atDate, addDays, dur, pct, initials } from '../src/lib/utils.js';
import { Avail, availableNow } from '../src/lib/availability.js';
import { defaults } from '../src/lib/state.js';

describe('utils', () => {
  it('toMin converts HH:MM to minutes', () => {
    expect(toMin('00:00')).toBe(0);
    expect(toMin('09:30')).toBe(570);
    expect(toMin('23:59')).toBe(1439);
  });

  it('inRange handles same-day ranges', () => {
    expect(inRange(toMin('10:00'), '09:00', '17:00')).toBe(true);
    expect(inRange(toMin('08:59'), '09:00', '17:00')).toBe(false);
    expect(inRange(toMin('17:00'), '09:00', '17:00')).toBe(false); // end exclusive
  });

  it('inRange handles overnight ranges (21:00–08:00)', () => {
    expect(inRange(toMin('23:00'), '21:00', '08:00')).toBe(true);
    expect(inRange(toMin('07:00'), '21:00', '08:00')).toBe(true);
    expect(inRange(toMin('08:00'), '21:00', '08:00')).toBe(false);
    expect(inRange(toMin('12:00'), '21:00', '08:00')).toBe(false);
  });

  it('fmtT formats 12-hour clock with AM/PM', () => {
    expect(fmtT('00:00')).toBe('12:00 AM');
    expect(fmtT('13:05')).toBe('1:05 PM');
    expect(fmtT('12:00')).toBe('12:00 PM');
  });

  it('dk / atDate round-trip a date key', () => {
    const key = dk(new Date(2026, 0, 15, 9, 30));
    expect(key).toBe('2026-01-15');
    const d = atDate(key, '09:30');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(9);
  });

  it('addDays shifts by whole days', () => {
    const d = addDays(new Date(2026, 0, 31), 1);
    expect(dk(d)).toBe('2026-02-01');
  });

  it('dur formats minutes and hours', () => {
    expect(dur(30)).toBe('30 min');
    expect(dur(90)).toBe('1.5 h');
    expect(dur(660)).toBe('11 h');
  });

  it('pct guards against divide-by-zero', () => {
    expect(pct(0, 0)).toBe(0);
    expect(pct(1, 4)).toBe(25);
  });

  it('initials takes up to two leading letters', () => {
    expect(initials('Yuki Tanaka')).toBe('YT');
    expect(initials('Mika')).toBe('M');
  });
});

describe('availability', () => {
  // A deterministic settings object: Mon–Fri 09:00–17:00, one window 09:00–11:00,
  // family 19:00–21:00, quiet 21:00–08:00.
  const st = {
    ...defaults(),
    days: [
      { on: false, s: '09:00', e: '17:00' }, // Sun
      { on: true, s: '09:00', e: '17:00' },  // Mon
      { on: true, s: '09:00', e: '17:00' },
      { on: true, s: '09:00', e: '17:00' },
      { on: true, s: '09:00', e: '17:00' },
      { on: true, s: '09:00', e: '17:00' },  // Fri
      { on: false, s: '09:00', e: '17:00' }, // Sat
    ],
    windows: [{ s: '09:00', e: '11:00' }],
    family: { on: true, s: '19:00', e: '21:00', silence: true },
    quiet: { on: true, s: '21:00', e: '08:00' },
  };

  // Mon 2026-01-05 is a Monday.
  const mon = (h, m = 0) => new Date(2026, 0, 5, h, m);

  it('windowTime is true inside a window on a working day', () => {
    expect(Avail.windowTime(mon(10), st)).toBe(true);
  });

  it('windowTime is false outside the window', () => {
    expect(Avail.windowTime(mon(12), st)).toBe(false);
  });

  it('windowTime is false during quiet hours even if a window overlapped', () => {
    expect(Avail.windowTime(mon(22), st)).toBe(false);
  });

  it('working is true during working hours but outside the window', () => {
    expect(Avail.working(mon(12), st)).toBe(true);
    expect(Avail.windowTime(mon(12), st)).toBe(false);
  });

  it('inFamily / inQuiet detect their ranges', () => {
    expect(Avail.inFamily(mon(20), st)).toBe(true);
    expect(Avail.inQuiet(mon(23), st)).toBe(true);
    expect(Avail.inQuiet(mon(7), st)).toBe(true);
  });

  it('next finds the upcoming window and lands inside it', () => {
    const n = Avail.next(mon(12), st); // after today's window
    expect(n).toBeInstanceOf(Date);
    expect(Avail.windowTime(n, st)).toBe(true);
    // Next window is the following working day at 09:00.
    expect(n.getHours()).toBe(9);
  });

  it('next skips non-working days (Fri 12:00 -> Mon window)', () => {
    const fri = new Date(2026, 0, 9, 12, 0); // Friday after the window
    const n = Avail.next(fri, st);
    expect(n.getDay()).toBe(1); // Monday
    expect(n.getHours()).toBe(9);
  });

  it('describe produces human text', () => {
    expect(Avail.describe(null)).toBe('as soon as I can');
    const n = mon(9);
    expect(Avail.describe(n, mon(8))).toMatch(/today after/);
  });

  it('availableNow respects Family Time and offline override', () => {
    const base = { settings: st, family: { active: false }, offlineUntil: null };
    expect(availableNow({ ...base }, mon(10))).toBe(true);
    expect(availableNow({ ...base, family: { active: true } }, mon(10))).toBe(false);
    expect(availableNow({ ...base, offlineUntil: +mon(23) }, mon(10))).toBe(false);
  });
});
