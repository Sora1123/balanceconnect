import { describe, it, expect } from 'vitest';
import { occursOn, lessonsOn, upcomingOccurrence, repeatLabel } from '../src/lib/schedule.js';
import { dk, addDays } from '../src/lib/utils.js';

const base = (over) => ({ id: 'a', sid: 'yuki', s: '10:00', e: '11:00', subject: 'X', repeat: 'none', ...over });

describe('recurrence occursOn', () => {
  const anchor = '2026-01-05'; // Monday
  it('one-off occurs only on its own date', () => {
    const l = base({ date: anchor, anchor, repeat: 'none' });
    expect(occursOn(l, anchor)).toBe(true);
    expect(occursOn(l, '2026-01-12')).toBe(false);
  });
  it('weekly occurs every 7 days from the anchor', () => {
    const l = base({ date: anchor, anchor, repeat: 'weekly' });
    expect(occursOn(l, anchor)).toBe(true);
    expect(occursOn(l, '2026-01-12')).toBe(true);   // +7
    expect(occursOn(l, '2026-01-19')).toBe(true);   // +14
    expect(occursOn(l, '2026-01-13')).toBe(false);  // +8
  });
  it('biweekly occurs every 14 days from the anchor', () => {
    const l = base({ date: anchor, anchor, repeat: 'biweekly' });
    expect(occursOn(l, anchor)).toBe(true);
    expect(occursOn(l, '2026-01-12')).toBe(false);  // +7
    expect(occursOn(l, '2026-01-19')).toBe(true);   // +14
  });
  it('never occurs before the anchor', () => {
    const l = base({ date: anchor, anchor, repeat: 'weekly' });
    expect(occursOn(l, '2025-12-29')).toBe(false);
  });
  it('respects exception dates (exdates)', () => {
    const l = base({ date: anchor, anchor, repeat: 'weekly', exdates: ['2026-01-12'] });
    expect(occursOn(l, '2026-01-12')).toBe(false);
    expect(occursOn(l, '2026-01-19')).toBe(true);
  });
});

describe('lessonsOn', () => {
  it('expands recurring lessons into concrete occurrences sorted by time', () => {
    const lessons = [
      base({ id: 'a', date: '2026-01-05', anchor: '2026-01-05', repeat: 'weekly', s: '13:00', e: '14:00' }),
      base({ id: 'b', date: '2026-01-05', anchor: '2026-01-05', repeat: 'none', s: '09:00', e: '10:00' }),
    ];
    const on12 = lessonsOn(lessons, '2026-01-12'); // only the weekly one
    expect(on12.length).toBe(1);
    expect(on12[0].occurrenceOf).toBe('a');
    expect(on12[0].date).toBe('2026-01-12');
    const on5 = lessonsOn(lessons, '2026-01-05');
    expect(on5.map((l) => l.s)).toEqual(['09:00', '13:00']); // sorted
  });
});

describe('upcomingOccurrence', () => {
  it('finds the next occurrence within the horizon', () => {
    const anchorKey = dk(new Date());
    const lessons = [base({ id: 'a', date: anchorKey, anchor: anchorKey, repeat: 'weekly', s: '23:30', e: '23:59' })];
    const up = upcomingOccurrence(lessons, anchorKey, 30, false);
    expect(up).toBeTruthy();
    expect(up.occurrenceOf).toBe('a');
  });
});

describe('repeatLabel', () => {
  it('labels each cadence', () => {
    expect(repeatLabel('none')).toBe('One-off');
    expect(repeatLabel('weekly')).toBe('Weekly');
    expect(repeatLabel('biweekly')).toBe('Every 2 weeks');
    expect(repeatLabel(undefined)).toBe('One-off');
  });
});
