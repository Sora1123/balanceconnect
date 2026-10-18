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
    setRoute({ name: 'home' });
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = useCallback(() => saveState(Sref.current), []);

  // Apply a mutation to the live state, persist, and re-render.
  const mutate = useCallback((fn) => {
    fn(Sref.current);
    saveState(Sref.current);
    rerender();
  }, [rerender]);

  // Toast
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimer = useRef(null);
  const toast = useCallback((t) => {
    setToastMsg(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const go = useCallback((name, p = {}) => {
    setRoute({ name, ...p });
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }, []);
  // Patch route params without otherwise changing the view (ephemeral UI state).
  const patchRoute = useCallback((p) => setRoute((r) => ({ ...r, ...p })), []);

  // Confirm modal
  const [confirmState, setConfirmState] = useState(null);
  const confirmBox = useCallback((title, body, okLabel, cb) => {
    setConfirmState({ title, body, okLabel, cb });
  }, []);
  const closeConfirm = useCallback((run) => {
    setConfirmState((c) => { if (run && c && c.cb) c.cb(); return null; });
  }, []);

  const value = {
    S: Sref.current, mutate, save, rerender,
    toast, toastMsg,
    route, go, patchRoute, setRoute,
    confirmBox, confirmState, closeConfirm,
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
