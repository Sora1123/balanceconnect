import { describe, it, expect } from 'vitest';
import { classify, tier, score, openMsgs, byTriage, CAT } from '../src/lib/triage.js';

const S = {
  students: [
    { id: 'yuki', name: 'Yuki Tanaka', isNew: false },
    { id: 'aoi', name: 'Aoi Nakamura', isNew: true },
  ],
};

describe('triage classify', () => {
  it('detects scheduling intent regardless of student', () => {
    expect(classify(S, 'yuki', 'Can we reschedule Thursday?')).toBe('scheduling');
    expect(classify(S, 'yuki', 'Please cancel my lesson')).toBe('scheduling');
  });

  it('classifies new students / enquiry language as enquiry', () => {
    expect(classify(S, 'aoi', 'Hi, interested in starting lessons')).toBe('enquiry');
    expect(classify(S, 'yuki', 'What are your rates?')).toBe('enquiry');
  });

  it('classifies known students as existing', () => {
    expect(classify(S, 'yuki', 'I have a question about homework')).toBe('existing');
  });

  it('returns other for unknown senders', () => {
    expect(classify(S, 'ghost', 'hello')).toBe('other');
  });
});

describe('triage scoring and ordering', () => {
  const now = Date.now();
  const mk = (over) => ({ id: Math.random().toString(36).slice(2), at: now, pri: 'auto', status: 'queued', cat: 'other', urgent: false, ...over });

  it('tier promotes urgent above its category', () => {
    expect(tier(mk({ cat: 'existing', urgent: true }))).toBe('urgent');
    expect(tier(mk({ cat: 'existing', urgent: false }))).toBe('existing');
  });

  it('score honours explicit priority over category', () => {
    const high = mk({ cat: 'other', pri: 'high' });
    const auto = mk({ cat: 'other', pri: 'auto' });
    expect(score(high)).toBeGreaterThan(score(auto));
  });

  it('byTriage orders urgent → scheduling → existing → enquiry → other', () => {
    const msgs = [
      mk({ cat: 'other' }),
      mk({ cat: 'enquiry' }),
      mk({ cat: 'existing' }),
      mk({ cat: 'scheduling' }),
      mk({ cat: 'other', urgent: true }),
    ];
    const ordered = byTriage(msgs).map(tier);
    expect(ordered).toEqual(['urgent', 'scheduling', 'existing', 'enquiry', 'other']);
  });

  it('openMsgs returns only queued/awaiting messages', () => {
    const S2 = { messages: [
      mk({ status: 'queued' }), mk({ status: 'awaiting' }),
      mk({ status: 'replied' }), mk({ status: 'archived' }),
    ] };
    expect(openMsgs(S2).length).toBe(2);
  });

  it('CAT weights are strictly descending by priority', () => {
    expect(CAT.urgent[1]).toBeGreaterThan(CAT.scheduling[1]);
    expect(CAT.scheduling[1]).toBeGreaterThan(CAT.existing[1]);
    expect(CAT.existing[1]).toBeGreaterThan(CAT.enquiry[1]);
    expect(CAT.enquiry[1]).toBeGreaterThan(CAT.other[1]);
  });
});
