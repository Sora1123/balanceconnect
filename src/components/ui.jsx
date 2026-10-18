import React from 'react';
import { useStore } from '../store.jsx';
import { initials } from '../lib/utils.js';
import { CAT } from '../lib/triage.js';
import Dialog from './Dialog.jsx';

// Avatar bubble with student initials + category colour.
export function Avatar({ sid }) {
  const { stuName, avColor } = useStore();
  return (
    <div className="av" style={{ background: avColor(sid) }}>{initials(stuName(sid))}</div>
  );
}

export const ICON = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  inbox: 'M4 5h16v11H15l-3 3-3-3H4z',
  schedule: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  analytics: 'M5 20V11M12 20V5M19 20v-7',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
};

export function NavIcon({ path }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

// Status chip(s) for a message.
export function StatusChip({ m }) {
  if (m.status === 'archived') return <span className="chip c-archived">Archived</span>;
  const labels = { queued: 'Queued', awaiting: 'Awaiting reply', replied: 'Replied', followup: 'Follow-up' };
  return (
    <>
      {m.urgent && <span className="chip c-urgent">Urgent</span>}
      <span className={`chip c-${m.status}`}>{labels[m.status]}</span>
    </>
  );
}

export function CatChip({ cat }) {
  return <span className="chip">{CAT[cat][0]}</span>;
}

// Page header with a back button.
export function Head({ title, back = 'home' }) {
  const { go } = useStore();
  return (
    <div className="row">
      <button className="btn ghost sm" onClick={() => go(back)}>
        <span aria-hidden="true">←</span> Back
      </button>
      <h2 className="grow">{title}</h2>
    </div>
  );
}

export function Toast() {
  const { toastMsg, dismissToast } = useStore();
  const data = typeof toastMsg === 'string' ? { text: toastMsg } : toastMsg;
  return (
    <div id="toast-region" aria-live="polite" aria-atomic="true" className="sr-live">
      {data && (
        <div id="toast" role="status">
          <span>{data.text}</span>
          {data.action && (
            <button
              className="toast-action"
              onClick={() => { data.action.onClick(); dismissToast(); }}
            >
              {data.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ConfirmModal() {
  const { confirmState, closeConfirm } = useStore();
  if (!confirmState) return null;
  const { title, body, okLabel, danger } = confirmState;
  return (
    <Dialog title={title} onClose={() => closeConfirm(false)} describedById="confirm-desc">
      <p className="sm" id="confirm-desc">{body}</p>
      <div className="row">
        <button className="btn ghost grow" onClick={() => closeConfirm(false)}>Cancel</button>
        <button className={`btn grow ${danger ? 'danger' : ''}`} onClick={() => closeConfirm(true)}>{okLabel}</button>
      </div>
    </Dialog>
  );
}

// Illustrations (decorative SVGs ported verbatim).
export function IllLaptop() {
  return (
    <svg className="ill" viewBox="0 0 120 100" aria-hidden="true">
      <circle cx="60" cy="52" r="46" fill="var(--lav)" />
      <path d="M38 92c2-20 12-28 22-28s20 8 22 28z" fill="var(--sage)" />
      <circle cx="60" cy="44" r="13" fill="#F3CBA8" />
      <path d="M46 44c-1-13 8-18 15-18s15 5 14 18c-3-6-8-9-14-9s-11 3-15 9z" fill="#4A3B5C" />
      <path d="M47 44c-3 10-2 18 2 22M73 44c3 10 2 18-2 22" stroke="#4A3B5C" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="34" y="70" width="52" height="22" rx="3" fill="var(--pur)" />
      <rect x="28" y="91" width="64" height="4" rx="2" fill="var(--muted)" />
      <circle cx="60" cy="81" r="3" fill="var(--card)" />
      <path d="M94 22c4 0 6 3 6 6M18 30c0-4 3-6 6-6" stroke="var(--peach)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function IllFamily() {
  return (
    <svg className="ill big" viewBox="0 0 200 140" aria-hidden="true">
      <ellipse cx="100" cy="128" rx="92" ry="10" fill="var(--sage-s)" />
      <circle cx="100" cy="70" r="62" fill="var(--peach-s)" />
      <path d="M52 128c2-30 14-44 30-44s28 14 30 44z" fill="var(--pur)" />
      <circle cx="82" cy="62" r="15" fill="#F3CBA8" />
      <path d="M66 62c-1-16 9-21 17-21s17 6 15 21c-3-7-9-10-15-10s-13 3-17 10z" fill="#4A3B5C" />
      <path d="M67 62c-4 12-2 20 2 25" stroke="#4A3B5C" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M104 128c1-20 9-30 20-30s19 10 20 30z" fill="var(--sage)" />
      <circle cx="124" cy="86" r="11" fill="#F3CBA8" />
      <path d="M113 85c0-10 6-14 11-14s12 4 11 14c-3-5-7-6-11-6s-8 1-11 6z" fill="#5B4636" />
      <path d="M96 104q14-8 22 0" stroke="#F3CBA8" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M150 34c4-6 12-6 12 2 0 6-12 12-12 12s-12-6-12-12c0-8 8-8 12-2z" fill="var(--rose)" />
      <circle cx="40" cy="40" r="3" fill="var(--peach)" />
      <circle cx="168" cy="70" r="2.5" fill="var(--pur)" />
    </svg>
  );
}
