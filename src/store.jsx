'use client';

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { load, save as saveState, stuName as stuNameFn, stu as stuFn, avColor as avColorFn, seed } from './lib/state.js';
import { Avail } from './lib/availability.js';
import { startFamily as startFamilyFn, endFamily as endFamilyFn } from './lib/actions.js';

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  // Defer state load to the client to stay SSR-safe (localStorage is browser-only).
  // Start with a fresh seed on the server / first render, then load the persisted
  // state after mount so server and first client render match.
  const Sref = useRef(seed());
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((t) => t + 1), []);
  const toastRef = useRef(null);

  const [route, setRoute] = useState({ name: 'home' });

  useEffect(() => {
    const hadStored = (() => { try { return !!localStorage.getItem('bc1'); } catch (e) { return false; } })();
    Sref.current = load();
    if (!hadStored) {
      // First run: skip the forced setup screen. Land on the dashboard with the
      // demo data ready to explore; setup stays available under More → Working
      // preferences.
      Sref.current.onboarded = true;
      saveState(Sref.current);
    }
    applyTheme(Sref.current.theme);
    setRoute({ name: 'home' });
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track real time spent in BalanceConnect (per local day) so the Home usage
  // widget has at least one genuine number. Accrues in ~15s ticks while the tab
  // is visible; persists to S.usage[dateKey].bc (minutes).
  useEffect(() => {
    let last = Date.now();
    const STEP = 15000;
    function accrue() {
      const now = Date.now();
      if (document.visibilityState === 'visible') {
        const mins = Math.min(2, (now - last) / 60000); // guard against long gaps
        const S = Sref.current;
        const key = dkLocal(new Date());
        S.usage = S.usage || {};
        S.usage[key] = S.usage[key] || {};
        S.usage[key].bc = (S.usage[key].bc || 0) + mins;
        saveState(S);
      }
      last = now;
    }
    const id = setInterval(accrue, STEP);
    const onHide = () => { if (document.visibilityState === 'hidden') accrue(); };
    document.addEventListener('visibilitychange', onHide);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onHide); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback((theme) => {
    Sref.current.theme = theme;
    applyTheme(theme);
    saveState(Sref.current);
    rerender();
  }, [rerender]);

  const saveFailed = useRef(false);
  const warnIfSaveFailed = useCallback((ok) => {
    if (!ok && !saveFailed.current) {
      saveFailed.current = true;
      toastRef.current?.('Couldn’t save your changes — your browser storage may be full or disabled. Your work is kept for now but may be lost on refresh.');
    } else if (ok) {
      saveFailed.current = false;
    }
  }, []);

  const save = useCallback(() => {
    const ok = saveState(Sref.current);
    warnIfSaveFailed(ok);
    return ok;
  }, [warnIfSaveFailed]);

  // Apply a mutation to the live state, persist, and re-render.
  const mutate = useCallback((fn) => {
    fn(Sref.current);
    const ok = saveState(Sref.current);
    warnIfSaveFailed(ok);
    rerender();
  }, [rerender, warnIfSaveFailed]);

  // Toast — supports an optional action button (e.g. Undo). Toasts with an
  // action stay longer so users have time to react.
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);
  const toast = useCallback((t, action) => {
    const payload = typeof t === 'string' ? { text: t, action } : t;
    setToastMsg(payload);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), payload.action ? 6000 : 3200);
  }, []);
  const dismissToast = useCallback(() => { clearTimeout(toastTimer.current); setToastMsg(null); }, []);
  toastRef.current = toast;

  const go = useCallback((name, p = {}) => {
    setRoute({ name, ...p });
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, []);
  // Patch route params without otherwise changing the view (ephemeral UI state).
  const patchRoute = useCallback((p) => setRoute((r) => ({ ...r, ...p })), []);

  // Confirm modal
  const [confirmState, setConfirmState] = useState(null);
  const confirmBox = useCallback((title, body, okLabel, cb, opts = {}) => {
    setConfirmState({ title, body, okLabel, cb, danger: !!opts.danger, secondary: opts.secondary || null });
  }, []);
  const closeConfirm = useCallback((run) => {
    setConfirmState((c) => { if (run && c && c.cb) c.cb(); return null; });
  }, []);
  const runConfirmSecondary = useCallback(() => {
    setConfirmState((c) => { if (c && c.secondary && c.secondary.onClick) c.secondary.onClick(); return null; });
  }, []);

  const value = {
    S: Sref.current, mutate, save, rerender,
    toast, toastMsg, dismissToast,
    route, go, patchRoute, setRoute,
    confirmBox, confirmState, closeConfirm, runConfirmSecondary,
    theme: Sref.current.theme, setTheme,
    stuName: (id) => stuNameFn(Sref.current, id),
    stu: (id) => stuFn(Sref.current, id),
    avColor: (id) => avColorFn(Sref.current, id),
  };

  // Avoid rendering the app (and touching browser-only state) until mounted.
  if (!mounted) return null;

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// Background tick: auto Family Time start/stop, offline expiry — mirrors original tick().
export function useTick() {
  const { S, toast, rerender } = useStore();
  useEffect(() => {
    function tick() {
      const st = S.settings, now = new Date(), inF = Avail.inFamily(now, st);
      let ch = false, toastMsg = null;
      if (S.offlineUntil && Date.now() > S.offlineUntil) { S.offlineUntil = null; ch = true; }
      if (S.family.endedOn && S.family.endedOn !== dkLocal(now)) { S.family.endedOn = null; ch = true; }
      if (inF && !S.family.active && !S.family.endedOn && S.onboarded) { startFamilyFn(S, false); toastMsg = '💛 Family Time has started'; ch = true; }
      else if (S.family.active && !S.family.manual && !inF) { endFamilyFn(S, false); ch = true; }
      if (ch) {
        saveState(S);
        if (toastMsg) toast(toastMsg);
        if (!document.activeElement || !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) rerender();
      }
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function dkLocal(d) {
  const pad = (n) => String(n).padStart(2, '0');
  d = new Date(d);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Apply the theme preference to <html>. 'system' removes the override so the
// OS prefers-color-scheme takes over; 'light'/'dark' force that theme.
function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (theme === 'light' || theme === 'dark') el.setAttribute('data-theme', theme);
  else el.removeAttribute('data-theme');
}
