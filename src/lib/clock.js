// Demo clock.
//
// Lets the demo pretend "now" is a different day/time without waiting for the
// real clock. We install a one-time patch on the global Date so that every
// `new Date()` and `Date.now()` across the app reflects the chosen demo time —
// avoiding threading a clock parameter through dozens of call sites. Only the
// zero-argument `new Date()` and `Date.now()` are shifted; `new Date(args)`
// keeps its normal behaviour.
//
// This is intentionally scoped to this (backend-less) demo app. An offset of 0
// means real time, so the feature is fully reversible.

let offsetMs = 0;
let installed = false;

export function getOffset() {
  return offsetMs;
}

export function setOffset(ms) {
  offsetMs = Number.isFinite(ms) ? ms : 0;
}

// The current demo time as a real Date (uses the unpatched clock internally).
export function demoNow() {
  return new _RealDate(_RealNow() + offsetMs);
}

// Captured real references (set at install time).
let _RealDate = Date;
let _RealNow = () => Date.now();

export function installClock() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const RealDate = Date;
  _RealDate = RealDate;
  _RealNow = RealDate.now.bind(RealDate);

  // A Date subclass whose no-arg form is shifted by the demo offset.
  function PatchedDate(...args) {
    if (!(this instanceof PatchedDate)) {
      // Date() called as a function returns a string of "now".
      return new RealDate(RealDate.now() + offsetMs).toString();
    }
    if (args.length === 0) return new RealDate(RealDate.now() + offsetMs);
    return new RealDate(...args);
  }
  // Inherit everything from the real Date.
  PatchedDate.prototype = RealDate.prototype;
  PatchedDate.now = () => RealDate.now() + offsetMs;
  PatchedDate.parse = RealDate.parse;
  PatchedDate.UTC = RealDate.UTC;

  // Replace the global binding that all modules resolve `Date` against.
  try { globalThis.Date = PatchedDate; } catch (e) { /* ignore */ }
}

// Start of a given local day (00:00) as an absolute ms timestamp, using the
// real clock so computing offsets is independent of the current offset.
export function startOfRealDay(d) {
  const x = new _RealDate(d);
  x.setHours(0, 0, 0, 0);
  return +x;
}
