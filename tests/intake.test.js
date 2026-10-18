import { describe, it, expect } from 'vitest';
import { receive, sendReply, act } from '../src/lib/intake.js';
import { defaults } from '../src/lib/state.js';

function baseState() {
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
      auto: true,
      urgent: 'hold',
      notif: true,
    },
    students: [{ id: 'yuki', name: 'Yuki', isNew: false }],
    messages: [], acts: [],
    family: { active: false, manual: false, start: null, endedOn: null },
    offlineUntil: null,
    rm: { active: false, start: null, done: [], skip: [] },
  };
}

const noop = { save: () => {}, toast: () => {} };
// Monday 2026-01-05.
const mon = (h, m = 0) => new Date(2026, 0, 5, h, m);

describe('intake.receive', () => {
  it('a message inside a response window is awaiting (no auto-reply)', () => {
    const S = baseState();
    const r = receive(S, noop, 'yuki', 'quick question', mon(10), { quiet: true });
    expect(r.m.status).toBe('awaiting');
    expect(r.auto).toBeNull();
    expect(S.messages.length).toBe(1);
  });

  it('a message outside a window is queued with an auto-reply and an expected time', () => {
    const S = baseState();
    const r = receive(S, noop, 'yuki', 'hello after hours', mon(13), { quiet: true });
    expect(r.m.status).toBe('queued');
    expect(r.auto).toBeTypeOf('string');
    expect(r.m.exp).toBeTypeOf('number');
    // The auto-reply mentions the next reply time.
    expect(r.m.thread.some((t) => t.f === 'a')).toBe(true);
  });

  it('urgent keyword sets the urgent flag', () => {
    const S = baseState();
    const r = receive(S, noop, 'yuki', 'URGENT please help', mon(13), { quiet: true });
    expect(r.m.urgent).toBe(true);
  });

  it('logs a msg activity record for analytics', () => {
    const S = baseState();
    receive(S, noop, 'yuki', 'hi', mon(13), { quiet: true });
    expect(S.acts.some((a) => a.type === 'msg')).toBe(true);
  });

  it('records a silenced activity when a non-urgent message arrives in quiet hours', () => {
    const S = baseState();
    receive(S, noop, 'yuki', 'late night note', mon(23), { quiet: true });
    expect(S.acts.some((a) => a.type === 'silenced')).toBe(true);
  });
});

describe('intake.sendReply', () => {
  it('marks the message replied, read, and logs a reply activity', () => {
    const S = baseState();
    receive(S, noop, 'yuki', 'hello', mon(13), { quiet: true });
    const id = S.messages[0].id;
    sendReply(S, noop, id, 'Here is my answer');
    const m = S.messages.find((x) => x.id === id);
    expect(m.status).toBe('replied');
    expect(m.read).toBe(true);
    expect(m.thread.some((t) => t.f === 'm' && t.t === 'Here is my answer')).toBe(true);
    expect(S.acts.some((a) => a.type === 'reply')).toBe(true);
  });
});

describe('intake.act', () => {
  it('pushes a normalized activity entry', () => {
    const S = { acts: [] };
    act(S, 'family', mon(19), { dur: 60 });
    expect(S.acts[0]).toMatchObject({ type: 'family', dur: 60 });
    expect(S.acts[0].at).toBeTypeOf('number');
  });
});
