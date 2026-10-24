import { describe, it, expect } from 'vitest';
import { sanitizeState, sanitizeSettings, defaults, seed, makeTrackedApp } from '../src/lib/state.js';
import { range, metrics, buckets, usageBuckets, usageApps } from '../src/lib/analytics.js';
import { completeShutdown } from '../src/lib/actions.js';
import { addDays, dk, sod } from '../src/lib/utils.js';

describe('state sanitization / migration', () => {
  it('rejects null / wrong-version objects', () => {
    expect(sanitizeState(null)).toBeNull();
    expect(sanitizeState({ v: 2 })).toBeNull();
    expect(sanitizeState('nonsense')).toBeNull();
  });

  it('backfills missing settings fields from defaults', () => {
    const s = sanitizeSettings({ name: 'Mika' });
    expect(s.name).toBe('Mika');
    expect(Array.isArray(s.days)).toBe(true);
    expect(s.days.length).toBe(7);
    expect(s.windows.length).toBeGreaterThan(0);
    expect(s.family).toHaveProperty('on');
    expect(s.quiet).toHaveProperty('s');
    expect(['hold', 'except_family', 'always']).toContain(s.urgent);
  });

  it('repairs a partial v1 state so collections always exist', () => {
    const repaired = sanitizeState({ v: 1, students: [{ id: 'a', name: 'A' }] });
    expect(repaired).not.toBeNull();
    expect(Array.isArray(repaired.messages)).toBe(true);
    expect(Array.isArray(repaired.lessons)).toBe(true);
    expect(Array.isArray(repaired.acts)).toBe(true);
    expect(repaired.family).toMatchObject({ active: false });
    expect(repaired.rm).toMatchObject({ active: false, done: [], skip: [] });
  });

  it('drops malformed collection entries', () => {
    const repaired = sanitizeState({
      v: 1,
      students: [{ id: 'a', name: 'A' }, { name: 'no id' }, null],
      messages: [{ id: 'm1', thread: [] }, { id: 'bad' }, 42],
      lessons: [{ id: 'l1', date: '2026-01-01' }, { id: 'nope' }],
      acts: [{ type: 'msg', at: 1 }, { type: 'x' }, {}],
    });
    expect(repaired.students.length).toBe(1);
    expect(repaired.messages.length).toBe(1);
    expect(repaired.lessons.length).toBe(1);
    expect(repaired.acts.length).toBe(1);
  });

  it('sanitizing a fresh seed preserves it intact', () => {
    const s = seed();
    const repaired = sanitizeState(s);
    expect(repaired.students.length).toBe(s.students.length);
    expect(repaired.onboarded).toBe(s.onboarded);
  });

  it('defaults has a complete, valid shape', () => {
    const d = defaults();
    expect(d.days.length).toBe(7);
    expect(d.windows.length).toBeGreaterThan(0);
    expect(d.tpl).toContain('{next}');
  });
});

describe('analytics', () => {
  it('range returns an ordered [start,end) for week/month/year', () => {
    for (const p of ['week', 'month', 'year']) {
      const [a, b] = range(p);
      expect(a).toBeInstanceOf(Date);
      expect(b.getTime()).toBeGreaterThan(a.getTime());
    }
  });

  it('metrics aggregates counts and honours includeDemo', () => {
    const now = Date.now();
    const S = {
      includeDemo: true,
      lessons: [],
      acts: [
        { type: 'msg', at: now, after: true, demo: false },
        { type: 'msg', at: now, after: false, demo: true },
        { type: 'reply', at: now, dur: 120, ok: true, demo: false },
        { type: 'family', at: now, dur: 60, demo: false },
      ],
    };
    const m = metrics(S, now - 1000, now + 1000);
    expect(m.msgs).toBe(2);
    expect(m.after).toBe(1);
    expect(m.rep).toBe(1);
    expect(m.famMin).toBe(60);

    // Excluding demo should drop the demo-tagged message.
    const m2 = metrics({ ...S, includeDemo: false }, now - 1000, now + 1000);
    expect(m2.msgs).toBe(1);
  });

  it('buckets produces 7 entries for a week range', () => {
    const [a, b] = range('week');
    const A = [{ type: 'msg', at: +sod(a) + 1000, after: false }];
    const out = buckets('week', a, b, A);
    expect(out.length).toBe(7);
    expect(out.reduce((s, x) => s + x.in + x.af, 0)).toBeGreaterThanOrEqual(1);
  });

  it('the demo seed fills week, month and year with meaningful activity', () => {
    const S = seed();
    for (const p of ['week', 'month', 'year']) {
      const [a, b] = range(p);
      const M = metrics(S, a, b);
      // Enough activity to pass the view's "enough" gate (>=3) comfortably.
      expect(M.n, `${p} activity count`).toBeGreaterThanOrEqual(3);
      expect(M.msgs, `${p} messages`).toBeGreaterThan(0);
    }
  });

  it('year buckets span 12 months and carry message data', () => {
    const S = seed();
    const [a, b] = range('year');
    const M = metrics(S, a, b);
    const out = buckets('year', a, b, M.A);
    expect(out.length).toBe(12);
    const totalCharted = out.reduce((s, x) => s + x.in + x.af, 0);
    expect(totalCharted).toBeGreaterThan(0);
  });
});

describe('tracked websites (app-usage measurement)', () => {
  it('makeTrackedApp normalises URLs to a stable key + label', () => {
    expect(makeTrackedApp('https://www.figma.com/files')).toMatchObject({ key: 'web:figma.com', url: 'figma.com', label: 'Figma' });
    expect(makeTrackedApp('notion.so')).toMatchObject({ key: 'web:notion.so', url: 'notion.so' });
    expect(makeTrackedApp('   ')).toBeNull();
  });

  it('usageApps appends the user-added websites after the built-ins', () => {
    const S = { settings: { trackedApps: [{ key: 'web:figma.com', url: 'figma.com', label: 'Figma' }] } };
    const apps = usageApps(S);
    expect(apps.some((a) => a.key === 'bc')).toBe(true);
    const web = apps.find((a) => a.key === 'web:figma.com');
    expect(web).toBeTruthy();
    expect(web.web).toBe(true);
  });

  it('usageBuckets includes per-app values for tracked websites', () => {
    const S = seed();
    const [a, b] = range('year');
    const U = usageBuckets(S, 'year', a, b);
    expect(U.apps.some((x) => x.key === 'web:classroom.google.com')).toBe(true);
    expect(U.totals['web:classroom.google.com']).toBeGreaterThan(0);
    // Each bucket carries the per-app breakdown used by the line chart.
    expect(U.buckets[0].apps).toHaveProperty('web:quizlet.com');
  });
});

describe('demo analytics date range', () => {
  it('seeds usage for every day from 1 Jan to 30 Oct this year', () => {
    const S = seed();
    const year = new Date().getFullYear();
    const keys = Object.keys(S.usage).sort();
    expect(keys[0]).toBe(dk(new Date(year, 0, 1)));
    expect(keys[keys.length - 1]).toBe(dk(new Date(year, 9, 30)));
  });
});

describe('configurable end-of-day checklist', () => {
  it('defaults include five editable checklist items', () => {
    const items = defaults().shutdownItems;
    expect(items.length).toBe(5);
    for (const it of items) {
      expect(typeof it.key).toBe('string');
      expect(it.label.length).toBeGreaterThan(0);
    }
  });

  it('sanitize falls back to defaults when shutdownItems is empty/invalid', () => {
    expect(sanitizeSettings({ shutdownItems: [] }).shutdownItems.length).toBe(5);
    expect(sanitizeSettings({ shutdownItems: 'nope' }).shutdownItems.length).toBe(5);
  });

  it('completeShutdown records only the ticked items from settings', () => {
    const S = seed();
    S.settings.shutdownItems = [{ key: 'a', label: 'Pack up' }, { key: 'b', label: 'Log hours' }];
    completeShutdown(S, { a: true, b: false });
    const today = dk(new Date());
    expect(S.shutdowns[today].items).toEqual(['a']);
  });
});
