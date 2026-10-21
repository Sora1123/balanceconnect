import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setOffset, getOffset, demoNow, installClock } from '../src/lib/clock.js';

describe('demo clock offset', () => {
  afterEach(() => setOffset(0));

  it('defaults to no offset', () => {
    expect(getOffset()).toBe(0);
  });

  it('setOffset shifts demoNow by the given milliseconds', () => {
    const real = Date.now();
    setOffset(5 * 864e5); // +5 days
    const shifted = +demoNow();
    // demoNow should be ~5 days ahead of the real clock.
    expect(shifted - real).toBeGreaterThan(5 * 864e5 - 2000);
    expect(shifted - real).toBeLessThan(5 * 864e5 + 2000);
  });

  it('ignores non-finite offsets (stays safe)', () => {
    setOffset(NaN);
    expect(getOffset()).toBe(0);
    setOffset(undefined);
    expect(getOffset()).toBe(0);
  });

  it('installClock is a no-op in a non-DOM (test) environment', () => {
    // No `window` in the Node test env, so the global Date must stay intact.
    const before = Date;
    installClock();
    expect(Date).toBe(before);
  });
});
