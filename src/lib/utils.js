// Pure date/time/string utilities ported from the original app.

export const esc = (s) => String(s ?? ''); // React escapes by default; kept for parity where raw strings are used
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const ORDER = [1, 2, 3, 4, 5, 6, 0];

export const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const minOf = (d) => d.getHours() * 60 + d.getMinutes();
// overnight-aware: 21:00–08:00 contains 23:00 and 07:00
export const inRange = (m, s, e) => { s = toMin(s); e = toMin(e); return s < e ? (m >= s && m < e) : s > e ? (m >= s || m < e) : false; };
export const pad = (n) => String(n).padStart(2, '0');
export const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const fmtT = (t) => { let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${pad(m)} ${ap}`; };
export const fmtD = (d) => fmtT(hm(new Date(d)));
export const dk = (d) => { d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const atDate = (key, t) => { const [y, mo, da] = key.split('-').map(Number); const [h, m] = t.split(':').map(Number); return new Date(y, mo - 1, da, h, m); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const sod = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const uid = () => Math.random().toString(36).slice(2, 9);
export const ago = (t) => {
  const m = (Date.now() - t) / 6e4;
  if (m < 0) return 'sim · ' + new Date(t).toLocaleDateString(undefined, { weekday: 'short' }) + ' ' + fmtD(t);
  if (m < 60) return Math.max(1, Math.round(m)) + 'm ago';
  if (m < 1440) return Math.round(m / 60) + 'h ago';
  return new Date(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
};
export const dur = (m) => m < 60 ? Math.round(m) + ' min' : (m / 60).toFixed(m < 600 ? 1 : 0) + ' h';
export const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2);
export const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
export const isLive = (d) => Math.abs(d - Date.now()) < 6e4;
