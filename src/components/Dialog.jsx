'use client';

import React, { useEffect, useRef, useId } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog used for confirmations and the lesson editor.
 * - role="dialog" + aria-modal and a programmatic label/description
 * - traps Tab focus inside the dialog
 * - closes on Escape and on backdrop click
 * - moves focus in on open and restores it to the trigger on close
 * - respects the existing .sheet styling
 */
export default function Dialog({ title, titleId, describedById, onClose, children, className = '', labelledBy }) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  const autoTitleId = useId();
  const headingId = titleId || autoTitleId;

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    const panel = panelRef.current;

    // Move focus to the first focusable control (or the panel itself).
    const focusables = panel ? panel.querySelectorAll(FOCUSABLE) : [];
    if (focusables.length) focusables[0].focus();
    else if (panel) panel.focus();

    function onKeyDown(e) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const nodes = panel ? [...panel.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null || n === document.activeElement) : [];
      if (!nodes.length) { e.preventDefault(); return; }
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    document.addEventListener('keydown', onKeyDown, true);
    // Prevent background scroll while the dialog is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('dialog-open');

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove('dialog-open');
      // Restore focus to whatever opened the dialog.
      const el = previouslyFocused.current;
      if (el && typeof el.focus === 'function') el.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`sheet ${className}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || (title ? headingId : undefined)}
        aria-describedby={describedById}
        tabIndex={-1}
      >
        {title && <h2 id={headingId} style={{ fontSize: 20 }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
}
